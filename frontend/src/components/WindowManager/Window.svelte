<script lang="ts">
	import type { WindowState } from '../../scripts/window.svelte';
	import { focusWindow, closeWindow, minimizeWindow, toggleMaximize, moveWindow, resizeWindow, focus } from '../../scripts/window.svelte';
	import Icon from '../Icon/Icon.svelte';

	interface Props {
		win: WindowState;
	}

	const { win }: Props = $props();
	const RESIZE_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
	type ResizeDir = (typeof RESIZE_DIRS)[number];
	const WindowContent = $derived(win.component);
	const focused = $derived(focus.id === win.id);
	let maximizeAnimating = $state(false);
	// --- Drag state ---
	let dragging = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragWinStartX = 0;
	let dragWinStartY = 0;
	// --- Resize state ---
	let resizing = $state(false);
	let resizeDir: ResizeDir = 'se';
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeWinStartX = 0;
	let resizeWinStartY = 0;
	let resizeWinStartW = 0;
	let resizeWinStartH = 0;

	function handleMaximize() {
		maximizeAnimating = true;
		toggleMaximize(win.id);
		setTimeout(() => (maximizeAnimating = false), 250);
	}

	// --- Window focus ---
	function onWindowPointerDown() {
		focusWindow(win.id);
	}

	// --- Titlebar drag ---
	function onTitlebarPointerDown(e: PointerEvent) {
		if (win.maximized) return;
		if ((e.target as HTMLElement).closest('.window-controls')) return;
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragWinStartX = win.x;
		dragWinStartY = win.y;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}

	function onTitlebarPointerMove(e: PointerEvent) {
		if (!dragging) return;
		moveWindow(win.id, dragWinStartX + e.clientX - dragStartX, dragWinStartY + e.clientY - dragStartY);
	}

	function onTitlebarPointerUp() {
		dragging = false;
	}

	// --- Resize ---
	function startResize(e: PointerEvent, dir: ResizeDir) {
		if (win.maximized) return;
		resizing = true;
		resizeDir = dir;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizeWinStartX = win.x;
		resizeWinStartY = win.y;
		resizeWinStartW = win.width;
		resizeWinStartH = win.height;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
		focusWindow(win.id);
	}

	function onResizeMove(e: PointerEvent) {
		if (!resizing) return;
		const dx = e.clientX - resizeStartX;
		const dy = e.clientY - resizeStartY;
		let x = resizeWinStartX;
		let y = resizeWinStartY;
		let w = resizeWinStartW;
		let h = resizeWinStartH;
		if (resizeDir.includes('e')) w += dx;
		if (resizeDir.includes('w')) {
			w -= dx;
			x += dx;
		}
		if (resizeDir.includes('s')) h += dy;
		if (resizeDir.includes('n')) {
			h -= dy;
			y += dy;
		}
		// Clamp to min size, preserving opposite edge
		if (w < win.minWidth) {
			if (resizeDir.includes('w')) x -= win.minWidth - w;
			w = win.minWidth;
		}
		if (h < win.minHeight) {
			if (resizeDir.includes('n')) y -= win.minHeight - h;
			h = win.minHeight;
		}
		resizeWindow(win.id, w, h, x, y);
	}

	function onResizeUp() {
		resizing = false;
	}
</script>

