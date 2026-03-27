<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import { entryIcon, entryIconColor, loadDirectoryEntries } from '../../scripts/file-entry.ts';
	import type { FileEntry } from '../../scripts/file-entry.ts';
	import type { DiskInfo } from './filebrowser.ts';
	import { getStorageEstimate } from '../../scripts/opfs.ts';
	import { openWindow } from '../../scripts/window-store.svelte.ts';
	import { getFileHandler } from '../../scripts/file-types.ts';
	import { onDirectoryChange } from '../../scripts/opfs-notify.ts';
	import { confirmDelete } from '../../scripts/file-actions.ts';
	import { isLinkFile, readLink, resolveLink } from '../../scripts/link.ts';
	import FileBrowserToolbar from './FileBrowserToolbar.svelte';
	import FileBrowserSidebar from './FileBrowserSidebar.svelte';
	import FileBrowserSeparator from './FileBrowserSeparator.svelte';
	import FileBrowserInfo from './FileBrowserInfo.svelte';
	import DirectoryView from '../../components/DirectoryView/DirectoryView.svelte';
	import ListItem from '../../components/ListItem/ListItem.svelte';
	import IconGridItem from '../../components/IconGrid/IconGridItem.svelte';
	import { createSelection } from '../../scripts/selection.svelte.ts';
	import { pointerGestures } from '../../scripts/pointer-gestures.ts';
	import { browser } from '$app/environment';
	const win = getWindow();
	win.title = 'File Browser';
	win.icon = '/img/apps/file-browser.svg';
	win.width = 800;
	win.height = 600;
	win.minWidth = 320;
	win.minHeight = 240;
	interface Props {
		path?: string;
	}
	const { path }: Props = $props();
	let currentPath = $state('/');
	let history = $state<string[]>(['/']);
	let historyIndex = $state(0);
	let sidebarWidth = $state(180);
	let viewMode = $state<'grid' | 'list'>('grid');
	let showInfo = $state(true);
	let selectedEntries = $state<FileEntry[]>([]);
	const listSelection = createSelection();
	let entries = $state<FileEntry[]>([]);
	let disks = $state<DiskInfo[]>([]);
	const canGoBack = $derived(historyIndex > 0);
	const canGoForward = $derived(historyIndex < history.length - 1);
	const canGoUp = $derived(currentPath !== '/');
	const sortedEntries = $derived(
		entries.toSorted((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		})
	);
	async function loadDirectory(dirPath: string): Promise<void> {
		try {
			entries = await loadDirectoryEntries(dirPath);
		} catch {
			entries = [];
		}
	}
	let unsubscribeDir: (() => void) | null = null;

	function subscribeToDirectory(): void {
		unsubscribeDir?.();
		unsubscribeDir = onDirectoryChange(currentPath, () => loadDirectory(currentPath));
	}

	async function loadDiskInfo(): Promise<void> {
		const estimate = await getStorageEstimate();
		disks = [{ name: 'OPFS drive', path: '/', icon: '/img/apps/file-browser.svg', total: estimate.total, free: estimate.total - estimate.used }];
	}

	function init(): void {
		const startPath = path ?? '/';
		currentPath = startPath;
		history = [startPath];
		if (browser) {
			loadDiskInfo();
			loadDirectory(startPath);
			subscribeToDirectory();
		}
	}
	init();

	const breadcrumbSegments = $derived.by(() => {
		if (currentPath === '/') return [{ name: 'Root', path: '/' }];
		const parts = currentPath.split('/').filter(Boolean);
		const segments = [{ name: 'Root', path: '/' }];
		for (let i = 0; i < parts.length; i++) segments.push({ name: parts[i]!, path: '/' + parts.slice(0, i + 1).join('/') });
		return segments;
	});

	function onSeparatorResize(dx: number): void {
		sidebarWidth = Math.max(120, Math.min(400, sidebarWidth + dx));
	}

	let infoWidth = $state(220);

	function onInfoSeparatorResize(dx: number): void {
		infoWidth = Math.max(150, Math.min(400, infoWidth - dx));
	}

	function navigateTo(navPath: string): void {
		if (navPath === currentPath) return;
		history = history.slice(0, historyIndex + 1);
		history.push(navPath);
		historyIndex = history.length - 1;
		currentPath = navPath;
		selectedEntries = [];
		listSelection.clear();
		loadDirectory(navPath);
		subscribeToDirectory();
	}

	function goBack(): void {
		if (!canGoBack) return;
		historyIndex--;
		currentPath = history[historyIndex]!;
		loadDirectory(currentPath);
		subscribeToDirectory();
	}

	function goForward(): void {
		if (!canGoForward) return;
		historyIndex++;
		currentPath = history[historyIndex]!;
		loadDirectory(currentPath);
		subscribeToDirectory();
	}

	function goUp(): void {
		if (!canGoUp) return;
		const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
		navigateTo(parent);
	}

	function onDirectoryViewSelectionChange(selected: FileEntry[]): void {
		selectedEntries = selected;
	}

	function onDirectoryViewEntriesChange(newEntries: FileEntry[]): void {
		entries = newEntries;
	}

	function updateSelectedEntriesFromList(): void {
		selectedEntries = sortedEntries.filter(en => listSelection.selected.has(en.name));
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
			const index = sortedEntries.findIndex(en => en.name === name);
			if (index >= 0) {
				listSelection.select(
					name,
					index,
					sortedEntries.map(en => en.name),
					e
				);
				updateSelectedEntriesFromList();
			}
		} else {
			listLastClickedName = null;
			if (!(e.ctrlKey || e.metaKey)) {
				listSelection.clear();
				selectedEntries = [];
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
		updateSelectedEntriesFromList();
	}

	function listHandleClick(): void {
		listDragActive = false;
		if (listLastClickedName) {
			const entry = sortedEntries.find(en => en.name === listLastClickedName);
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

	async function openEntry(entry: FileEntry): Promise<void> {
		if (entry.type === 'directory') {
			const entryPath = currentPath === '/' ? '/' + entry.name : currentPath + '/' + entry.name;
			navigateTo(entryPath);
		} else if (isLinkFile(entry.name)) {
			const linkData = await readLink(currentPath, entry.name);
			if (linkData) {
				const resolved = resolveLink(linkData);
				if (resolved) openWindow(resolved.component, resolved.props);
			}
		} else {
			const handler = await getFileHandler(currentPath, entry.name);
			if (handler) openWindow(handler.component, handler.props);
		}
	}

	function onListKeydown(e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			listSelection.selectAll(sortedEntries.map(en => en.name));
			updateSelectedEntriesFromList();
		}
	}

	function onToggleInfo(): void {
		showInfo = !showInfo;
	}

	function onViewModeChange(mode: 'grid' | 'list'): void {
		viewMode = mode;
		selectedEntries = [];
		listSelection.clear();
	}

	function handleFileBrowserKeydown(e: KeyboardEvent): void {
		if (viewMode === 'list' && e.key === 'Delete' && selectedEntries.length > 0) {
			e.preventDefault();
			for (const entry of selectedEntries) confirmDelete(currentPath, entry.name, entry.type, e.shiftKey);
		}
	}
</script>

<style>
	.file-browser {
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

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="file-browser" role="application" tabindex="-1" onkeydown={handleFileBrowserKeydown}>
	<FileBrowserToolbar {canGoBack} {canGoForward} {canGoUp} {breadcrumbSegments} {viewMode} {showInfo} onback={goBack} onforward={goForward} onup={goUp} onnavigate={navigateTo} onviewmode={onViewModeChange} ontoggleinfo={onToggleInfo} />
	<div class="body">
		<FileBrowserSidebar {disks} {currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<FileBrowserSeparator onresize={onSeparatorResize} />
		<div class="grid-area">
			{#if viewMode === 'grid'}
				<DirectoryView path={currentPath} onnavigate={navigateTo} onselectionchange={onDirectoryViewSelectionChange} onentrieschange={onDirectoryViewEntriesChange} />
			{:else if sortedEntries.length === 0}
				<div class="empty-state">This directory is empty</div>
			{:else}
				<div class="list-view" role="listbox" bind:this={listViewEl} use:pointerGestures={{ onpress: listHandlePress, onclick: listHandleClick, ondragstart: listHandleDragStart, ondragmove: listHandleDragMove, ondragend: listHandleDragEnd }} onkeydown={onListKeydown} tabindex="0">
					{#each sortedEntries as entry}
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
			<FileBrowserSeparator onresize={onInfoSeparatorResize} />
			<FileBrowserInfo selected={selectedEntries} {currentPath} entries={sortedEntries} width={infoWidth} />
		{/if}
	</div>
</div>
