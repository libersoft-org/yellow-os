<script lang="ts">
	import type { FileEntry } from './filemanager';
	import { mockFs, mockDisks } from './filemanager';
	import FileManagerToolbar from './FileManagerToolbar.svelte';
	import FileManagerSidebar from './FileManagerSidebar.svelte';
	import FileManagerSeparator from './FileManagerSeparator.svelte';
	import FileManagerGrid from './FileManagerGrid.svelte';
	let currentPath = $state('/');
	let history = $state<string[]>(['/']);
	let historyIndex = $state(0);
	let selected = $state(new Set<string>());
	let sidebarWidth = $state(180);
	const canGoBack = $derived(historyIndex > 0);
	const canGoForward = $derived(historyIndex < history.length - 1);
	const canGoUp = $derived(currentPath !== '/');
	const entries = $derived(
		(mockFs[currentPath] ?? []).toSorted((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		})
	);
	const breadcrumbSegments = $derived.by(() => {
		if (currentPath === '/') return [{ name: 'Root', path: '/' }];
		const parts = currentPath.split('/').filter(Boolean);
		const segments = [{ name: 'Root', path: '/' }];
		for (let i = 0; i < parts.length; i++) segments.push({ name: parts[i]!, path: '/' + parts.slice(0, i + 1).join('/') });
		return segments;
	});

	function onSeparatorResize(dx: number) {
		sidebarWidth = Math.max(120, Math.min(400, sidebarWidth + dx));
	}

	function navigateTo(path: string) {
		if (path === currentPath) return;
		history = history.slice(0, historyIndex + 1);
		history.push(path);
		historyIndex = history.length - 1;
		currentPath = path;
		selected = new Set();
	}

	function goBack() {
		if (!canGoBack) return;
		historyIndex--;
		currentPath = history[historyIndex]!;
		selected = new Set();
	}

	function goForward() {
		if (!canGoForward) return;
		historyIndex++;
		currentPath = history[historyIndex]!;
		selected = new Set();
	}

	function goUp() {
		if (!canGoUp) return;
		const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
		navigateTo(parent);
	}

	function openEntry(entry: FileEntry) {
		if (entry.type === 'directory') {
			const path = currentPath === '/' ? '/' + entry.name : currentPath + '/' + entry.name;
			navigateTo(path);
		}
	}
</script>

<style>
	.file-manager {
		display: flex;
		flex-direction: column;
		height: calc(100% + 32px);
		margin: -16px;
		user-select: none;
		outline: none;
	}

	.body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="file-manager" tabindex="-1">
	<FileManagerToolbar {canGoBack} {canGoForward} {canGoUp} {breadcrumbSegments} onback={goBack} onforward={goForward} onup={goUp} onnavigate={navigateTo} />
	<div class="body">
		<FileManagerSidebar disks={mockDisks} {currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<FileManagerSeparator onresize={onSeparatorResize} />
		<FileManagerGrid {entries} {selected} onselectionchange={s => (selected = s)} onopen={openEntry} />
	</div>
</div>