<style>
	.window {
		position: absolute;
		display: flex;
		flex-direction: column;
		border-radius: var(--border-radius);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
		background: var(--color-surface);
		transition:
			box-shadow 0.15s,
			transform 0.2s ease,
			opacity 0.2s ease;
		transform-origin: center bottom;
	}

	.window.focused {
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
	}

	.window.minimizing {
		transform: scale(0.8) translateY(40px);
		opacity: 0;
		pointer-events: none;
	}

	.window.minimized {
		transform: scale(0.8) translateY(40px);
		opacity: 0;
		pointer-events: none;
		visibility: hidden;
	}

	.window.restoring {
		transform: scale(0.8) translateY(40px);
		opacity: 0;
		visibility: visible;
	}

	.window.max-animating,
	.window.maximized {
		border-radius: 0;
		transition:
			box-shadow 0.15s,
			transform 0.2s ease,
			opacity 0.2s ease,
			left 0.2s ease,
			top 0.2s ease,
			width 0.2s ease,
			height 0.2s ease;
	}

	.window.max-animating:not(.maximized) {
		border-radius: var(--border-radius);
	}

	.titlebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--titlebar-height);
		padding: 0 8px 0 14px;
		background: var(--color-surface-2);
		cursor: grab;
		flex-shrink: 0;
		border-radius: var(--border-radius) var(--border-radius) 0 0;
		transition: background 0.15s;
		border: 1px solid var(--color-border);
		border-bottom: none;
	}

	.focused .titlebar {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.focused .title {
		color: #000;
		font-weight: bold;
	}

	.focused .control {
		color: #000;
	}

	.focused .control:hover {
		background: rgba(0, 0, 0, 0.15);
	}

	.focused .control.close:hover {
		background: #e53935;
		color: #fff;
	}

	.maximized .titlebar {
		border-radius: 0;
	}

	.titlebar:active {
		cursor: grabbing;
	}

	.titlebar-left {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow: hidden;
		pointer-events: none;
	}

	.title {
		font-size: 13px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.window-controls {
		display: flex;
		gap: 4px;
	}

	.control {
		width: 26px;
		height: 22px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--color-text);
		font-size: 13px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.control.close:hover {
		background: #e53935;
		color: #fff;
	}

	.content {
		flex: 1;
		overflow: auto;
		padding: 16px;
		border: 1px solid var(--color-border);
		border-top: none;
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}

	/* Resize handles */
	.resize-handle {
		position: absolute;
		z-index: 10;
	}

	.resize-n {
		top: -4px;
		left: 10px;
		right: 10px;
		height: 8px;
		cursor: n-resize;
	}
	.resize-s {
		bottom: -4px;
		left: 10px;
		right: 10px;
		height: 8px;
		cursor: s-resize;
	}
	.resize-e {
		top: 10px;
		bottom: 10px;
		right: -4px;
		width: 8px;
		cursor: e-resize;
	}
	.resize-w {
		top: 10px;
		bottom: 10px;
		left: -4px;
		width: 8px;
		cursor: w-resize;
	}
	.resize-ne {
		top: -4px;
		right: -4px;
		width: 14px;
		height: 14px;
		cursor: ne-resize;
	}
	.resize-nw {
		top: -4px;
		left: -4px;
		width: 14px;
		height: 14px;
		cursor: nw-resize;
	}
	.resize-se {
		bottom: -4px;
		right: -4px;
		width: 14px;
		height: 14px;
		cursor: se-resize;
	}
	.resize-sw {
		bottom: -4px;
		left: -4px;
		width: 14px;
		height: 14px;
		cursor: sw-resize;
	}
</style>

<div class="window" role="application" class:focused class:maximized={win.maximized} class:minimized={win.minimized} class:minimizing={win.minimizing} class:max-animating={maximizeAnimating} class:restoring={win.restoring} style:left="{win.x}px" style:top="{win.y}px" style:width="{win.width}px" style:height="{win.height}px" style:z-index={win.zIndex} onpointerdown={onWindowPointerDown}>
	<!-- Titlebar -->
	<div class="titlebar" role="toolbar" tabindex="-1" onpointerdown={onTitlebarPointerDown} onpointermove={onTitlebarPointerMove} onpointerup={onTitlebarPointerUp} ondblclick={handleMaximize}>
		<div class="titlebar-left">
			<Icon img={win.icon} alt={win.title} size="16px" padding="0" colorVariable={focused ? undefined : '--color-text'} noColorFilter={focused} />
			<span class="title">{win.title}</span>
		</div>
		<div class="window-controls">
			<button class="control minimize" onclick={() => minimizeWindow(win.id)}>
				<Icon img="/img/window/minimize.svg" alt="Minimize" size="14px" padding="0" colorVariable={focused ? undefined : '--color-text'} noColorFilter={focused} />
			</button>
			<button class="control maximize" onclick={() => handleMaximize()}>
				<Icon img={win.maximized ? '/img/window/restore.svg' : '/img/window/maximize.svg'} alt={win.maximized ? 'Restore' : 'Maximize'} size="14px" padding="0" colorVariable={focused ? undefined : '--color-text'} noColorFilter={focused} />
			</button>
			<button class="control close" onclick={() => closeWindow(win.id)}>
				<Icon img="/img/window/close.svg" alt="Close" size="14px" padding="0" colorVariable={focused ? undefined : '--color-text'} noColorFilter={focused} />
			</button>
		</div>
	</div>
	<!-- Content -->
	<div class="content">
		<WindowContent />
	</div>
	<!-- Resize handles -->
	{#if !win.maximized}
		{#each RESIZE_DIRS as dir}
			<div class="resize-handle resize-{dir}" role="separator" onpointerdown={e => startResize(e, dir)} onpointermove={onResizeMove} onpointerup={onResizeUp}></div>
		{/each}
	{/if}
</div>
