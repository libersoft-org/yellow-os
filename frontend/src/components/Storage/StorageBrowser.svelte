<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import { entryIcon, entryIconColor, loadDirectoryEntries, getExtension } from '../../scripts/fs/file-entry.ts';
	import { readDirectory, joinPath, emptyTrash } from '../../scripts/fs/opfs.ts';
	import { isLinkFile, readLink, resolveLink, createLinksForEntries } from '../../scripts/fs/link.ts';
	import { openWindow, findWindow } from '../../scripts/window/window-store.svelte.ts';
	import { getFileHandler, getEditHandler } from '../../scripts/fs/file-types.ts';
	import { getAppComponent } from '../../scripts/system/app-registry.ts';
	import { notifyDirectoryChange, onDirectoryChange } from '../../scripts/fs/opfs-notify.ts';
	import { confirmDeleteMultiple, openRenameDialog, openNewEntryDialog, warnSystemMove } from '../../scripts/fs/file-actions.ts';
	import { downloadEntries } from '../../scripts/fs/download.ts';
	import { showDialog, showErrorDialog } from '../../scripts/ui/dialog.ts';
	import { setClipboard, hasClipboard, pasteClipboard, getClipboard } from '../../scripts/fs/clipboard.svelte.ts';
	import { moveWithConflicts, copyWithConflicts, uploadNativeFiles } from '../../scripts/fs/file-conflict.ts';
	import { ensureOpfsReady, OS_PATH } from '../../scripts/fs/opfs-init.ts';
	import { registerDropZone, isGlobalDragActive } from '../../scripts/ui/drag-state.svelte.ts';
	import { settings } from '../../scripts/system/settings.svelte.ts';
	import type { IconGridItemData } from '../IconGrid/icon-grid.ts';
	import IconGrid from '../IconGrid/IconGrid.svelte';
	import List from '../List/List.svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import StorageProperties from './StorageProperties.svelte';
	import type { Component } from 'svelte';
	import type { ContextMenuItem } from '../ContextMenu/context-menu.ts';
	interface Props {
		path: string;
		viewMode?: 'grid' | 'list';
		columnFirst?: boolean;
		hideLinkExtension?: boolean;
		hideEmptyLabel?: boolean;
		extraEmptySpaceMenuItems?: ContextMenuItem[];
		onnavigate?: (path: string) => void;
		onfileopen?: (path: string, name: string) => void;
		onselectionchange?: (entries: FileEntry[]) => void;
		onitemsmove?: (moves: { id: string; gridX: number; gridY: number }[]) => void;
		onentrieschange?: (entries: FileEntry[]) => void;
	}
	let { path, viewMode = 'grid', columnFirst, hideLinkExtension, hideEmptyLabel, extraEmptySpaceMenuItems, onnavigate, onfileopen, onselectionchange, onitemsmove, onentrieschange }: Props = $props();
	let entries = $state<FileEntry[]>([]);
	let contextMenu = $state<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
	let _selectedIds = $state(new Set<string>());
	let nativeDragOver = $state(false);
	let iconGrid = $state<IconGrid>();
	let listView = $state<List>();
	type SortField = 'name' | 'modified' | 'extension' | 'size';
	type SortDirection = 'asc' | 'desc';
	let sortField = $state<SortField>('name');
	let sortDirection = $state<SortDirection>('asc');

	function compareEntries(a: FileEntry, b: FileEntry, field: SortField, direction: SortDirection): number {
		let result: number;
		switch (field) {
			case 'name':
				result = a.name.localeCompare(b.name);
				break;
			case 'modified':
				result = a.modified - b.modified;
				break;
			case 'extension':
				result = getExtension(a.name).localeCompare(getExtension(b.name)) || a.name.localeCompare(b.name);
				break;
			case 'size':
				result = a.size - b.size;
				break;
		}
		return direction === 'desc' ? -result : result;
	}

	const DESKTOP_PATH = OS_PATH + '/Desktop';
	const virtualEntries = $derived<FileEntry[]>(path === DESKTOP_PATH && settings.desktopTrash ? [{ name: 'Trash', type: 'directory' as const, size: 0, modified: 0, virtualPath: '/Trash' }] : []);
	const allEntries = $derived.by(() => {
		const virtual = virtualEntries ?? [];
		if (virtual.length === 0) return entries;
		const virtualNames = new Set(virtual.map(e => e.name));
		return [
			...virtual,
			...entries.filter(e => {
				if (isLinkFile(e.name) && virtualNames.has(e.name.slice(0, -5))) return false;
				return !virtualNames.has(e.name);
			}),
		];
	});
	const sortedEntries = $derived.by(() => {
		const field = sortField;
		const direction = sortDirection;
		return allEntries.toSorted((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return compareEntries(a, b, field, direction);
		});
	});
	const selectedEntries = $derived(sortedEntries.filter(e => _selectedIds.has(e.name)));

	function displayLabel(name: string): string {
		if (hideLinkExtension && isLinkFile(name)) return name.slice(0, -5);
		return name;
	}

	function entryFullPath(entry: FileEntry): string {
		return entry.virtualPath ?? joinPath(path, entry.name);
	}

	function entrySourcePath(entry: FileEntry): string {
		if (!entry.virtualPath) return path;
		const i = entry.virtualPath.lastIndexOf('/');
		return i <= 0 ? '/' : entry.virtualPath.slice(0, i);
	}

	function trashAwareIcon(e: FileEntry): string {
		if (e.name === 'Trash' && e.type === 'directory') return trashEmpty ? '/img/trash-empty.svg' : '/img/trash-full.svg';
		return entryIcon(e);
	}

	const iconViewItems = $derived<IconGridItemData[]>(
		sortedEntries.map(e => ({
			id: e.name,
			icon: trashAwareIcon(e),
			label: displayLabel(e.name),
			iconColor: entryIconColor(e),
			droppable: e.type === 'directory',
		}))
	);

	const cutItemIds = $derived.by<Set<string>>(() => {
		const cb = getClipboard();
		if (cb.mode !== 'cut') return new Set();
		const names = new Set<string>();
		for (const entry of cb.entries) {
			if (entry.path === path) names.add(entry.name);
		}
		return names;
	});

	let loadGeneration = 0;

	async function loadDirectory(): Promise<void> {
		const gen = ++loadGeneration;
		await ensureOpfsReady();
		if (gen !== loadGeneration) return;
		try {
			entries = await loadDirectoryEntries(path);
		} catch {
			entries = [];
		}
		if (gen !== loadGeneration) return;
		onentrieschange?.(entries);
		if (_selectedIds.size > 0) onselectionchange?.(selectedEntries);
	}

	let unsubscribeDir: (() => void) | null = null;

	function subscribeToDirectory(): void {
		unsubscribeDir?.();
		unsubscribeDir = onDirectoryChange(path, () => loadDirectory());
	}

	let externalDragOverId = $state<string | null>(null);
	let trashEmpty = $state(true);
	let unsubscribeTrash: (() => void) | null = null;

	async function checkTrashEmpty(): Promise<void> {
		try {
			const trashEntries = await readDirectory('/Trash');
			trashEmpty = trashEntries.length === 0;
		} catch {
			trashEmpty = true;
		}
	}

	function onGlobalPointerMove(e: PointerEvent): void {
		if (!isGlobalDragActive()) {
			if (externalDragOverId) externalDragOverId = null;
			return;
		}
		const hit = getDropTargetAtScreen(e.clientX, e.clientY);
		externalDragOverId = hit?.droppable ? hit.id : null;
	}

	onMount(() => {
		loadDirectory();
		subscribeToDirectory();
		checkTrashEmpty();
		unsubscribeTrash = onDirectoryChange('/Trash', () => checkTrashEmpty());
		document.addEventListener('pointermove', onGlobalPointerMove);
	});

	onDestroy(() => {
		unsubscribeDir?.();
		unsubscribeTrash?.();
		if (typeof document !== 'undefined') document.removeEventListener('pointermove', onGlobalPointerMove);
	});

	function onGridSelectionChange(selectedIds: Set<string>): void {
		_selectedIds = selectedIds;
		onselectionchange?.(selectedEntries);
	}

	function handleRenamed(oldName: string, newName: string): void {
		iconGrid?.renamePosition(oldName, newName);
	}

	function focusGrid(): void {
		if (viewMode === 'list') listView?.focus();
		else iconGrid?.focus();
	}

	function getDropTargetAtScreen(x: number, y: number): { id: string; droppable: boolean } | null {
		const item = viewMode === 'list' ? listView?.getItemAtScreen(x, y) : iconGrid?.getItemAtScreen(x, y);
		return item ? { id: item.id, droppable: item.droppable ?? false } : null;
	}

	function onDblClick(item: IconGridItemData): void {
		const entry = sortedEntries.find(e => e.name === item.id);
		if (entry) openEntry(entry);
	}

	async function openEntry(entry: FileEntry): Promise<void> {
		if (entry.type === 'directory') {
			const fullPath = entryFullPath(entry);
			if (onnavigate) {
				onnavigate(fullPath);
			} else {
				const FileBrowser = getAppComponent('file-browser');
				if (FileBrowser) openWindow(FileBrowser, { path: fullPath });
			}
		} else if (onfileopen) onfileopen(path, entry.name);
		else if (isLinkFile(entry.name)) {
			const linkData = await readLink(path, entry.name);
			if (!linkData) {
				showDialog({ title: 'Invalid shortcut', message: `"${entry.name}" is not a valid shortcut file.`, type: 'warning', buttons: [{ label: 'OK' }] });
				return;
			}
			const resolved = resolveLink(linkData);
			if (!resolved) {
				showDialog({ title: 'Application not found', message: `The application "${linkData.appId}" required by "${entry.name}" was not found.`, type: 'warning', buttons: [{ label: 'OK' }] });
				return;
			}
			openWindow(resolved.component, resolved.props);
		} else {
			const handler = await getFileHandler(path, entry.name);
			if (handler) openWindow(handler.component, handler.props);
			else showDialog({ title: 'Cannot open file', message: `There is no application associated with the file type of "${entry.name}".`, type: 'error', buttons: [{ label: 'OK' }] });
		}
	}

	function editEntry(entry: FileEntry): void {
		if (entry.type === 'file') {
			const handler = getEditHandler(path, entry.name);
			openWindow(handler.component, handler.props);
		}
	}

	function getIconMenuItems(entry: FileEntry): ContextMenuItem[] {
		const items: ContextMenuItem[] = [];
		const isTrashDirectory = entry.type === 'directory' && entry.name === 'Trash' && (path === '/' || path === '' || entry.virtualPath === '/Trash');
		if (isTrashDirectory) {
			items.push({
				icon: '/img/trash-full.svg',
				label: 'Empty trash',
				disabled: trashEmpty,
				onclick: () => {
					showDialog({
						title: 'Empty Trash',
						message: 'Are you sure you want to permanently delete all items in Trash? This action cannot be undone.',
						type: 'question' as const,
						buttons: [
							{
								label: 'Empty Trash',
								backgroundColorVariable: '--color-danger',
								colorVariable: '--color-accent-fg',
								onclick: async () => {
									await emptyTrash();
									notifyDirectoryChange('/Trash');
								},
							},
							{ label: 'Cancel' },
						],
					});
				},
			});
			items.push({ separator: true });
		}
		items.push({ icon: '/img/open.svg', label: 'Open', onclick: () => openEntry(entry) });
		if (entry.type === 'directory' && onnavigate) {
			items.push({
				icon: '/img/open.svg',
				label: 'Open in new window',
				onclick: () => {
					const FileBrowser = getAppComponent('file-browser');
					const fullPath = entryFullPath(entry);
					if (FileBrowser) openWindow(FileBrowser, { path: fullPath });
				},
			});
		}
		if (entry.type === 'file') items.push({ icon: '/img/apps/text-editor.svg', label: 'Edit', onclick: () => editEntry(entry) });
		const srcPath = entrySourcePath(entry);
		const toCopy = selectedEntries.length > 1 ? selectedEntries : [entry];
		items.push(
			{ separator: true },
			{
				icon: '/img/copy.svg',
				label: 'Copy',
				onclick: () =>
					setClipboard(
						toCopy.map(en => ({ path: entrySourcePath(en), name: en.name, type: en.type })),
						'copy'
					),
			},
			{
				icon: '/img/cut.svg',
				label: 'Cut',
				onclick: () =>
					setClipboard(
						toCopy.map(en => ({ path: entrySourcePath(en), name: en.name, type: en.type })),
						'cut'
					),
			},
			...(entry.type === 'directory' ? [{ icon: '/img/paste.svg', label: 'Paste', disabled: !hasClipboard(), onclick: () => pasteClipboard(entryFullPath(entry)) }] : []),
			{ separator: true }
		);
		const toDownload = selectedEntries.length > 1 ? selectedEntries : [entry];
		items.push({
			icon: '/img/download.svg',
			label: 'Download',
			onclick: () =>
				downloadEntries(
					srcPath,
					toDownload.map(en => ({ name: en.name, type: en.type }))
				),
		});
		if (selectedEntries.length <= 1) {
			items.push({ icon: '/img/rename.svg', label: 'Rename', onclick: () => openRenameDialog(srcPath, entry.name, entry.type, handleRenamed, focusGrid) });
		}
		items.push({
			icon: '/img/trash-full.svg',
			label: 'Delete',
			onclick: (e: MouseEvent) => {
				const toDelete = selectedEntries.length > 1 ? selectedEntries : [entry];
				const groups = new Map<string, { name: string; type: 'file' | 'directory' }[]>();
				for (const en of toDelete) {
					const src = entrySourcePath(en);
					let list = groups.get(src);
					if (!list) {
						list = [];
						groups.set(src, list);
					}
					list.push({ name: en.name, type: en.type });
				}
				for (const [src, list] of groups) {
					confirmDeleteMultiple(src, list, e.shiftKey || path === '/Trash', focusGrid);
				}
			},
		});
		items.push(
			{ separator: true },
			{
				icon: '/img/dialog/info.svg',
				label: 'Properties',
				onclick: () => {
					const targets = selectedEntries.length > 1 ? selectedEntries : [entry];
					const multi = targets.length > 1;
					const windowId = openWindow(StorageProperties as Component, multi ? { entries: targets, path } : { entry, path });
					const win = findWindow(windowId);
					if (win) {
						win.title = multi ? `${targets.length} items — Properties` : `${entry.name} — Properties`;
						win.icon = multi ? '/img/dialog/info.svg' : entryIcon(entry);
						win.width = 300;
						win.height = 320;
						win.minWidth = 250;
						win.minHeight = 250;
						win.position = 'center';
					}
				},
			}
		);
		return items;
	}

	function setSortField(field: SortField): void {
		sortField = field;
		iconGrid?.clearPositions();
	}

	function setSortDirection(direction: SortDirection): void {
		sortDirection = direction;
		iconGrid?.clearPositions();
	}

	function onContextMenu(e: MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();
		const iconEl = (e.target as HTMLElement).closest('[data-icon-id]');
		if (iconEl) {
			const id = (iconEl as HTMLElement).dataset['iconId']!;
			if (!_selectedIds.has(id)) {
				if (viewMode === 'list') listView?.selectSingle(id);
				else iconGrid?.selectSingle(id);
			}
			const entry = sortedEntries.find(en => en.name === id);
			if (entry) contextMenu = { x: e.clientX, y: e.clientY, items: getIconMenuItems(entry) };
		} else {
			const clickX = e.clientX;
			const clickY = e.clientY;
			function placeAtClick(finalName: string): void {
				if (!iconGrid) return;
				const gridPos = iconGrid.screenToGrid(clickX, clickY);
				iconGrid.schedulePositions(new Map([[finalName, gridPos]]));
			}
			contextMenu = {
				x: e.clientX,
				y: e.clientY,
				items: [
					{
						icon: '/img/settings.svg',
						label: 'Sort by',
						children: [{ icon: sortField === 'name' ? '/img/check.svg' : undefined, label: 'Name', onclick: () => setSortField('name') }, { icon: sortField === 'modified' ? '/img/check.svg' : undefined, label: 'Modification date', onclick: () => setSortField('modified') }, { icon: sortField === 'extension' ? '/img/check.svg' : undefined, label: 'Extension', onclick: () => setSortField('extension') }, { icon: sortField === 'size' ? '/img/check.svg' : undefined, label: 'Size', onclick: () => setSortField('size') }, { separator: true }, { icon: sortDirection === 'asc' ? '/img/check.svg' : undefined, label: 'Ascending', onclick: () => setSortDirection('asc') }, { icon: sortDirection === 'desc' ? '/img/check.svg' : undefined, label: 'Descending', onclick: () => setSortDirection('desc') }],
					},
					{
						label: 'Select all',
						onclick: () => {
							if (viewMode === 'list') listView?.selectAll();
							else iconGrid?.selectAll();
						},
					},
					{ separator: true },
					{
						icon: '/img/paste.svg',
						label: 'Paste',
						disabled: !hasClipboard(),
						onclick: async () => {
							const nameMap = await pasteClipboard(path);
							if (iconGrid && nameMap.size > 0) {
								const gridPos = iconGrid.screenToGrid(clickX, clickY);
								const positions = new Map<string, { gridX: number; gridY: number }>();
								for (const [, finalName] of nameMap) positions.set(finalName, gridPos);
								iconGrid.schedulePositions(positions);
							}
						},
					},
					{ separator: true },
					{ icon: '/img/file.svg', label: 'New file', onclick: () => openNewEntryDialog(path, 'file', placeAtClick) },
					{ icon: '/img/directory.svg', label: 'New directory', onclick: () => openNewEntryDialog(path, 'directory', placeAtClick) },
					...(extraEmptySpaceMenuItems ?? []),
				],
			};
		}
	}

	function isCopy(e: KeyboardEvent): boolean {
		return ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) || (e.ctrlKey && e.key === 'Insert');
	}
	function isCut(e: KeyboardEvent): boolean {
		return (e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X');
	}
	function isPaste(e: KeyboardEvent): boolean {
		return ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) || (e.shiftKey && e.key === 'Insert');
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (isCopy(e) && selectedEntries.length > 0) {
			e.preventDefault();
			setClipboard(
				selectedEntries.map(en => ({ path: entrySourcePath(en), name: en.name, type: en.type })),
				'copy'
			);
			return;
		}
		if (isCut(e) && selectedEntries.length > 0) {
			e.preventDefault();
			setClipboard(
				selectedEntries.map(en => ({ path: entrySourcePath(en), name: en.name, type: en.type })),
				'cut'
			);
			return;
		}
		if (isPaste(e) && hasClipboard()) {
			e.preventDefault();
			pasteClipboard(path);
			return;
		}
		if (e.key === 'Delete' && selectedEntries.length > 0) {
			e.preventDefault();
			const groups = new Map<string, { name: string; type: 'file' | 'directory' }[]>();
			for (const en of selectedEntries) {
				const src = entrySourcePath(en);
				let list = groups.get(src);
				if (!list) {
					list = [];
					groups.set(src, list);
				}
				list.push({ name: en.name, type: en.type });
			}
			for (const [src, list] of groups) {
				confirmDeleteMultiple(src, list, e.shiftKey || path === '/Trash', focusGrid);
			}
		}
		if (e.key === 'F2' && selectedEntries.length === 1) {
			e.preventDefault();
			const en = selectedEntries[0]!;
			openRenameDialog(entrySourcePath(en), en.name, en.type, handleRenamed, focusGrid);
		}
	}

	function computeDropPositions(basePos: { gridX: number; gridY: number }, offsets: Map<string, { dx: number; dy: number }>, nameMap: Map<string, string>): Map<string, { gridX: number; gridY: number }> {
		const positions = new Map<string, { gridX: number; gridY: number }>();
		let i = 0;
		for (const [origName, newName] of nameMap) {
			const rel = offsets.get(origName);
			positions.set(newName, {
				gridX: Math.max(0, basePos.gridX + (rel?.dx ?? i)),
				gridY: Math.max(0, basePos.gridY + (rel?.dy ?? 0)),
			});
			i++;
		}
		return positions;
	}

	function buildDropMenu(onmove: () => Promise<void> | void, oncopy: () => Promise<void>, onlink: () => Promise<void>): ContextMenuItem[] {
		return [{ icon: '/img/cut.svg', label: 'Move here', onclick: onmove }, { icon: '/img/copy.svg', label: 'Copy here', onclick: oncopy }, { icon: '/img/shortcut.svg', label: 'Create a link', onclick: onlink }, { separator: true }, { icon: '/img/close.svg', label: 'Cancel', onclick: () => {} }];
	}

	async function executeDrop(mode: 'move' | 'copy' | 'link', sourcePath: string, names: string[], destPath: string, schedule: (nameMap: Map<string, string>) => void): Promise<void> {
		try {
			let nameMap: Map<string, string>;
			if (mode === 'move') {
				if (sourcePath === destPath) {
					nameMap = new Map(names.map(n => [n, n]));
					schedule(nameMap);
					return;
				}
				const allowed = warnSystemMove(sourcePath, names);
				if (allowed.length === 0) return;
				nameMap = await moveWithConflicts(
					allowed.map(n => ({ sourcePath, name: n })),
					destPath
				);
			} else if (mode === 'copy') {
				nameMap = await copyWithConflicts(
					names.map(n => ({ sourcePath, name: n })),
					destPath
				);
			} else {
				const srcEntries = sourcePath === path ? sortedEntries : await readDirectory(sourcePath);
				const entryInfos = names.map(name => {
					const entry = srcEntries.find(en => en.name === name);
					return { name, type: (entry?.type ?? 'file') as 'file' | 'directory' };
				});
				const linkMap = await createLinksForEntries(sourcePath, entryInfos, destPath);
				nameMap = new Map(linkMap);
			}
			schedule(nameMap);
			notifyDirectoryChange(destPath);
			if (sourcePath !== destPath) notifyDirectoryChange(sourcePath);
			if (destPath !== path && sourcePath !== path) notifyDirectoryChange(path);
		} catch (err) {
			showErrorDialog(err);
		}
	}

	async function onIconDrop(draggedIds: string[], targetId: string | null, e: PointerEvent): Promise<void> {
		const targetEntry = targetId ? sortedEntries.find(en => en.name === targetId) : null;
		const destPath = targetEntry?.type === 'directory' ? entryFullPath(targetEntry) : null;
		const dropPos = !destPath && iconGrid ? iconGrid.screenToGrid(e.clientX, e.clientY) : null;
		const relOffsets = new Map<string, { dx: number; dy: number }>();
		if (dropPos && iconGrid) {
			const anchorPos = iconGrid.getItemPosition(draggedIds[0]!);
			if (anchorPos) {
				for (const id of draggedIds) {
					const pos = iconGrid.getItemPosition(id);
					if (pos) relOffsets.set(id, { dx: pos.gridX - anchorPos.gridX, dy: pos.gridY - anchorPos.gridY });
				}
			}
		}
		function schedule(nameMap: Map<string, string>): void {
			if (!dropPos || !iconGrid) return;
			iconGrid.schedulePositions(computeDropPositions(dropPos, relOffsets, nameMap));
		}
		const dest = destPath ?? path;
		if (e.button === 0) {
			if (destPath) await executeDrop('move', path, draggedIds, dest, schedule);
		} else if (e.button === 2) {
			contextMenu = {
				x: e.clientX,
				y: e.clientY,
				items: buildDropMenu(
					() => executeDrop('move', path, draggedIds, dest, schedule),
					() => executeDrop('copy', path, draggedIds, dest, schedule),
					() => executeDrop('link', path, draggedIds, dest, schedule)
				),
			};
		}
	}

	function dropZone(el: HTMLElement): { destroy(): void } {
		return { destroy: registerDropZone(el, handleExternalDrop) };
	}

	function handleExternalDrop(sourcePath: string, fileNames: string[], button: number, x: number, y: number, offsets: Map<string, { dx: number; dy: number }>): void {
		if (sourcePath === path) return;
		const hitItem = getDropTargetAtScreen(x, y);
		const targetEntry = hitItem?.droppable ? sortedEntries.find(e => e.name === hitItem.id && e.type === 'directory') : null;
		const destPath = targetEntry ? entryFullPath(targetEntry) : path;
		const dropBasePos = !targetEntry && iconGrid ? iconGrid.screenToGrid(x, y) : null;

		function schedule(nameMap: Map<string, string>): void {
			if (!dropBasePos || !iconGrid) return;
			iconGrid.schedulePositions(computeDropPositions(dropBasePos, offsets, nameMap));
		}

		if (button === 0) executeDrop('move', sourcePath, fileNames, destPath, schedule);
		else if (button === 2) {
			contextMenu = {
				x,
				y,
				items: buildDropMenu(
					() => executeDrop('move', sourcePath, fileNames, destPath, schedule),
					() => executeDrop('copy', sourcePath, fileNames, destPath, schedule),
					() => executeDrop('link', sourcePath, fileNames, destPath, schedule)
				),
			};
		}
	}

	function onNativeDragOver(e: DragEvent): void {
		if (!e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
		nativeDragOver = true;
	}

	function onNativeDragLeave(e: DragEvent): void {
		const el = e.currentTarget as HTMLElement;
		if (e.relatedTarget && el.contains(e.relatedTarget as Node)) return;
		nativeDragOver = false;
	}

	async function onNativeDrop(e: DragEvent): Promise<void> {
		nativeDragOver = false;
		if (!e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		const dropPos = iconGrid ? iconGrid.screenToGrid(e.clientX, e.clientY) : null;
		try {
			const uploaded = await uploadNativeFiles(e.dataTransfer, path);
			if (dropPos && iconGrid && uploaded.length > 0) {
				const positions = new Map<string, { gridX: number; gridY: number }>();
				for (let i = 0; i < uploaded.length; i++) positions.set(uploaded[i]!, { gridX: dropPos.gridX + i, gridY: dropPos.gridY });
				iconGrid.schedulePositions(positions);
			}
		} catch (err) {
			showErrorDialog(err);
		}
	}

	export function clearSelection(): void {
		if (viewMode === 'list') listView?.clearSelection();
		else iconGrid?.clearSelection();
		_selectedIds = new Set();
		onselectionchange?.([]);
	}
</script>

<style>
	.storage-browser {
		position: relative;
		width: 100%;
		height: 100%;
		outline: none;
	}

	.native-drop-overlay {
		position: absolute;
		inset: 0;
		border: 2px dashed var(--color-accent);
		background: var(--color-selection);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		color: var(--color-accent);
		pointer-events: none;
		z-index: 20;
		border-radius: 8px;
	}
</style>

<div class="storage-browser" role="group" tabindex="-1" oncontextmenu={onContextMenu} ondragover={onNativeDragOver} ondragleave={onNativeDragLeave} ondrop={onNativeDrop} use:dropZone>
	{#if nativeDragOver}
		<div class="native-drop-overlay">Drop files here to upload</div>
	{/if}
	{#if viewMode === 'list'}
		<List bind:this={listView} items={iconViewItems} dirPath={path} {externalDragOverId} {cutItemIds} getInitialSelection={() => _selectedIds} onselectionchange={onGridSelectionChange} ondblclick={onDblClick} ondrop={onIconDrop} onkeyaction={handleKeydown}>
			{#snippet empty()}
				{#if !hideEmptyLabel}
					This directory is empty
				{/if}
			{/snippet}
		</List>
	{:else}
		<IconGrid bind:this={iconGrid} items={iconViewItems} dirPath={path} {columnFirst} {externalDragOverId} {cutItemIds} getInitialSelection={() => _selectedIds} onselectionchange={onGridSelectionChange} ondblclick={onDblClick} ondrop={onIconDrop} {onitemsmove} onkeyaction={handleKeydown}>
			{#snippet empty()}
				{#if !hideEmptyLabel}
					This directory is empty
				{/if}
			{/snippet}
		</IconGrid>
	{/if}
	{#if contextMenu}
		<ContextMenu items={contextMenu.items} x={contextMenu.x} y={contextMenu.y} onclose={() => (contextMenu = null)} />
	{/if}
</div>
