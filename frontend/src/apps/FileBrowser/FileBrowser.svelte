<script lang="ts">
	import { getWindow } from '../../scripts/window/window-context.ts';
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import { createStorageNavigation, loadDisks } from '../../components/Storage/storage.svelte.ts';
	import type { DiskInfo } from '../../components/Storage/storage.svelte.ts';
	import StorageToolbar from '../../components/Storage/StorageToolbar.svelte';
	import StorageDrives from '../../components/Storage/StorageDrives.svelte';
	import PanelSeparator from '../../components/PanelSeparator/PanelSeparator.svelte';
	import StorageInfo from '../../components/Storage/StorageInfo.svelte';
	import StorageBrowser from '../../components/Storage/StorageBrowser.svelte';
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
	const props: Props = $props();
	const nav = createStorageNavigation(() => props.path ?? '/');
	let sidebarWidth = $state(180);
	let viewMode = $state<'grid' | 'list'>('grid');
	let showInfo = $state(true);
	let selectedEntries = $state<FileEntry[]>([]);
	let entries = $state<FileEntry[]>([]);
	let disks = $state<DiskInfo[]>([]);

	function init(): void {
		if (browser) loadDisks().then(d => (disks = d));
	}
	init();

	function onSeparatorResize(dx: number): void {
		sidebarWidth = Math.max(120, Math.min(400, sidebarWidth + dx));
	}

	let infoWidth = $state(220);

	function onInfoSeparatorResize(dx: number): void {
		infoWidth = Math.max(150, Math.min(400, infoWidth - dx));
	}

	function navigateTo(navPath: string): void {
		nav.navigateTo(navPath);
		selectedEntries = [];
	}

	function onSelectionChange(selected: FileEntry[]): void {
		selectedEntries = selected;
	}

	function onEntriesChange(newEntries: FileEntry[]): void {
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
	}
</style>

<div class="file-browser" role="group" tabindex="-1">
	<StorageToolbar canGoBack={nav.canGoBack} canGoForward={nav.canGoForward} canGoUp={nav.canGoUp} breadcrumbSegments={nav.breadcrumbSegments} {viewMode} {showInfo} onback={nav.goBack} onforward={nav.goForward} onup={nav.goUp} onnavigate={navigateTo} onviewmode={onViewModeChange} ontoggleinfo={onToggleInfo} />
	<div class="body">
		<StorageDrives {disks} currentPath={nav.currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<PanelSeparator onresize={onSeparatorResize} />
		<div class="grid-area">
			{#key nav.currentPath}
				<StorageBrowser path={nav.currentPath} {viewMode} onnavigate={navigateTo} onselectionchange={onSelectionChange} onentrieschange={onEntriesChange} />
			{/key}
		</div>
		{#if showInfo}
			<PanelSeparator onresize={onInfoSeparatorResize} />
			<StorageInfo selected={selectedEntries} currentPath={nav.currentPath} {entries} {disks} width={infoWidth} />
		{/if}
	</div>
</div>
