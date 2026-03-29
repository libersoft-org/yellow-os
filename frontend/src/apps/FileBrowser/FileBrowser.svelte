<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import type { FileEntry } from '../../scripts/file-entry.ts';
	import type { DiskInfo } from './filebrowser.ts';
	import { getStorageEstimate } from '../../scripts/opfs.ts';
	import FileBrowserToolbar from './FileBrowserToolbar.svelte';
	import FileBrowserSidebar from './FileBrowserSidebar.svelte';
	import FileBrowserSeparator from './FileBrowserSeparator.svelte';
	import FileBrowserInfo from './FileBrowserInfo.svelte';
	import DirectoryView from '../../components/DirectoryView/DirectoryView.svelte';
	import { browser } from '$app/environment';
	const win = getWindow();
	win.title = 'File Browser';
	win.icon = '/img/apps/file-browser.svg';
	win.width = 768;
	win.height = 480;
	win.minWidth = 640;
	win.minHeight = 320;
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
	let entries = $state<FileEntry[]>([]);
	let disks = $state<DiskInfo[]>([]);
	const canGoBack = $derived(historyIndex > 0);
	const canGoForward = $derived(historyIndex < history.length - 1);
	const canGoUp = $derived(currentPath !== '/');
	async function loadDiskInfo(): Promise<void> {
		const estimate = await getStorageEstimate();
		disks = [{ name: 'OPFS drive', path: '/', icon: '/img/apps/file-browser.svg', total: estimate.total, free: estimate.total - estimate.used }];
	}

	function init(): void {
		const startPath = path ?? '/';
		currentPath = startPath;
		history = [startPath];
		if (browser) loadDiskInfo();
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

	function onDirectoryViewSelectionChange(selected: FileEntry[]): void {
		selectedEntries = selected;
	}

	function onDirectoryViewEntriesChange(newEntries: FileEntry[]): void {
		entries = newEntries;
	}

	function onToggleInfo(): void {
		showInfo = !showInfo;
	}

	function onViewModeChange(mode: 'grid' | 'list'): void {
		viewMode = mode;
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
</style>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="file-browser" role="application" tabindex="-1">
	<FileBrowserToolbar {canGoBack} {canGoForward} {canGoUp} {breadcrumbSegments} {viewMode} {showInfo} onback={goBack} onforward={goForward} onup={goUp} onnavigate={navigateTo} onviewmode={onViewModeChange} ontoggleinfo={onToggleInfo} />
	<div class="body">
		<FileBrowserSidebar {disks} {currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<FileBrowserSeparator onresize={onSeparatorResize} />
		<div class="grid-area">
			{#key currentPath}
				<DirectoryView path={currentPath} {viewMode} onnavigate={navigateTo} onselectionchange={onDirectoryViewSelectionChange} onentrieschange={onDirectoryViewEntriesChange} />
			{/key}
		</div>
		{#if showInfo}
			<FileBrowserSeparator onresize={onInfoSeparatorResize} />
			<FileBrowserInfo selected={selectedEntries} {currentPath} {entries} width={infoWidth} />
		{/if}
	</div>
</div>
