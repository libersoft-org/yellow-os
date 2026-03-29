<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { FileEntry } from '../../scripts/file-entry.ts';
	import { entryIcon, entryIconColor, loadDirectoryEntries } from '../../scripts/file-entry.ts';
	import { moveEntry, copyEntryTo, readDirectory, joinPath } from '../../scripts/opfs.ts';
	import { isLinkFile, readLink, resolveLink, createLinksForEntries } from '../../scripts/link.ts';
	import { openWindow } from '../../scripts/window-store.svelte.ts';
	import { getFileHandler, getEditHandler } from '../../scripts/file-types.ts';
	import { getAppComponent } from '../../scripts/app-registry.ts';
	import { notifyDirectoryChange, onDirectoryChange } from '../../scripts/opfs-notify.ts';
	import { confirmDeleteMultiple, openRenameDialog, openNewEntryDialog, warnSystemMove } from '../../scripts/file-actions.ts';
	import { downloadEntries } from '../../scripts/download.ts';
	import { showDialog } from '../../scripts/dialog.ts';
	import { setClipboard, hasClipboard, pasteClipboard } from '../../scripts/clipboard.svelte.ts';
	import { ensureOpfsReady } from '../../scripts/opfs-init.ts';
	import { registerDropZone, isGlobalDragActive } from '../../scripts/drag-state.svelte.ts';
	import { createSelection } from '../../scripts/selection.svelte.ts';
	import { pointerGestures } from '../../scripts/pointer-gestures.ts';
	import type { IconGridItemData } from '../IconGrid/icon-grid.ts';
	import IconGrid from '../IconGrid/IconGrid.svelte';
	import IconGridItem from '../IconGrid/IconGridItem.svelte';
	import ListItem from '../ListItem/ListItem.svelte';
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
	type SortField = 'name' | 'modified' | 'extension' | 'size';
	type SortDirection = 'asc' | 'desc';
	let sortField = $state<SortField>('name');
	let sortDirection = $state<SortDirection>('asc');

	function getExtension(name: string): string {
		const dot = name.lastIndexOf('.');
		return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
	}

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

	function setsEqual(a: Set<string>, b: Set<string>): boolean {
		if (a.size !== b.size) return false;
		for (const v of a) if (!b.has(v)) return false;
		return true;
	}

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

	async function loadDirectory(): Promise<void> {
		await ensureOpfsReady();
		try {
			entries = await loadDirectoryEntries(path);
		} catch {
			entries = [];
		}
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
		const hit = iconGrid?.getItemAtScreen(e.clientX, e.clientY);
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
		if (viewMode === 'list') listViewEl?.focus();
		else iconGrid?.focus();
	}

	// ── List view state ──
	const listSelection = createSelection();
	let listViewEl: HTMLElement | undefined = $state();
	let listDragStartX = $state(0);
	let listDragStartY = $state(0);
	let listDragCurrentX = $state(0);
	let listDragCurrentY = $state(0);
	let listDragActive = $state(false);
	let listDragPreSelected = new Set<string>();
	let listLastClickedName: string | null = null;
	let listPendingDeselect: string | null = null;

	function listHandlePress(e: PointerEvent): boolean | void {
		listPendingDeselect = null;
		if (!setsEqual(listSelection.selected, _selectedIds)) listSelection.set(new Set(_selectedIds));
		const itemEl = (e.target as HTMLElement).closest('[data-icon-id]') as HTMLElement | null;
		if (itemEl) {
			const name = itemEl.dataset['iconId']!;
			listLastClickedName = name;
			if (listSelection.isSelected(name)) {
				if (e.ctrlKey || e.metaKey) {
					const index = sortedEntries.findIndex(en => en.name === name);
					listSelection.select(
						name,
						index,
						sortedEntries.map(en => en.name),
						e
					);
					syncListSelection();
					return false;
				}
				listPendingDeselect = name;
			} else {
				const index = sortedEntries.findIndex(en => en.name === name);
				if (index >= 0) {
					listSelection.select(
						name,
						index,
						sortedEntries.map(en => en.name),
						e
					);
					syncListSelection();
				}
			}
		} else {
			listLastClickedName = null;
			if (e.button !== 0) return false;
			if (!(e.ctrlKey || e.metaKey)) {
				listSelection.clear();
				_selectedIds = new Set();
				onselectionchange?.([]);
			}
		}
		listDragPreSelected = new Set(listSelection.selected);
		listDragStartX = e.clientX;
		listDragStartY = e.clientY;
	}

	function listHandleDragStart(): void {
		listDragActive = true;
		listPendingDeselect = null;
	}

	function listHandleDragMove(e: PointerEvent): void {
		if (!listViewEl) return;
		listDragCurrentX = e.clientX;
		listDragCurrentY = e.clientY;
		const minY = Math.min(listDragStartY, e.clientY);
		const maxY = Math.max(listDragStartY, e.clientY);
		const next = new Set(listDragPreSelected);
		const items = listViewEl.querySelectorAll('[data-icon-id]');
		for (const el of items) {
			const rect = el.getBoundingClientRect();
			if (rect.bottom > minY && rect.top < maxY) {
				next.add((el as HTMLElement).dataset['iconId']!);
			}
		}
		listSelection.set(next);
		syncListSelection();
	}

	function listHandleClick(): void {
		listDragActive = false;
		if (listPendingDeselect) {
			listSelection.set(new Set([listPendingDeselect]));
			listPendingDeselect = null;
			syncListSelection();
		}
	}

	function listHandleDblClick(): void {
		if (listLastClickedName) {
			const entry = sortedEntries.find(en => en.name === listLastClickedName);
			if (entry) openEntry(entry);
		}
	}

	function listHandleDragEnd(): void {
		listDragActive = false;
		listPendingDeselect = null;
	}

	function syncListSelection(): void {
		_selectedIds = new Set(listSelection.selected);
		onselectionchange?.(selectedEntries);
	}

	function onListKeydown(e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			listSelection.selectAll(sortedEntries.map(en => en.name));
			syncListSelection();
		}
		handleKeydown(e);
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
		if (entry.type === 'file') {
			items.push({ icon: '/img/apps/text-editor.svg', label: 'Edit', onclick: () => editEntry(entry) });
		}
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
			const entry = sortedEntries.find(en => en.name === (iconEl as HTMLElement).dataset['iconId']);
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

	async function onIconDrop(draggedIds: string[], targetId: string | null, e: PointerEvent): Promise<void> {
		const targetEntry = targetId ? sortedEntries.find(en => en.name === targetId) : null;
		const destPath = targetEntry?.type === 'directory' ? joinPath(path, targetId!) : null;

		// Capture drop position and relative offsets before any async work
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

		function scheduleNewPositions(nameMap: Map<string, string>): void {
			if (!dropPos || !iconGrid) return;
			iconGrid.schedulePositions(computeDropPositions(dropPos, relOffsets, nameMap));
		}

		if (e.button === 0) {
			if (destPath) {
				const allowed = warnSystemMove(path, draggedIds);
				if (allowed.length > 0) {
					for (const id of allowed) await moveEntry(path, id, destPath);
					notifyDirectoryChange(path);
					notifyDirectoryChange(destPath);
				}
			}
		} else if (e.button === 2) {
			contextMenu = {
				x: e.clientX,
				y: e.clientY,
				items: buildDropMenu(
					async () => {
						if (!destPath) {
							const nameMap = new Map<string, string>();
							for (const id of draggedIds) nameMap.set(id, id);
							scheduleNewPositions(nameMap);
						} else if (destPath !== path) {
							const allowed = warnSystemMove(path, draggedIds);
							if (allowed.length > 0) {
								for (const id of allowed) await moveEntry(path, id, destPath);
								notifyDirectoryChange(path);
								notifyDirectoryChange(destPath);
							}
						}
					},
					async () => {
						const copyDest = destPath ?? path;
						const nameMap = new Map<string, string>();
						for (const id of draggedIds) nameMap.set(id, await copyEntryTo(path, id, copyDest));
						if (!destPath) scheduleNewPositions(nameMap);
						notifyDirectoryChange(path);
						if (copyDest !== path) notifyDirectoryChange(copyDest);
					},
					async () => {
						const linkDest = destPath ?? path;
						const entryInfos = draggedIds.map(id => {
							const entry = sortedEntries.find(en => en.name === id);
							return { name: id, type: (entry?.type ?? 'file') as 'file' | 'directory' };
						});
						const nameMap = await createLinksForEntries(path, entryInfos, linkDest);
						if (!destPath) scheduleNewPositions(nameMap);
						notifyDirectoryChange(linkDest);
					}
				),
			};
		}
	}

	function dropZone(el: HTMLElement): { destroy(): void } {
		return { destroy: registerDropZone(el, handleExternalDrop) };
	}

	function handleExternalDrop(sourcePath: string, fileNames: string[], button: number, x: number, y: number, offsets: Map<string, { dx: number; dy: number }>): void {
		if (sourcePath === path) return;

		// Check if drop landed on a directory icon → move into that subdirectory
		const hitItem = iconGrid?.getItemAtScreen(x, y);
		const targetEntry = hitItem?.droppable ? sortedEntries.find(e => e.name === hitItem.id && e.type === 'directory') : null;
		const destPath = targetEntry ? joinPath(path, targetEntry.name) : path;

		const dropBasePos = !targetEntry && iconGrid ? iconGrid.screenToGrid(x, y) : null;

		function scheduleDropPositions(nameMap: Map<string, string>): void {
			if (!dropBasePos || !iconGrid) return;
			iconGrid.schedulePositions(computeDropPositions(dropBasePos, offsets, nameMap));
		}

		if (button === 0) {
			(async (): Promise<void> => {
				const allowed = warnSystemMove(sourcePath, fileNames);
				if (allowed.length === 0) return;
				const nameMap = new Map<string, string>();
				for (const name of allowed) nameMap.set(name, await moveEntry(sourcePath, name, destPath));
				scheduleDropPositions(nameMap);
				notifyDirectoryChange(sourcePath);
				notifyDirectoryChange(destPath);
				if (destPath !== path) notifyDirectoryChange(path);
			})();
		} else if (button === 2) {
			contextMenu = {
				x,
				y,
				items: buildDropMenu(
					async () => {
						const allowed = warnSystemMove(sourcePath, fileNames);
						if (allowed.length === 0) return;
						const nameMap = new Map<string, string>();
						for (const name of allowed) nameMap.set(name, await moveEntry(sourcePath, name, destPath));
						scheduleDropPositions(nameMap);
						notifyDirectoryChange(sourcePath);
						notifyDirectoryChange(destPath);
						if (destPath !== path) notifyDirectoryChange(path);
					},
					async () => {
						const nameMap = new Map<string, string>();
						for (const name of fileNames) nameMap.set(name, await copyEntryTo(sourcePath, name, destPath));
						scheduleDropPositions(nameMap);
						notifyDirectoryChange(destPath);
						if (destPath !== path) notifyDirectoryChange(path);
					},
					async () => {
						const sourceEntries = await readDirectory(sourcePath);
						const entryInfos = fileNames.map(name => {
							const entry = sourceEntries.find(en => en.name === name);
							return { name, type: (entry?.type ?? 'file') as 'file' | 'directory' };
						});
						const nameMap = await createLinksForEntries(sourcePath, entryInfos, destPath);
						scheduleDropPositions(nameMap);
						notifyDirectoryChange(destPath);
						if (destPath !== path) notifyDirectoryChange(path);
					}
				),
			};
		}
	}

	export function clearSelection(): void {
		if (viewMode === 'list') {
			listSelection.clear();
			_selectedIds = new Set();
			onselectionchange?.([]);
		} else {
			iconGrid?.clearSelection();
		}
	}
