<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import { mockFs, mockDisks, entryIcon, entryIconColor } from './filemanager.ts';
	import type { FileEntry } from './filemanager.ts';
	import FileManagerToolbar from './FileManagerToolbar.svelte';
	import FileManagerSidebar from './FileManagerSidebar.svelte';
	import FileManagerSeparator from './FileManagerSeparator.svelte';
	import FileManagerInfo from './FileManagerInfo.svelte';
	import type { IconGridItemData } from '../../components/IconGrid/icon-grid.ts';
	import IconGrid from '../../components/IconGrid/IconGrid.svelte';
	import ContextMenu from '../../components/ContextMenu/ContextMenu.svelte';
	import type { ContextMenuItem } from '../../components/ContextMenu/context-menu.ts';
	import ListItem from '../../components/ListItem/ListItem.svelte';
	import IconGridItem from '../../components/IconGrid/IconGridItem.svelte';
	import { createSelection } from '../../scripts/selection.svelte.ts';
	import { pointerGestures } from '../../scripts/pointer-gestures.ts';

	const win = getWindow();
	win.title = 'File Manager';
	win.icon = '/img/apps/file-manager.svg';
	win.width = 800;
	win.height = 600;
	win.minWidth = 320;
	win.minHeight = 240;
	let currentPath = $state('/');
	let history = $state<string[]>(['/']);
	let historyIndex = $state(0);
	let sidebarWidth = $state(180);
	let viewMode = $state<'grid' | 'list'>('grid');
	let showInfo = $state(true);
	let selectedEntry = $state<FileEntry | null>(null);
	const listSelection = createSelection();
	let contextMenu = $state<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
	const canGoBack = $derived(historyIndex > 0);
	const canGoForward = $derived(historyIndex < history.length - 1);
	const canGoUp = $derived(currentPath !== '/');
	const entries = $derived(
		(mockFs[currentPath] ?? []).toSorted((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		})
	);

	const iconViewItems = $derived<IconGridItemData[]>(
		entries.map(e => ({
			id: e.name,
			icon: entryIcon(e),
			label: e.name,
			iconColor: entryIconColor(e),
		}))
	);

	const breadcrumbSegments = $derived.by(() => {
		if (currentPath === '/') return [{ name: 'Root', path: '/' }];
		const parts = currentPath.split('/').filter(Boolean);
		const segments = [{ name: 'Root', path: '/' }];
		for (let i = 0; i < parts.length; i++) segments.push({ name: parts[i]!, path: '/' + parts.slice(0, i + 1).join('/') });
		return segments;
	});

	const emptySpaceMenuItems: ContextMenuItem[] = [
		{
			icon: '/img/settings.svg',
			label: 'Sort by',
			children: [{ icon: '/img/check.svg', label: 'Name', onclick: () => {} }, { label: 'Modification date', onclick: () => {} }, { label: 'Extension', onclick: () => {} }, { label: 'Size', onclick: () => {} }, { separator: true }, { icon: '/img/check.svg', label: 'Ascending', onclick: () => {} }, { label: 'Descending', onclick: () => {} }],
		},
		{
			icon: '/img/settings.svg',
			label: 'View',
			children: [
				{ icon: '/img/check.svg', label: 'Grid', onclick: () => {} },
				{ label: 'List', onclick: () => {} },
			],
		},
		{ separator: true },
		{ icon: '/img/file.svg', label: 'New file', onclick: () => {} },
		{ icon: '/img/directory.svg', label: 'New directory', onclick: () => {} },
	];

	function getIconMenuItems(entry: FileEntry): ContextMenuItem[] {
		return [{ icon: '/img/open.svg', label: 'Open', onclick: () => {} }, ...(entry.type === 'directory' ? [{ icon: '/img/open.svg', label: 'Open in new window', onclick: () => {} }] : []), { separator: true }, { icon: '/img/copy.svg', label: 'Copy', onclick: () => {} }, { icon: '/img/cut.svg', label: 'Cut', onclick: () => {} }, { icon: '/img/paste.svg', label: 'Paste', onclick: () => {} }, { separator: true }, { icon: '/img/rename.svg', label: 'Rename', onclick: () => {} }, { icon: '/img/trash.svg', label: 'Delete', onclick: () => {} }];
	}

	function onSeparatorResize(dx: number): void {
		sidebarWidth = Math.max(120, Math.min(400, sidebarWidth + dx));
	}

	let infoWidth = $state(220);

	function onInfoSeparatorResize(dx: number): void {
		infoWidth = Math.max(150, Math.min(400, infoWidth - dx));
	}

	function navigateTo(path: string): void {
		if (path === currentPath) return;
		history = history.slice(0, historyIndex + 1);
		history.push(path);
		historyIndex = history.length - 1;
		currentPath = path;
		selectedEntry = null;
		listSelection.clear();
	}

	function goBack(): void {
		if (!canGoBack) return;
		historyIndex--;
		currentPath = history[historyIndex]!;
	}

	function goForward(): void {
		if (!canGoForward) return;
		historyIndex++;
		currentPath = history[historyIndex]!;
	}

	function goUp(): void {
		if (!canGoUp) return;
		const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
		navigateTo(parent);
	}

	function onIconClick(item: IconGridItemData): void {
		const entry = entries.find(e => e.name === item.id);
		selectedEntry = entry ?? null;
	}

	function updateSelectedEntryFromListSelection(lastClickedName?: string): void {
		const sel = listSelection.selected;
		if (sel.size === 1) {
			selectedEntry = entries.find(en => sel.has(en.name)) ?? null;
		} else if (sel.size > 1 && lastClickedName) {
			selectedEntry = entries.find(en => en.name === lastClickedName) ?? null;
		} else {
			selectedEntry = null;
		}
	}

	let listViewEl: HTMLElement | undefined = $state();
	let listDragStartX = $state(0);
	let listDragStartY = $state(0);
	let listDragCurrentX = $state(0);
	let listDragCurrentY = $state(0);
	let listDragActive = $state(false);
	let listDragPreSelected = new Set<string>();
	let listLastClickedName: string | null = null;

	function listHandlePress(e: PointerEvent): boolean | void {
		const itemEl = (e.target as HTMLElement).closest('[data-list-index]') as HTMLElement | null;
		if (itemEl) {
			const name = itemEl.dataset['listIndex']!;
			listLastClickedName = name;
			const index = entries.findIndex(en => en.name === name);
			if (index >= 0) {
				listSelection.select(
					name,
					index,
					entries.map(en => en.name),
					e
				);
				updateSelectedEntryFromListSelection(name);
			}
		} else {
			listLastClickedName = null;
			if (!(e.ctrlKey || e.metaKey)) {
				listSelection.clear();
				selectedEntry = null;
			}
		}
		listDragPreSelected = new Set(listSelection.selected);
		listDragStartX = e.clientX;
		listDragStartY = e.clientY;
	}

	function listHandleDragStart(): void {
		listDragActive = true;
	}

	function listHandleDragMove(e: PointerEvent): void {
		if (!listViewEl) return;
		listDragCurrentX = e.clientX;
		listDragCurrentY = e.clientY;
		const startY = listDragStartY;
		const currentY = e.clientY;
		const minY = Math.min(startY, currentY);
		const maxY = Math.max(startY, currentY);
		const next = new Set(listDragPreSelected);
		const items = listViewEl.querySelectorAll('[data-list-index]');
		for (const el of items) {
			const rect = el.getBoundingClientRect();
			if (rect.bottom > minY && rect.top < maxY) {
				next.add((el as HTMLElement).dataset['listIndex']!);
			}
		}
		listSelection.set(next);
		updateSelectedEntryFromListSelection();
	}

	function listHandleClick(): void {
		listDragActive = false;
		if (listLastClickedName) {
			const entry = entries.find(en => en.name === listLastClickedName);
			if (entry) {
				const now = Date.now();
				if (now - listLastTapTime < 300 && listLastTapName === listLastClickedName) {
					listLastTapTime = 0;
					listLastTapName = null;
					openEntry(entry);
					return;
				}
				listLastTapTime = now;
				listLastTapName = listLastClickedName;
			}
		}
	}

	function listHandleDragEnd(): void {
		listDragActive = false;
	}

	let listLastTapTime = 0;
	let listLastTapName: string | null = null;

	function onIconDblClick(item: IconGridItemData): void {
		const entry = entries.find(e => e.name === item.id);
		if (entry) openEntry(entry);
	}

	function openEntry(entry: FileEntry): void {
		if (entry.type === 'directory') {
			const path = currentPath === '/' ? '/' + entry.name : currentPath + '/' + entry.name;
			navigateTo(path);
		}
	}

	function onListKeydown(e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			listSelection.selectAll(entries.map(en => en.name));
			updateSelectedEntryFromListSelection();
		}
	}

	function onGridContextMenu(e: MouseEvent): void {
		e.preventDefault();
		const iconEl = (e.target as HTMLElement).closest('[data-icon-id]');
		if (iconEl) {
			const entry = entries.find(en => en.name === (iconEl as HTMLElement).dataset['iconId']);
			if (entry) contextMenu = { x: e.clientX, y: e.clientY, items: getIconMenuItems(entry) };
		} else contextMenu = { x: e.clientX, y: e.clientY, items: emptySpaceMenuItems };
	}
