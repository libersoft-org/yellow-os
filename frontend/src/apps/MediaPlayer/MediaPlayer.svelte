<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { focusWindow } from '../../scripts/window/window-store.svelte.ts';
	import { readFileBlob } from '../../scripts/fs/opfs.ts';
	import { formatBytes } from '../../scripts/system/format.ts';
	import { registerDropZone } from '../../scripts/ui/drag-state.svelte.ts';
	import Statusbar from '../../components/Statusbar/Statusbar.svelte';
	import StatusbarItem from '../../components/Statusbar/StatusbarItem.svelte';
	import Icon from '../../components/Icon/Icon.svelte';
	import { isMediaFile, getMediaType } from './media-player.ts';
	interface Props {
		filePath?: string;
		fileName?: string;
	}
	const { filePath: initDir, fileName: initName }: Props = $props();
	const win = getWindow();
	win.title = 'Media Player';
	win.icon = '/img/apps/media-player.svg';
	win.width = 640;
	win.height = 480;
	win.position = 'center';

	let currentName = $state('');
	let mediaSrc = $state('');
	let mediaType = $state<'audio' | 'video'>('audio');
	let fileSize = $state(0);
	let dragging = $state(false);

	const sizeLabel = $derived(fileSize > 0 ? formatBytes(fileSize) : '');

	async function loadMedia(dir: string, name: string): Promise<void> {
		if (mediaSrc) URL.revokeObjectURL(mediaSrc);
		mediaSrc = '';
		fileSize = 0;
		currentName = name;
		mediaType = getMediaType(name);
		win.title = 'Media Player - ' + name;
		try {
			const blob = await readFileBlob(dir, name);
			fileSize = blob.size;
			mediaSrc = URL.createObjectURL(blob);
		} catch {
			mediaSrc = '';
		}
	}

	function handleDragOver(e: DragEvent): void {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave(): void {
		dragging = false;
	}

	function handleDrop(e: DragEvent): void {
		e.preventDefault();
		dragging = false;
	}

	function handleOPFSDrop(sourcePath: string, fileNames: string[]): void {
		if (fileNames.length !== 1) return;
		const name = fileNames[0]!;
		if (!isMediaFile(name)) return;
		focusWindow(win.id);
		loadMedia(sourcePath, name);
	}

	function mediaPlayerDropZone(el: HTMLElement): { destroy(): void } {
		return { destroy: registerDropZone(el, handleOPFSDrop) };
	}

	function handleVideoLoaded(e: Event): void {
		if (mediaType !== 'video') return;
		const video = e.currentTarget as HTMLVideoElement;
		const vw = video.videoWidth;
		const vh = video.videoHeight;
		if (vw > 0 && vh > 0) {
			const menuHeight = 80;
			win.width = Math.max(vw, win.minWidth ?? 320);
			win.height = Math.max(vh + menuHeight, win.minHeight ?? 240);
		}
	}

	function init(): void {
		if (initDir && initName) {
			loadMedia(initDir, initName);
		}
	}
	init();

	onDestroy(() => {
		if (mediaSrc) URL.revokeObjectURL(mediaSrc);
	});
</script>

<style>
	.media-player {
		display: flex;
		flex-direction: column;
		height: 100%;
		outline: none;
	}

	.content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: var(--color-surface-1);
	}

	video {
		max-width: 100%;
		max-height: 100%;
		outline: none;
	}

	audio {
		width: 80%;
		max-width: 500px;
		outline: none;
	}

	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: calc(100% - 32px);
		height: calc(100% - 32px);
		gap: 12px;
		color: var(--color-text);
		user-select: none;
		cursor: default;
		border: 2px dashed var(--color-border);
		border-radius: 12px;
		margin: 16px;
		box-sizing: border-box;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}

	.drop-zone.dragging {
		border-color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
	}

	.hint {
		font-size: 0.85em;
		opacity: 0.6;
		text-align: center;
		line-height: 1.5;
	}
</style>

<div class="media-player" role="application">
	<div class="content">
		{#if mediaSrc}
			{#if mediaType === 'video'}
				<video src={mediaSrc} controls autoplay onloadedmetadata={handleVideoLoaded}><track kind="captions" /></video>
			{:else}
				<audio src={mediaSrc} controls autoplay></audio>
			{/if}
		{:else}
			<div class="drop-zone" class:dragging role="button" tabindex="0" ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop} use:mediaPlayerDropZone>
				<Icon img="/img/apps/media-player.svg" size="48px" padding="0" colorVariable="--color-text" />
				<p>Open an audio or video file</p>
				<p class="hint">Double-click in File Browser<br />or drag & drop it here</p>
			</div>
		{/if}
	</div>
	<Statusbar>
		{#snippet left()}
			<StatusbarItem>{currentName || 'No file'}</StatusbarItem>
		{/snippet}
		{#snippet right()}
			{#if sizeLabel}<StatusbarItem>{sizeLabel}</StatusbarItem>{/if}
		{/snippet}
	</Statusbar>
</div>