</script>

<style>
	.directory-view {
		position: relative;
		width: 100%;
		height: 100%;
		outline: none;
	}

	.list-view {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		position: relative;
		outline: none;
	}

	.list-drag-rect {
		position: fixed;
		border: 1px solid var(--color-accent);
		background: var(--color-selection);
		pointer-events: none;
		z-index: 10;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--color-text-dim);
		font-size: 14px;
	}
</style>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="directory-view" role="application" tabindex="-1" oncontextmenu={onContextMenu} use:dropZone>
	{#if viewMode === 'list'}
		{#if sortedEntries.length === 0}
			{#if !hideEmptyLabel}
				<div class="empty-state">This directory is empty</div>
			{/if}
		{:else}
			<div class="list-view" role="listbox" bind:this={listViewEl} use:pointerGestures={{ onpress: listHandlePress, onclick: listHandleClick, ondblclick: listHandleDblClick, ondragstart: listHandleDragStart, ondragmove: listHandleDragMove, ondragend: listHandleDragEnd }} onkeydown={onListKeydown} tabindex="0">
				{#each sortedEntries as entry}
					<div data-icon-id={entry.name}>
						<ListItem active={_selectedIds.has(entry.name)}>
							<IconGridItem icon={entryIcon(entry)} label={displayLabel(entry.name)} layout="horizontal" iconSize="20px" iconColor={entryIconColor(entry)} />
						</ListItem>
					</div>
				{/each}
				{#if listDragActive}
					{@const left = Math.min(listDragStartX, listDragCurrentX)}
					{@const top = Math.min(listDragStartY, listDragCurrentY)}
					{@const width = Math.abs(listDragCurrentX - listDragStartX)}
					{@const height = Math.abs(listDragCurrentY - listDragStartY)}
					{#if width > 3 || height > 3}
						<div class="list-drag-rect" style="top: {top}px; left: {left}px; width: {width}px; height: {height}px;"></div>
					{/if}
				{/if}
			</div>
		{/if}
	{:else}
		<IconGrid bind:this={iconGrid} items={iconViewItems} dirPath={path} {columnFirst} {externalDragOverId} getInitialSelection={() => _selectedIds} onselectionchange={onGridSelectionChange} ondblclick={onDblClick} ondrop={onIconDrop} {onitemsmove} onkeyaction={handleKeydown}>
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