</script>

<style>
	.file-manager {
		display: flex;
		flex-direction: column;
		height: 100%;
		user-select: none;
		outline: none;
	}

	.body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.grid-area {
		flex: 1;
		overflow: auto;
		padding: 8px;
	}

	.list-view {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		position: relative;
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

<div class="file-manager" role="application" tabindex="-1">
	<FileManagerToolbar {canGoBack} {canGoForward} {canGoUp} {breadcrumbSegments} {viewMode} {showInfo} onback={goBack} onforward={goForward} onup={goUp} onnavigate={navigateTo} onviewmode={mode => (viewMode = mode)} ontoggleinfo={() => (showInfo = !showInfo)} />
	<div class="body">
		<FileManagerSidebar disks={mockDisks} {currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<FileManagerSeparator onresize={onSeparatorResize} />
		<div class="grid-area" role="region" oncontextmenu={onGridContextMenu}>
			{#if viewMode === 'grid'}
				<IconGrid items={iconViewItems} onclick={onIconClick} ondblclick={onIconDblClick}>
					{#snippet empty()}
						This directory is empty
					{/snippet}
				</IconGrid>
			{:else if entries.length === 0}
				<div class="empty-state">This directory is empty</div>
			{:else}
				<div class="list-view" role="listbox" bind:this={listViewEl} use:pointerGestures={{ onpress: listHandlePress, onclick: listHandleClick, ondragstart: listHandleDragStart, ondragmove: listHandleDragMove, ondragend: listHandleDragEnd }} onkeydown={onListKeydown} tabindex="0">
					{#each entries as entry}
						<div data-list-index={entry.name}>
							<ListItem active={listSelection.isSelected(entry.name)}>
								<IconGridItem icon={entryIcon(entry)} label={entry.name} layout="horizontal" iconSize="20px" iconColor={entryIconColor(entry)} />
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
		</div>
		{#if showInfo}
			<FileManagerSeparator onresize={onInfoSeparatorResize} />
			<FileManagerInfo selected={selectedEntry} {currentPath} {entries} width={infoWidth} />
		{/if}
	</div>
	{#if contextMenu}
		<ContextMenu items={contextMenu.items} x={contextMenu.x} y={contextMenu.y} onclose={() => (contextMenu = null)} />
	{/if}
</div>
