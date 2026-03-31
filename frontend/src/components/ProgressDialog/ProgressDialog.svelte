<script lang="ts">
	import { formatBytes } from '../../scripts/system/format.ts';
	import { getProgress } from '../../scripts/fs/file-progress.svelte.ts';
	import Button from '../../components/Button/Button.svelte';

	interface Props {
		oncancel: () => void;
	}

	const { oncancel }: Props = $props();

	const progress = getProgress();

	const percentage = $derived(progress.bytesTotal > 0 ? Math.round((progress.bytesCopied / progress.bytesTotal) * 100) : progress.fileCount > 0 ? Math.round((progress.fileIndex / progress.fileCount) * 100) : 0);

	const speed = $derived.by((): number => {
		if (progress.bytesCopied === 0 || progress.startTime === 0) return 0;
		const elapsed = (Date.now() - progress.startTime) / 1000;
		if (elapsed < 0.1) return 0;
		return progress.bytesCopied / elapsed;
	});

	const progressLabel = $derived(progress.bytesTotal > 0 ? `${formatBytes(progress.bytesCopied, 2, true)} / ${formatBytes(progress.bytesTotal, 2, true)}` : `${progress.fileIndex} / ${progress.fileCount}`);

	const speedLabel = $derived(speed > 0 ? `${formatBytes(speed, 2, true)}/s` : '');
</script>

<style>
	.progress-dialog {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 16px;
		gap: 12px;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-height: 0;
	}

	.current-file {
		font-size: 13px;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.size-info,
	.speed-info {
		font-size: 12px;
		font-family: var(--font-family-mono);
		color: var(--color-text-dim);
	}

	.progress-bar-container {
		width: 100%;
		height: 18px;
		background: var(--color-surface-2);
		border-radius: 9px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 9px;
		transition: width 0.15s ease;
	}

	.progress-bar-text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text);
	}

	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}

	.buttons {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-left: auto;
	}
</style>

<div class="progress-dialog" role="dialog">
	<div class="file-info">
		<span class="current-file" title={progress.currentFile}>{progress.currentFile}</span>
		<span class="size-info">{progressLabel}</span>
		{#if speedLabel}<span class="speed-info">{speedLabel}</span>{/if}
	</div>
	<div class="progress-bar-container">
		<div class="progress-bar-fill" style:width="{percentage}%"></div>
		<div class="progress-bar-text">{percentage}%</div>
	</div>
	<div class="footer">
		<div class="buttons">
			<Button backgroundColorVariable="--color-danger" colorVariable="--color-accent-fg" onclick={oncancel}>Cancel</Button>
		</div>
	</div>
</div>
