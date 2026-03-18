<script lang="ts">
	import type { WindowState } from '../../scripts/window.svelte';
	import { closeWindow, minimizeWindow, toggleMaximize, moveWindow, focus, snapPreview, getSnapZone, snapWindow } from '../../scripts/window.svelte';
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		win: WindowState;
		onmaximizeanimate: () => void;
	}
	const { win, onmaximizeanimate }: Props = $props();
	const focused = $derived(focus.id === win.id);
	let dragging = false;
	let hasDragged = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragWinStartX = 0;
	let dragWinStartY = 0;
	let dragStartedMaximized = false;

	function handleMaximize() {
		if (hasDragged) return;
		onmaximizeanimate();
		toggleMaximize(win.id);
	}

	function onPointerDown(e: PointerEvent) {
		if ((e.target as HTMLElement).closest('.window-controls')) return;
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartedMaximized = !!(win.maximized || win.preMaximize);
		dragWinStartX = win.x;
		dragWinStartY = win.y;
		hasDragged = false;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		hasDragged = true;
		if (dragStartedMaximized) {
			const prevW = win.preMaximize?.width ?? win.width;
			const prevH = win.preMaximize?.height ?? win.height;
			const relativeX = e.clientX / globalThis.innerWidth;
			win.x = e.clientX - prevW * relativeX;
			win.y = e.clientY - 16;
			win.width = prevW;
			win.height = prevH;
			win.maximized = false;
			win.preMaximize = null;
			dragStartedMaximized = false;
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			dragWinStartX = win.x;
			dragWinStartY = win.y;
		}
		moveWindow(win.id, dragWinStartX + e.clientX - dragStartX, dragWinStartY + e.clientY - dragStartY);
		snapPreview.zone = getSnapZone(e.clientX, e.clientY);
	}

	function onPointerUp() {
		if (dragging && snapPreview.zone) snapWindow(win.id, snapPreview.zone);
		dragging = false;
		dragStartedMaximized = false;
		snapPreview.zone = null;
	}
</script>

<style>
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

	.titlebar.focused {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.titlebar.maximized {
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

	.focused .title {
		color: #000;
		font-weight: bold;
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

	.focused .control {
		color: #000;
	}

	.focused .control:hover {
		background: rgba(0, 0, 0, 0.15);
	}

	.control.close:hover {
		background: #e53935;
		color: #fff;
	}

	.focused .control.close:hover {
		background: #e53935;
		color: #fff;
	}
</style>

<div class="titlebar" class:focused class:maximized={win.maximized} role="toolbar" tabindex="-1" onpointerdown={onPointerDown} onpointermove={onPointerMove} onpointerup={onPointerUp} ondblclick={handleMaximize}>
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
