<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { FileEntry } from '../../scripts/file-entry.ts';
	import { entryIcon, entryIconColor, loadDirectoryEntries } from '../../scripts/file-entry.ts';
	import { moveEntry, copyEntryTo } from '../../scripts/opfs.ts';
	import { isLinkFile, readLink, resolveLink } from '../../scripts/link.ts';
	import { openWindow } from '../../scripts/window-store.svelte.ts';
	import { getFileHandler, getEditHandler } from '../../scripts/file-types.ts';
	import { notifyDirectoryChange, onDirectoryChange } from '../../scripts/opfs-notify.ts';
	import { confirmDelete, openRenameDialog, openNewEntryDialog } from '../../scripts/file-actions.ts';
	import { registerDropZone, isGlobalDragActive } from '../../scripts/drag-state.svelte.ts';
	import type { IconGridItemData } from '../IconGrid/icon-grid.ts';
	import IconGrid from '../IconGrid/IconGrid.svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import type { ContextMenuItem } from '../ContextMenu/context-menu.ts';
	interface Props {
		path: string;
		columnFirst?: boolean;
		hideLinkExtension?: boolean;
		extraEmptySpaceMenuItems?: ContextMenuItem[];
		onnavigate?: (path: string) => void;
		onselectionchange?: (entries: FileEntry[]) => void;
		onitemsmove?: (moves: { id: string; gridX: number; gridY: number }[]) => void;
		onentrieschange?: (entries: FileEntry[]) => void;
	}
	let { path, columnFirst, hideLinkExtension, extraEmptySpaceMenuItems, onnavigate, onselectionchange, onitemsmove, onentrieschange }: Props = $props();
	let entries = $state<FileEntry[]>([]);
	let contextMenu = $state<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
	let selectedEntries: FileEntry[] = [];
	let iconGrid = $state<IconGrid>();
	const sortedEntries = $derived(
		entries.toSorted((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		})
	);

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
		try {
			entries = await loadDirectoryEntries(path);
		} catch {
			entries = [];
		}
		onentrieschange?.(entries);
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
		selectedEntries = sortedEntries.filter(e => selectedIds.has(e.name));
		onselectionchange?.(selectedEntries);
	}

	function onDblClick(item: IconGridItemData): void {
		const entry = sortedEntries.find(e => e.name === item.id);
		if (entry) openEntry(entry);
	}

	async function openEntry(entry: FileEntry): Promise<void> {
		if (entry.type === 'directory') {
			const fullPath = path === '/' ? '/' + entry.name : path + '/' + entry.name;
			if (onnavigate) {
				onnavigate(fullPath);
			} else {
				const { getAppComponent } = await import('../../scripts/app-registry.ts');
				const FileBrowser = getAppComponent('file-browser');
				if (FileBrowser) openWindow(FileBrowser, { path: fullPath });
			}
		} else if (isLinkFile(entry.name)) {
			const linkData = await readLink(path, entry.name);
			if (linkData) {
				const resolved = resolveLink(linkData);
				if (resolved) openWindow(resolved.component, resolved.props);
			}
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
				onclick: async () => {
					const { getAppComponent } = await import('../../scripts/app-registry.ts');
					const FileBrowser = getAppComponent('file-browser');
					const fullPath = path === '/' ? '/' + entry.name : path + '/' + entry.name;
					if (FileBrowser) openWindow(FileBrowser, { path: fullPath });
				},
			});
		}
		if (entry.type === 'file') {
			items.push({ icon: '/img/apps/text-editor.svg', label: 'Edit', onclick: () => editEntry(entry) });
		}
		items.push({ separator: true }, { icon: '/img/copy.svg', label: 'Copy', onclick: () => {} }, { icon: '/img/cut.svg', label: 'Cut', onclick: () => {} }, { icon: '/img/paste.svg', label: 'Paste', onclick: () => {} }, { separator: true }, { icon: '/img/rename.svg', label: 'Rename', onclick: () => openRenameDialog(path, entry.name, entry.type) }, { icon: '/img/trash.svg', label: 'Delete', onclick: (e: MouseEvent) => confirmDelete(path, entry.name, entry.type, e.shiftKey) });
		return items;
	}

	const emptySpaceMenuItems = $derived<ContextMenuItem[]>([
		{
			icon: '/img/settings.svg',
			label: 'Sort by',
			children: [{ icon: '/img/check.svg', label: 'Name', onclick: () => {} }, { label: 'Modification date', onclick: () => {} }, { label: 'Extension', onclick: () => {} }, { label: 'Size', onclick: () => {} }, { separator: true }, { icon: '/img/check.svg', label: 'Ascending', onclick: () => {} }, { label: 'Descending', onclick: () => {} }],
		},
		{ separator: true },
		{ icon: '/img/file.svg', label: 'New file', onclick: () => openNewEntryDialog(path, 'file') },
		{ icon: '/img/directory.svg', label: 'New directory', onclick: () => openNewEntryDialog(path, 'directory') },
		...(extraEmptySpaceMenuItems ?? []),
	]);

	function onContextMenu(e: MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();
		const iconEl = (e.target as HTMLElement).closest('[data-icon-id]');
		if (iconEl) {
			const entry = sortedEntries.find(en => en.name === (iconEl as HTMLElement).dataset['iconId']);
			if (entry) contextMenu = { x: e.clientX, y: e.clientY, items: getIconMenuItems(entry) };
		} else {
			contextMenu = { x: e.clientX, y: e.clientY, items: emptySpaceMenuItems };
		}
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Delete' && selectedEntries.length > 0) {
			e.preventDefault();
			for (const entry of selectedEntries) confirmDelete(path, entry.name, entry.type, e.shiftKey);
		}
		if (e.key === 'F2' && selectedEntries.length === 1) {
			e.preventDefault();
			openRenameDialog(path, selectedEntries[0]!.name, selectedEntries[0]!.type);
		}
	}

	async function onIconDrop(draggedIds: string[], targetId: string | null, e: PointerEvent): Promise<void> {
		const targetEntry = targetId ? sortedEntries.find(en => en.name === targetId) : null;
		const destPath = targetEntry?.type === 'directory' ? (path === '/' ? '/' + targetId : path + '/' + targetId) : null;

		if (e.button === 0) {
			if (destPath) {
				for (const id of draggedIds) await moveEntry(path, id, destPath);
				notifyDirectoryChange(path);
				notifyDirectoryChange(destPath);
			}
		} else if (e.button === 2) {
			const dropMenuItems: ContextMenuItem[] = [
				{
					icon: '/img/cut.svg',
					label: 'Move here',
					onclick: async () => {
						if (destPath && destPath !== path) {
							for (const id of draggedIds) await moveEntry(path, id, destPath);
							notifyDirectoryChange(path);
							notifyDirectoryChange(destPath);
						}
					},
				},
				{
					icon: '/img/copy.svg',
					label: 'Copy here',
					onclick: async () => {
						const copyDest = destPath ?? path;
						for (const id of draggedIds) await copyEntryTo(path, id, copyDest);
						notifyDirectoryChange(path);
						notifyDirectoryChange(copyDest);
					},
				},
				{ separator: true },
				{ icon: '/img/close.svg', label: 'Cancel', onclick: () => {} },
			];
			contextMenu = { x: e.clientX, y: e.clientY, items: dropMenuItems };
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
		const destPath = targetEntry ? (path === '/' ? '/' + targetEntry.name : path + '/' + targetEntry.name) : path;

		if (!targetEntry && iconGrid) {
			const basePos = iconGrid.screenToGrid(x, y);
			const positions = new Map<string, { gridX: number; gridY: number }>();
			for (let i = 0; i < fileNames.length; i++) {
				const name = fileNames[i]!;
				const rel = offsets.get(name);
				positions.set(name, {
					gridX: Math.max(0, basePos.gridX + (rel?.dx ?? i)),
					gridY: Math.max(0, basePos.gridY + (rel?.dy ?? 0)),
				});
			}
			iconGrid.schedulePositions(positions);
		}
		if (button === 0) {
			(async (): Promise<void> => {
				for (const name of fileNames) await moveEntry(sourcePath, name, destPath);
				notifyDirectoryChange(sourcePath);
				notifyDirectoryChange(destPath);
				if (destPath !== path) notifyDirectoryChange(path);
			})();
		} else if (button === 2) {
			contextMenu = {
				x,
				y,
				items: [
					{
						icon: '/img/cut.svg',
						label: 'Move here',
						onclick: async () => {
							for (const name of fileNames) await moveEntry(sourcePath, name, destPath);
							notifyDirectoryChange(sourcePath);
							notifyDirectoryChange(destPath);
							if (destPath !== path) notifyDirectoryChange(path);
						},
					},
					{
						icon: '/img/copy.svg',
						label: 'Copy here',
						onclick: async () => {
							for (const name of fileNames) await copyEntryTo(sourcePath, name, destPath);
							notifyDirectoryChange(destPath);
							if (destPath !== path) notifyDirectoryChange(path);
						},
					},
					{ separator: true },
					{ icon: '/img/close.svg', label: 'Cancel', onclick: () => {} },
				],
			};
		}
	}

	export function clearSelection(): void {
		iconGrid?.clearSelection();
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

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="directory-view" role="application" tabindex="-1" oncontextmenu={onContextMenu} onkeydown={handleKeydown} use:dropZone>
	<IconGrid bind:this={iconGrid} items={iconViewItems} dirPath={path} {columnFirst} {externalDragOverId} onselectionchange={onGridSelectionChange} ondblclick={onDblClick} ondrop={onIconDrop} {onitemsmove}>
		{#snippet empty()}
			This directory is empty
		{/snippet}
	</IconGrid>
	{#if contextMenu}
		<ContextMenu items={contextMenu.items} x={contextMenu.x} y={contextMenu.y} onclose={() => (contextMenu = null)} />
	{/if}
</div>
