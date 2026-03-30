<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import { entryIcon, entryIconColor, loadDirectoryEntries, getExtension } from '../../scripts/fs/file-entry.ts';
	import { moveEntry, copyEntryTo, readDirectory, joinPath } from '../../scripts/fs/opfs.ts';
	import { isLinkFile, readLink, resolveLink, createLinksForEntries } from '../../scripts/fs/link.ts';
	import { openWindow } from '../../scripts/window/window-store.svelte.ts';
	import { getFileHandler, getEditHandler } from '../../scripts/fs/file-types.ts';
	import { getAppComponent } from '../../scripts/system/app-registry.ts';
	import { notifyDirectoryChange, onDirectoryChange } from '../../scripts/fs/opfs-notify.ts';
	import { confirmDeleteMultiple, openRenameDialog, openNewEntryDialog, warnSystemMove } from '../../scripts/fs/file-actions.ts';
	import { downloadEntries } from '../../scripts/fs/download.ts';
	import { showDialog, showErrorDialog } from '../../scripts/ui/dialog.ts';
	import { setClipboard, hasClipboard, pasteClipboard, getClipboard } from '../../scripts/fs/clipboard.svelte.ts';
	import { ensureOpfsReady } from '../../scripts/fs/opfs-init.ts';
	import { registerDropZone, isGlobalDragActive } from '../../scripts/ui/drag-state.svelte.ts';
	import type { IconGridItemData } from '../IconGrid/icon-grid.ts';
	import IconGrid from '../IconGrid/IconGrid.svelte';
	import List from '../List/List.svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import type { ContextMenuItem } from '../ContextMenu/context-menu.ts';
	interface Props {
		path: string;
		viewMode?: 'grid' | 'list';
		columnFirst?: boolean;
		hideLinkExtension?: boolean;
		hideEmptyLabel?: boolean;
		extraEmptySpaceMenuItems?: ContextMenuItem[];
		onnavigate?: (path: string) => void;
		onselectionchange?: (entries: FileEntry[]) => void;
		onitemsmove?: (moves: { id: string; gridX: number; gridY: number }[]) => void;
		onentrieschange?: (entries: FileEntry[]) => void;
	}
	let { path, viewMode = 'grid', columnFirst, hideLinkExtension, hideEmptyLabel, extraEmptySpaceMenuItems, onnavigate, onselectionchange, onitemsmove, onentrieschange }: Props = $props();
	let entries = $state<FileEntry[]>([]);
	let contextMenu = $state<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
	let _selectedIds = $state(new Set<string>());
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

	const sortedEntries = $derived.by(() => {
		const field = sortField;
		const direction = sortDirection;
		return entries.toSorted((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return compareEntries(a, b, field, direction);
		});
	});
	const selectedEntries = $derived(sortedEntries.filter(e => _selectedIds.has(e.name)));

	function displayLabel(name: string): string {
		if (hideLinkExtension && isLinkFile(name)) return name.slice(0, -5);
		return name;
	}

	const iconViewItems = $derived<IconGridItemData[]>(
		sortedEntries.map(e => ({
			id: e.name,
			icon: entryIcon(e),
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
		document.addEventListener('pointermove', onGlobalPointerMove);
	});

	onDestroy(() => {
		unsubscribeDir?.();
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
			const fullPath = joinPath(path, entry.name);
			if (onnavigate) {
				onnavigate(fullPath);
			} else {
				const FileBrowser = getAppComponent('file-browser');
				if (FileBrowser) openWindow(FileBrowser, { path: fullPath });
			}
		} else if (isLinkFile(entry.name)) {
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
		}
	}

	function editEntry(entry: FileEntry): void {
		if (entry.type === 'file') {
			const handler = getEditHandler(path, entry.name);
			openWindow(handler.component, handler.props);
		}
	}

	function getIconMenuItems(entry: FileEntry): ContextMenuItem[] {
		const items: ContextMenuItem[] = [{ icon: '/img/open.svg', label: 'Open', onclick: () => openEntry(entry) }];
		if (entry.type === 'directory' && onnavigate) {
			items.push({
				icon: '/img/open.svg',
				label: 'Open in new window',
				onclick: () => {
					const FileBrowser = getAppComponent('file-browser');
					const fullPath = joinPath(path, entry.name);
					if (FileBrowser) openWindow(FileBrowser, { path: fullPath });
				},
			});
		}
		if (entry.type === 'file') items.push({ icon: '/img/apps/text-editor.svg', label: 'Edit', onclick: () => editEntry(entry) });
		const toCopy = selectedEntries.length > 1 ? selectedEntries : [entry];
		items.push(
			{ separator: true },
			{
				icon: '/img/copy.svg',
				label: 'Copy',
				onclick: () =>
					setClipboard(
						toCopy.map(en => ({ path, name: en.name, type: en.type })),
						'copy'
					),
			},
			{
				icon: '/img/cut.svg',
				label: 'Cut',
				onclick: () =>
					setClipboard(
						toCopy.map(en => ({ path, name: en.name, type: en.type })),
						'cut'
					),
			},
			...(entry.type === 'directory' ? [{ icon: '/img/paste.svg', label: 'Paste', disabled: !hasClipboard(), onclick: () => pasteClipboard(joinPath(path, entry.name)) }] : []),
			{ separator: true }
		);
		const toDownload = selectedEntries.length > 1 ? selectedEntries : [entry];
		items.push({
			icon: '/img/download.svg',
			label: 'Download',
			onclick: () =>
				downloadEntries(
					path,
					toDownload.map(en => ({ name: en.name, type: en.type }))
				),
		});
		if (selectedEntries.length <= 1) {
			items.push({ icon: '/img/rename.svg', label: 'Rename', onclick: () => openRenameDialog(path, entry.name, entry.type, handleRenamed, focusGrid) });
		}
		items.push({
			icon: '/img/trash.svg',
			label: 'Delete',
			onclick: (e: MouseEvent) => {
				const toDelete = selectedEntries.length > 1 ? selectedEntries : [entry];
				confirmDeleteMultiple(
					path,
					toDelete.map(en => ({ name: en.name, type: en.type })),
					e.shiftKey,
					focusGrid
				);
			},
		});
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
			const placeAtClick = (finalName: string): void => {
				if (!iconGrid) return;
				const gridPos = iconGrid.screenToGrid(clickX, clickY);
				iconGrid.schedulePositions(new Map([[finalName, gridPos]]));
			};
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
					{ icon: '/img/paste.svg', label: 'Paste', disabled: !hasClipboard(), onclick: () => pasteClipboard(path) },
					{ separator: true },
					{ icon: '/img/file.svg', label: 'New file', onclick: () => openNewEntryDialog(path, 'file', placeAtClick) },
					{ icon: '/img/directory.svg', label: 'New directory', onclick: () => openNewEntryDialog(path, 'directory', placeAtClick) },
					...(extraEmptySpaceMenuItems ?? []),
				],
			};
		}
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Delete' && selectedEntries.length > 0) {
			e.preventDefault();
			confirmDeleteMultiple(
				path,
				selectedEntries.map(en => ({ name: en.name, type: en.type })),
				e.shiftKey,
				focusGrid
			);
		}
		if (e.key === 'F2' && selectedEntries.length === 1) {
			e.preventDefault();
			openRenameDialog(path, selectedEntries[0]!.name, selectedEntries[0]!.type, handleRenamed, focusGrid);
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
			const nameMap = new Map<string, string>();
			if (mode === 'move') {
				if (sourcePath === destPath) {
					for (const name of names) nameMap.set(name, name);
					schedule(nameMap);
					return;
				}
				const allowed = warnSystemMove(sourcePath, names);
				if (allowed.length === 0) return;
				for (const name of allowed) nameMap.set(name, await moveEntry(sourcePath, name, destPath));
			} else if (mode === 'copy') {
				for (const name of names) nameMap.set(name, await copyEntryTo(sourcePath, name, destPath));
			} else {
				const srcEntries = sourcePath === path ? sortedEntries : await readDirectory(sourcePath);
				const entryInfos = names.map(name => {
					const entry = srcEntries.find(en => en.name === name);
					return { name, type: (entry?.type ?? 'file') as 'file' | 'directory' };
				});
				nameMap.set('__links', '');
				const linkMap = await createLinksForEntries(sourcePath, entryInfos, destPath);
				nameMap.clear();
				for (const [k, v] of linkMap) nameMap.set(k, v);
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
		const destPath = targetEntry?.type === 'directory' ? joinPath(path, targetId!) : null;
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
		const schedule = (nameMap: Map<string, string>): void => {
			if (!dropPos || !iconGrid) return;
			iconGrid.schedulePositions(computeDropPositions(dropPos, relOffsets, nameMap));
		};
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
		const destPath = targetEntry ? joinPath(path, targetEntry.name) : path;
		const dropBasePos = !targetEntry && iconGrid ? iconGrid.screenToGrid(x, y) : null;
		const schedule = (nameMap: Map<string, string>): void => {
			if (!dropBasePos || !iconGrid) return;
			iconGrid.schedulePositions(computeDropPositions(dropBasePos, offsets, nameMap));
		};
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

	export function clearSelection(): void {
		if (viewMode === 'list') listView?.clearSelection();
		else iconGrid?.clearSelection();
		_selectedIds = new Set();
		onselectionchange?.([]);
	}
</script>

<style>
	.directory-view {
		position: relative;
		width: 100%;
		height: 100%;
		outline: none;
	}
</style>

<div class="directory-view" role="group" tabindex="-1" oncontextmenu={onContextMenu} use:dropZone>
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
