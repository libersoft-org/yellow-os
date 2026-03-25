<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import type { FileEntry } from './filemanager.ts';
	const win = getWindow();
	win.title = 'File Manager';
	win.icon = '/img/apps/file-manager.svg';
	win.width = 640;
	win.height = 480;
	win.minWidth = 320;
	win.minHeight = 240;
	import { mockFs, mockDisks } from './filemanager.ts';
	import FileManagerToolbar from './FileManagerToolbar.svelte';
	import FileManagerSidebar from './FileManagerSidebar.svelte';
	import FileManagerSeparator from './FileManagerSeparator.svelte';
	import type { IconGridItemData } from '../../components/IconGrid/icon-grid.ts';
	import IconGrid from '../../components/IconGrid/IconGrid.svelte';
	import ContextMenu from '../../components/ContextMenu/ContextMenu.svelte';
	import type { ContextMenuItem } from '../../components/ContextMenu/context-menu.ts';
	import ListItem from '../../components/ListItem/ListItem.svelte';
	import IconGridItem from '../../components/IconGrid/IconGridItem.svelte';
	let currentPath = $state('/');
	let history = $state<string[]>(['/']);
	let historyIndex = $state(0);
	let sidebarWidth = $state(180);
	let viewMode = $state<'grid' | 'list'>('grid');
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
			icon: e.type === 'directory' ? '/img/directory.svg' : '/img/file.svg',
			label: e.name,
			iconColor: e.type === 'directory' ? '--color-accent' : '--color-text-dim',
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

	function navigateTo(path: string): void {
		if (path === currentPath) return;
		history = history.slice(0, historyIndex + 1);
		history.push(path);
		historyIndex = history.length - 1;
		currentPath = path;
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="file-manager" tabindex="-1">
	<FileManagerToolbar {canGoBack} {canGoForward} {canGoUp} {breadcrumbSegments} {viewMode} onback={goBack} onforward={goForward} onup={goUp} onnavigate={navigateTo} onviewmode={mode => (viewMode = mode)} />
	<div class="body">
		<FileManagerSidebar disks={mockDisks} {currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<FileManagerSeparator onresize={onSeparatorResize} />
		<div class="grid-area" oncontextmenu={onGridContextMenu}>
			{#if viewMode === 'grid'}
				<IconGrid items={iconViewItems} ondblclick={onIconDblClick}>
					{#snippet empty()}
						This directory is empty
					{/snippet}
				</IconGrid>
			{:else if entries.length === 0}
				<div class="empty-state">This directory is empty</div>
			{:else}
				<div class="list-view">
					{#each entries as entry}
						<ListItem onclick={() => openEntry(entry)}>
							<IconGridItem icon={entry.type === 'directory' ? '/img/directory.svg' : '/img/file.svg'} label={entry.name} layout="horizontal" iconSize="20px" iconColor={entry.type === 'directory' ? '--color-accent' : '--color-text-dim'} />
						</ListItem>
					{/each}
				</div>
			{/if}
		</div>
	</div>
	{#if contextMenu}
		<ContextMenu items={contextMenu.items} x={contextMenu.x} y={contextMenu.y} onclose={() => (contextMenu = null)} />
	{/if}
</div>
