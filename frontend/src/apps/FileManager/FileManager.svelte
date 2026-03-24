<script lang="ts">
	import type { FileEntry } from './filemanager.ts';
	import { mockFs, mockDisks } from './filemanager.ts';
	import FileManagerToolbar from './FileManagerToolbar.svelte';
	import FileManagerSidebar from './FileManagerSidebar.svelte';
	import FileManagerSeparator from './FileManagerSeparator.svelte';
	import type { IconGridItemData } from '../../components/IconGrid/icon-grid.ts';
	import IconGrid from '../../components/IconGrid/IconGrid.svelte';

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
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="file-manager" tabindex="-1">
	<FileManagerToolbar {canGoBack} {canGoForward} {canGoUp} {breadcrumbSegments} onback={goBack} onforward={goForward} onup={goUp} onnavigate={navigateTo} />
	<div class="body">
		<FileManagerSidebar disks={mockDisks} {currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<FileManagerSeparator onresize={onSeparatorResize} />
		<div class="grid-area">
			<IconGrid items={iconViewItems} ondblclick={onIconDblClick}>
				{#snippet empty()}
					This directory is empty
				{/snippet}
			</IconGrid>
		</div>
	</div>
</div>
