<script lang="ts">
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import { entryIcon, entryIconColor, getExtension } from '../../scripts/fs/file-entry.ts';
	import { formatBytes } from '../../scripts/system/format.ts';
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		entry?: FileEntry | undefined;
		entries?: FileEntry[] | undefined;
	}
	const { entry, entries }: Props = $props();

	const items = $derived(entries ?? (entry ? [entry] : []));
	const single = $derived(items.length === 1 ? items[0]! : null);
	const dirCount = $derived(items.filter(e => e.type === 'directory').length);
	const fileCount = $derived(items.filter(e => e.type === 'file').length);
	const totalSize = $derived(formatBytes(items.filter(e => e.type === 'file').reduce((sum, e) => sum + e.size, 0)));

	function getDisplayExtension(name: string): string {
		const ext = getExtension(name);
		return ext ? ext.toUpperCase() : '—';
	}
</script>

<style>
	.entry-info {
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

<div class="entry-info">
	{#if single}
		<div class="name">{single.name}</div>
		<div class="icon-preview">
			<Icon img={entryIcon(single)} alt={single.name} size="64px" padding="0" colorVariable={entryIconColor(single)} />
		</div>
		<div class="details">
			<div class="detail-row">
				<span class="detail-label">Type</span>
				<span class="detail-value">{single.type === 'directory' ? 'Directory' : getDisplayExtension(single.name)}</span>
			</div>
			{#if single.type === 'file'}
				<div class="detail-row">
					<span class="detail-label">Size</span>
					<span class="detail-value">{formatBytes(single.size)}</span>
				</div>
			{/if}
			{#if single.modified > 0}
				<div class="detail-row">
					<span class="detail-label">Modified</span>
					<span class="detail-value">{new Date(single.modified).toLocaleString()}</span>
				</div>
			{/if}
		</div>
	{:else if items.length > 1}
		<div class="name">{items.length} items selected</div>
		<div class="details">
			{#if dirCount > 0}
				<div class="detail-row">
					<span class="detail-label">Directories</span>
					<span class="detail-value">{dirCount}</span>
				</div>
			{/if}
			{#if fileCount > 0}
				<div class="detail-row">
					<span class="detail-label">Files</span>
					<span class="detail-value">{fileCount}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Total size</span>
					<span class="detail-value">{totalSize}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
