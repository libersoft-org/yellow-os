<script lang="ts">
	import type { FileEntry } from './filemanager';
	import { mockFs, mockDisks } from './filemanager';
	import FileManagerToolbar from './FileManagerToolbar.svelte';
	import FileManagerSidebar from './FileManagerSidebar.svelte';
	import FileManagerSeparator from './FileManagerSeparator.svelte';
	import IconView, { type IconViewItem } from '../../components/IconView/IconView.svelte';

	let currentPath = $state('/');
	let history = $state<string[]>(['/']);
	let historyIndex = $state(0);
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

	const iconViewItems = $derived<IconViewItem[]>(
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

	function onSeparatorResize(dx: number) {
		sidebarWidth = Math.max(120, Math.min(400, sidebarWidth + dx));
	}

	function navigateTo(path: string) {
		if (path === currentPath) return;
		history = history.slice(0, historyIndex + 1);
		history.push(path);
		historyIndex = history.length - 1;
		currentPath = path;
	}

	function goBack() {
		if (!canGoBack) return;
		historyIndex--;
		currentPath = history[historyIndex]!;
	}

	function goForward() {
		if (!canGoForward) return;
		historyIndex++;
		currentPath = history[historyIndex]!;
	}

	function goUp() {
		if (!canGoUp) return;
		const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
		navigateTo(parent);
	}

	function onIconDblClick(item: IconViewItem) {
		const entry = entries.find(e => e.name === item.id);
		if (entry) openEntry(entry);
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

	.grid-area {
		flex: 1;
		overflow: auto;
		padding: 8px;
	}
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="file-manager" tabindex="-1">
	<FileManagerToolbar {canGoBack} {canGoForward} {canGoUp} {breadcrumbSegments} onback={goBack} onforward={goForward} onup={goUp} onnavigate={navigateTo} />
	<div class="body">
		<FileManagerSidebar disks={mockDisks} {currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<FileManagerSeparator onresize={onSeparatorResize} />
		<div class="grid-area">
			<IconView items={iconViewItems} ondblclick={onIconDblClick}>
				{#snippet empty()}
					This directory is empty
				{/snippet}
			</IconView>
		</div>
	</div>
</div>
