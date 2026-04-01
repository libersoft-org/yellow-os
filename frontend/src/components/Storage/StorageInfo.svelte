<script lang="ts">
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import type { DiskInfo } from './storage.svelte.ts';
	import Icon from '../Icon/Icon.svelte';
	import StorageEntryInfo from './StorageEntryInfo.svelte';
	import PieChart from '../PieChart/PieChart.svelte';
	import type { PieChartSegment } from '../PieChart/PieChart.svelte';
	import { formatBytes } from '../../scripts/system/format.ts';
	interface Props {
		selected: FileEntry[];
		currentPath: string;
		entries: FileEntry[];
		disks: DiskInfo[];
		width?: number;
	}
	const { selected, currentPath, entries, disks, width = 220 }: Props = $props();
	const currentDisk = $derived(disks.find(d => d.path === currentPath));
	const diskSegments = $derived.by((): PieChartSegment[] => {
		if (!currentDisk) return [];
		const used = currentDisk.total - currentDisk.free;
		return [
			{ value: used, colorVariable: '--color-accent', label: 'Used' },
			{ value: currentDisk.free, colorVariable: '--color-surface-3', label: 'Free' },
		];
	});
	const dirCount = $derived(entries.filter(e => e.type === 'directory').length);
	const fileCount = $derived(entries.filter(e => e.type === 'file').length);
	const totalSize = $derived(formatBytes(entries.filter(e => e.type === 'file').reduce((sum, e) => sum + e.size, 0)));

	function getDirName(path: string): string {
		if (path === '/') return 'Root';
		const parts = path.split('/').filter(Boolean);
		return parts[parts.length - 1] ?? 'Root';
	}
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

	.separator {
		width: 100%;
		height: 1px;
		background: var(--color-border);
		margin: 4px 0;
	}

	.detail-value {
		color: var(--color-text);
		text-align: right;
		word-break: break-word;
	}
</style>

<div class="info-panel" style:width="{width}px">
	{#if selected.length > 1}
		<StorageEntryInfo entries={selected} />
	{:else if selected.length === 1}
		{@const item = selected[0]!}
		<StorageEntryInfo entry={item} />
	{:else}
		<div class="name">{getDirName(currentPath)}</div>
		<div class="icon-preview">
			<Icon img="/img/directory.svg" alt="Current directory" size="64px" padding="0" colorVariable="--color-accent" />
		</div>
		<div class="details">
			<div class="detail-row">
				<span class="detail-label">Directories</span>
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
		{#if currentDisk}
			<div class="separator"></div>
			<PieChart segments={diskSegments} size={90} strokeWidth={18} />
			<div class="details">
				<div class="detail-row">
					<span class="detail-label">Total</span>
					<span class="detail-value">{formatBytes(currentDisk.total)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Used</span>
					<span class="detail-value">{formatBytes(currentDisk.total - currentDisk.free)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Free</span>
					<span class="detail-value">{formatBytes(currentDisk.free)}</span>
				</div>
			</div>
		{/if}
	{/if}
</div>
