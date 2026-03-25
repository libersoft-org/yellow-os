<script lang="ts">
	import type { FileEntry } from './filemanager.ts';
	import Icon from '../../components/Icon/Icon.svelte';
	import { formatBytes, parseBytes } from '../../scripts/format.ts';
	interface Props {
		selected: FileEntry | null;
		currentPath: string;
		entries: FileEntry[];
		width?: number;
	}
	const { selected, currentPath, entries, width = 220 }: Props = $props();

	function getExtension(name: string): string {
		const dot = name.lastIndexOf('.');
		return dot > 0 ? name.substring(dot + 1).toUpperCase() : '—';
	}

	function getDirName(path: string): string {
		if (path === '/') return 'Root';
		const parts = path.split('/').filter(Boolean);
		return parts[parts.length - 1] ?? 'Root';
	}

	const dirCount = $derived(entries.filter(e => e.type === 'directory').length);
	const fileCount = $derived(entries.filter(e => e.type === 'file').length);

	const totalSize = $derived(formatBytes(entries.filter(e => e.type === 'file' && e.size).reduce((sum, e) => sum + parseBytes(e.size!), 0)));
</script>

<style>
	.info-panel {
		flex-shrink: 0;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.name {
		font-size: 14px;
		font-weight: 600;
		text-align: center;
		word-break: break-word;
		color: var(--color-text);
	}

	.icon-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 0;
	}

	.details {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 12px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}

	.detail-label {
		color: var(--color-text-dim);
		flex-shrink: 0;
	}

	.detail-value {
		color: var(--color-text);
		text-align: right;
		word-break: break-word;
	}

	.summary {
		width: 100%;
		font-size: 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		color: var(--color-text-dim);
		text-align: center;
	}
</style>

<div class="info-panel" style:width="{width}px">
	{#if selected}
		<div class="name">{selected.name}</div>
		<div class="icon-preview">
			<Icon img={selected.type === 'directory' ? '/img/directory.svg' : '/img/file.svg'} alt={selected.name} size="64px" padding="0" colorVariable={selected.type === 'directory' ? '--color-accent' : '--color-text-dim'} />
		</div>
		<div class="details">
			<div class="detail-row">
				<span class="detail-label">Type</span>
				<span class="detail-value">{selected.type === 'directory' ? 'Directory' : getExtension(selected.name)}</span>
			</div>
			{#if selected.type === 'file' && selected.size}
				<div class="detail-row">
					<span class="detail-label">Size</span>
					<span class="detail-value">{selected.size}</span>
				</div>
			{/if}
			{#if selected.modified}
				<div class="detail-row">
					<span class="detail-label">Modified</span>
					<span class="detail-value">{selected.modified}</span>
				</div>
			{/if}
		</div>
	{:else}
		<div class="name">{getDirName(currentPath)}</div>
		<div class="icon-preview">
			<Icon img="/img/directory.svg" alt="Current directory" size="64px" padding="0" colorVariable="--color-accent" />
		</div>
		<div class="summary">
			<div>{dirCount} {dirCount === 1 ? 'folder' : 'folders'}, {fileCount} {fileCount === 1 ? 'file' : 'files'}</div>
			<div>Total size: {totalSize}</div>
		</div>
	{/if}
</div>
