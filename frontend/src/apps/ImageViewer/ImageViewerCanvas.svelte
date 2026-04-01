<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import CropOverlay from './CropOverlay.svelte';
	import type { CropRect } from './image-viewer.ts';
	interface Props {
		imageSrc: string;
		imageWidth: number;
		imageHeight: number;
		displayWidth: number;
		displayHeight: number;
		zoom: number;
		zoomMode: 'fit' | 'actual' | 'custom';
		rotation: number;
		flipH: boolean;
		flipV: boolean;
		panX: number;
		panY: number;
		cropping: boolean;
		cropRect: CropRect;
		currentName: string;
		onzoomchange: (zoom: number, mode: 'fit' | 'actual' | 'custom') => void;
		onpanchange: (x: number, y: number) => void;
		onrectchange: (rect: CropRect) => void;
		onfitrequest: () => void;
	}
	const { imageSrc, imageWidth, imageHeight, displayWidth, displayHeight, zoom, zoomMode, rotation, flipH, flipV, panX, panY, cropping, cropRect, currentName, onzoomchange, onpanchange, onrectchange, onfitrequest }: Props = $props();
	let containerEl = $state<HTMLDivElement>();
	let panning = $state(false);
	let panStart = $state({ x: 0, y: 0, panX: 0, panY: 0 });
	let resizeObserver: ResizeObserver | null = null;

	export function getContainer(): HTMLDivElement | undefined {
		return containerEl;
	}

	function handleWheel(e: WheelEvent): void {
		e.preventDefault();
		if (!containerEl) return;
		const factor = 1 + Math.min(Math.abs(e.deltaY) / 300, 0.3);
		const newZoom = e.deltaY < 0 ? Math.min(zoom * factor, 20) : Math.max(zoom / factor, 0.05);
		const rect = containerEl.getBoundingClientRect();
		const cx = e.clientX - rect.left - rect.width / 2;
		const cy = e.clientY - rect.top - rect.height / 2;
		const scale = newZoom / zoom;
		const newPanX = cx - scale * (cx - panX);
		const newPanY = cy - scale * (cy - panY);
		onpanchange(newPanX, newPanY);
		onzoomchange(newZoom, 'custom');
	}

	function handlePointerDown(e: PointerEvent): void {
		if (cropping || e.button !== 0) return;
		panning = true;
		panStart = { x: e.clientX, y: e.clientY, panX, panY };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent): void {
		if (!panning) return;
		onpanchange(panStart.panX + (e.clientX - panStart.x), panStart.panY + (e.clientY - panStart.y));
	}

	function handlePointerUp(): void {
		panning = false;
	}

	function imageTransform(): string {
		const parts: string[] = [];
		parts.push(`translate(${panX}px, ${panY}px)`);
		parts.push(`scale(${zoom})`);
		if (rotation !== 0) parts.push(`rotate(${rotation}deg)`);
		if (flipH) parts.push('scaleX(-1)');
		if (flipV) parts.push('scaleY(-1)');
		return parts.join(' ');
	}

	onMount(() => {
		if (containerEl) {
			resizeObserver = new ResizeObserver(() => {
				if (zoomMode === 'fit') onfitrequest();
			});
			resizeObserver.observe(containerEl);
		}
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
	});
</script>

<style>
	.canvas-area {
		flex: 1;
		overflow: hidden;
		background: #1a1a1a;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		position: relative;
	}

	.canvas-area.panning {
		cursor: grabbing;
	}

	.canvas-area.cropping {
		cursor: default;
	}

	.checker {
		position: absolute;
		background-image: linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
		background-size: 16px 16px;
		background-position:
			0 0,
			0 8px,
			8px -8px,
			-8px 0;
	}

	.main-image {
		display: block;
		max-width: none;
		max-height: none;
		image-rendering: auto;
		pointer-events: none;
		position: absolute;
	}
</style>

<div class="canvas-area" class:panning class:cropping bind:this={containerEl} onwheel={handleWheel} onpointerdown={handlePointerDown} onpointermove={handlePointerMove} onpointerup={handlePointerUp} role="img">
	{#if imageSrc}
		<div class="checker" style:width="{displayWidth * zoom}px" style:height="{displayHeight * zoom}px" style:transform="translate({panX}px, {panY}px)"></div>
		<img class="main-image" src={imageSrc} alt={currentName} style:width="{imageWidth}px" style:height="{imageHeight}px" style:transform={imageTransform()} />
		{#if cropping}
			<CropOverlay {cropRect} {zoom} {imageWidth} {imageHeight} {onrectchange} --pan-x="{panX}px" --pan-y="{panY}px" />
		{/if}
	{/if}
</div>
