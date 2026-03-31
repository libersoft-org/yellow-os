<script lang="ts">
	import { formatBytes } from '../../scripts/system/format.ts';
	import { getProgress } from '../../scripts/fs/file-progress.svelte.ts';
	import Button from '../../components/Button/Button.svelte';
	import ProgressBar from '../../components/ProgressBar/ProgressBar.svelte';

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
	<ProgressBar {percentage} animated />
	<div class="footer">
		<div class="buttons">
			<Button backgroundColorVariable="--color-danger" colorVariable="--color-accent-fg" onclick={oncancel}>Cancel</Button>
		</div>
	</div>
</div>
