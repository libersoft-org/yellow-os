<script lang="ts">
	import { clamp, type CropRect } from './image-viewer.ts';
	import Button from '../../components/Button/Button.svelte';
	interface Props {
		cropRect: CropRect;
		zoom: number;
		imageWidth: number;
		imageHeight: number;
		onrectchange: (rect: CropRect) => void;
		onapply: () => void;
		oncancel: () => void;
	}
	const { cropRect, zoom, imageWidth, imageHeight, onrectchange, onapply, oncancel }: Props = $props();
	const zx = $derived(cropRect.x * zoom);
	const zy = $derived(cropRect.y * zoom);
	const zw = $derived(cropRect.w * zoom);
	const zh = $derived(cropRect.h * zoom);
	let dragging = $state(false);
	let dragType = $state('');
	let dragStart = $state({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });

	function getHandleType(e: PointerEvent): string {
		const el = e.target as HTMLElement;
		return el.dataset['cropHandle'] ?? '';
	}

	function handlePointerDown(e: PointerEvent): void {
		e.stopPropagation();
		const handle = getHandleType(e);
		if (!handle) return;
		dragging = true;
		dragType = handle;
		dragStart = { mx: e.clientX, my: e.clientY, ...cropRect };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent): void {
		if (!dragging) return;
		const dx = Math.round((e.clientX - dragStart.mx) / zoom);
		const dy = Math.round((e.clientY - dragStart.my) / zoom);
		const { x: sx, y: sy, w: sw, h: sh } = dragStart;
		let x = cropRect.x;
		let y = cropRect.y;
		let w = cropRect.w;
		let h = cropRect.h;
		switch (dragType) {
			case 'move':
				x = clamp(sx + dx, 0, imageWidth - sw);
				y = clamp(sy + dy, 0, imageHeight - sh);
				w = sw;
				h = sh;
				break;
			case 'nw':
				x = clamp(sx + dx, 0, sx + sw - 1);
				y = clamp(sy + dy, 0, sy + sh - 1);
				w = sx + sw - x;
				h = sy + sh - y;
				break;
			case 'ne':
				y = clamp(sy + dy, 0, sy + sh - 1);
				w = clamp(sw + dx, 1, imageWidth - sx);
				h = sy + sh - y;
				break;
			case 'sw':
				x = clamp(sx + dx, 0, sx + sw - 1);
				w = sx + sw - x;
				h = clamp(sh + dy, 1, imageHeight - sy);
				break;
			case 'se':
				w = clamp(sw + dx, 1, imageWidth - sx);
				h = clamp(sh + dy, 1, imageHeight - sy);
				break;
			case 'n':
				y = clamp(sy + dy, 0, sy + sh - 1);
				h = sy + sh - y;
				break;
			case 's':
				h = clamp(sh + dy, 1, imageHeight - sy);
				break;
			case 'w':
				x = clamp(sx + dx, 0, sx + sw - 1);
				w = sx + sw - x;
				break;
			case 'e':
				w = clamp(sw + dx, 1, imageWidth - sx);
				break;
		}
		onrectchange({ x, y, w, h });
	}

	function handlePointerUp(): void {
		dragging = false;
	}
</script>

<style>
	.crop-overlay {
		position: absolute;
		pointer-events: none;
		overflow: visible;
	}

	.crop-dim {
		fill: rgba(0, 0, 0, 0.55);
	}

	.crop-border {
		fill: none;
		stroke: white;
		stroke-width: 1.5;
		stroke-dasharray: 4 4;
	}

	.crop-handle {
		fill: white;
		stroke: #333;
		stroke-width: 1;
		pointer-events: all;
		cursor: pointer;
	}

	.crop-move-area {
		fill: transparent;
		pointer-events: all;
		cursor: move;
	}

	.crop-handle.nw,
	.crop-handle.se {
		cursor: nwse-resize;
	}
	.crop-handle.ne,
	.crop-handle.sw {
		cursor: nesw-resize;
	}
	.crop-handle.n,
	.crop-handle.s {
		cursor: ns-resize;
	}
	.crop-handle.e,
	.crop-handle.w {
		cursor: ew-resize;
	}

	.crop-buttons {
		pointer-events: all;
		display: flex;
		gap: 4px;
		justify-content: flex-end;
		padding: 4px;
	}

	.crop-buttons :global(.button) {
		padding: 8px;
	}
</style>

<svg class="crop-overlay" role="application" width={imageWidth * zoom} height={imageHeight * zoom} style:transform="translate(var(--pan-x, 0px), var(--pan-y, 0px))" onpointerdown={handlePointerDown} onpointermove={handlePointerMove} onpointerup={handlePointerUp}>
	<defs>
		<mask id="crop-mask">
			<rect width="100%" height="100%" fill="white" />
			<rect x={zx} y={zy} width={zw} height={zh} fill="black" />
		</mask>
	</defs>
	<rect width="100%" height="100%" class="crop-dim" mask="url(#crop-mask)" />
	<rect data-crop-handle="move" class="crop-move-area" x={zx} y={zy} width={zw} height={zh} />
	<rect class="crop-border" x={zx} y={zy} width={zw} height={zh} />
	<rect data-crop-handle="nw" class="crop-handle nw" x={zx - 6} y={zy - 6} width={12} height={12} />
	<rect data-crop-handle="ne" class="crop-handle ne" x={zx + zw - 6} y={zy - 6} width={12} height={12} />
	<rect data-crop-handle="sw" class="crop-handle sw" x={zx - 6} y={zy + zh - 6} width={12} height={12} />
	<rect data-crop-handle="se" class="crop-handle se" x={zx + zw - 6} y={zy + zh - 6} width={12} height={12} />
	<rect data-crop-handle="n" class="crop-handle n" x={zx + zw / 2 - 6} y={zy - 6} width={12} height={12} />
	<rect data-crop-handle="s" class="crop-handle s" x={zx + zw / 2 - 6} y={zy + zh - 6} width={12} height={12} />
	<rect data-crop-handle="w" class="crop-handle w" x={zx - 6} y={zy + zh / 2 - 6} width={12} height={12} />
	<rect data-crop-handle="e" class="crop-handle e" x={zx + zw - 6} y={zy + zh / 2 - 6} width={12} height={12} />
	<foreignObject x={zx + zw - 80} y={zy} width={80} height={40} style="overflow: visible">
		<div class="crop-buttons">
			<Button onclick={onapply} backgroundColorVariable="--color-success" colorVariable="--color-accent-fg"><img src="/img/check.svg" alt="Apply" width="16" height="16" /></Button>
			<Button onclick={oncancel} backgroundColorVariable="--color-danger" colorVariable="--color-accent-fg"><img src="/img/cross.svg" alt="Cancel" width="16" height="16" /></Button>
		</div>
	</foreignObject>
</svg>
