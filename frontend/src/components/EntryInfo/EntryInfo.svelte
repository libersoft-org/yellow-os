<script lang="ts">
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import { entryIcon, entryIconColor, getExtension } from '../../scripts/fs/file-entry.ts';
	import { formatBytes } from '../../scripts/system/format.ts';
	import { entriesStats } from '../../scripts/fs/opfs.ts';
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		entry?: FileEntry | undefined;
		entries?: FileEntry[] | undefined;
		recursive?: boolean | undefined;
		path?: string | undefined;
	}
	const { entry, entries, recursive, path }: Props = $props();
	const items = $derived(entries ?? (entry ? [entry] : []));
	const single = $derived(items.length === 1 ? items[0]! : null);
	const dirCount = $derived(items.filter(e => e.type === 'directory').length);
	const fileCount = $derived(items.filter(e => e.type === 'file').length);
	const totalSize = $derived(formatBytes(items.filter(e => e.type === 'file').reduce((sum, e) => sum + e.size, 0)));
	const statsPromise = $derived(recursive && path && items.length > 0 ? entriesStats(path, items) : null);

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
		width: 100%;
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
	{#snippet multiDetails(dirs: number, files: number, size: string)}
		{#if dirs > 0}
			<div class="detail-row">
				<span class="detail-label">Directories</span>
				<span class="detail-value">{dirs}</span>
			</div>
		{/if}
		{#if files > 0}
			<div class="detail-row">
				<span class="detail-label">Files</span>
				<span class="detail-value">{files}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Total size</span>
				<span class="detail-value">{size}</span>
			</div>
		{/if}
	{/snippet}
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
			{:else if statsPromise}
				{#await statsPromise}
					<div class="detail-row">
						<span class="detail-label">Calculating…</span>
					</div>
				{:then stats}
					{@render multiDetails(stats.directories, stats.files, formatBytes(stats.totalSize))}
				{/await}
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
			{#if statsPromise}
				{#await statsPromise}
					<div class="detail-row">
						<span class="detail-label">Calculating…</span>
					</div>
				{:then stats}
					{@render multiDetails(stats.directories, stats.files, formatBytes(stats.totalSize))}
				{/await}
			{:else}
				{@render multiDetails(dirCount, fileCount, totalSize)}
			{/if}
		</div>
	{/if}
</div>
