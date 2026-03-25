<script lang="ts">
	import type { FileEntry } from './filebrowser.ts';
	import { entryIcon, entryIconColor } from './filebrowser.ts';
	import Icon from '../../components/Icon/Icon.svelte';
	import { formatBytes } from '../../scripts/format.ts';
	interface Props {
		selected: FileEntry[];
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

	const totalSize = $derived(formatBytes(entries.filter(e => e.type === 'file').reduce((sum, e) => sum + e.size, 0)));
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
</style>

<div class="info-panel" style:width="{width}px">
	{#if selected.length > 1}
		{@const selDirs = selected.filter(e => e.type === 'directory').length}
		{@const selFiles = selected.filter(e => e.type === 'file').length}
		{@const selSize = formatBytes(selected.filter(e => e.type === 'file').reduce((sum, e) => sum + e.size, 0))}
		<div class="name">{selected.length} items selected</div>
		<div class="details">
			{#if selDirs > 0}
				<div class="detail-row">
					<span class="detail-label">Folders</span>
					<span class="detail-value">{selDirs}</span>
				</div>
			{/if}
			{#if selFiles > 0}
				<div class="detail-row">
					<span class="detail-label">Files</span>
					<span class="detail-value">{selFiles}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Total size</span>
					<span class="detail-value">{selSize}</span>
				</div>
			{/if}
		</div>
	{:else if selected.length === 1}
		{@const item = selected[0]!}
		<div class="name">{item.name}</div>
		<div class="icon-preview">
			<Icon img={entryIcon(item)} alt={item.name} size="64px" padding="0" colorVariable={entryIconColor(item)} />
		</div>
		<div class="details">
			<div class="detail-row">
				<span class="detail-label">Type</span>
				<span class="detail-value">{item.type === 'directory' ? 'Directory' : getExtension(item.name)}</span>
			</div>
			{#if item.type === 'file' && item.size > 0}
				<div class="detail-row">
					<span class="detail-label">Size</span>
					<span class="detail-value">{formatBytes(item.size)}</span>
				</div>
			{/if}
			{#if item.modified > 0}
				<div class="detail-row">
					<span class="detail-label">Modified</span>
					<span class="detail-value">{new Date(item.modified).toLocaleDateString()}</span>
				</div>
			{/if}
		</div>
	{:else}
		<div class="name">{getDirName(currentPath)}</div>
		<div class="icon-preview">
			<Icon img="/img/directory.svg" alt="Current directory" size="64px" padding="0" colorVariable="--color-accent" />
		</div>
		<div class="details">
			<div class="detail-row">
				<span class="detail-label">Folders</span>
				<span class="detail-value">{dirCount}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Files</span>
				<span class="detail-value">{fileCount}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Total size</span>
				<span class="detail-value">{totalSize}</span>
			</div>
		</div>
	{/if}
</div>
