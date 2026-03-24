<script lang="ts">
	import type { WindowState } from '../../scripts/window-store.svelte.ts';
	import { closeWindow, minimizeWindow, toggleMaximize, moveWindow, focus, snapPreview, snapWindow } from '../../scripts/window-store.svelte.ts';
	import { getSnapZone } from '../../scripts/window-snap.ts';
	import { pointerGestures } from '../../scripts/pointer-gestures.ts';
	import Icon from '../Icon/Icon.svelte';
	import WindowControl from './WindowControl.svelte';
	interface Props {
		win: WindowState;
	}
	const { win }: Props = $props();
	const focused = $derived(focus.id === win.id);
	let dragRefX = 0;
	let dragRefY = 0;
	let dragWinStartX = 0;
	let dragWinStartY = 0;
	let dragStartedMaximized = false;
	const DRAG_THRESHOLD = 5;
	const UNMAXIMIZE_Y_OFFSET = 16;

	function handlePress(e: PointerEvent): boolean | void {
		if ((e.target as HTMLElement).closest('.window-controls')) return false;
		e.preventDefault();
		dragStartedMaximized = !!(win.maximized || win.preMaximize);
		dragRefX = e.clientX;
		dragRefY = e.clientY;
		dragWinStartX = win.x;
		dragWinStartY = win.y;
	}

	function handleDragStart(e: PointerEvent): void {
		if (dragStartedMaximized) {
			const prevW = win.preMaximize?.width ?? win.width;
			const prevH = win.preMaximize?.height ?? win.height;
			const relativeX = e.clientX / globalThis.innerWidth;
			win.x = e.clientX - prevW * relativeX;
			win.y = e.clientY - UNMAXIMIZE_Y_OFFSET;
			win.width = prevW;
			win.height = prevH;
			win.maximized = false;
			win.preMaximize = null;
			dragStartedMaximized = false;
			dragRefX = e.clientX;
			dragRefY = e.clientY;
			dragWinStartX = win.x;
			dragWinStartY = win.y;
		}
	}

	function handleDragMove(e: PointerEvent): void {
		moveWindow(win.id, dragWinStartX + e.clientX - dragRefX, dragWinStartY + e.clientY - dragRefY);
		snapPreview.zone = getSnapZone(e.clientX, e.clientY);
	}

	function handleDragEnd(): void {
		if (snapPreview.zone) snapWindow(win.id, snapPreview.zone);
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
		color: var(--color-accent-fg);
		font-weight: bold;
	}

	.window-controls {
		display: flex;
		gap: 4px;
	}
</style>

<div class="titlebar" class:focused class:maximized={win.maximized} role="toolbar" tabindex="-1" use:pointerGestures={{ onpress: handlePress, ondblclick: () => toggleMaximize(win.id), ondragstart: handleDragStart, ondragmove: handleDragMove, ondragend: handleDragEnd, dragThreshold: DRAG_THRESHOLD }}>
	<div class="titlebar-left">
		<Icon img={win.icon} alt={win.title} size="16px" padding="0" colorVariable={focused ? '--color-accent-fg' : '--color-text'} />
		<span class="title">{win.title}</span>
	</div>
	<div class="window-controls">
		<WindowControl img="/img/window/minimize.svg" alt="Minimize" onclick={() => minimizeWindow(win.id)} {focused} />
		<WindowControl img={win.maximized ? '/img/window/restore.svg' : '/img/window/maximize.svg'} alt={win.maximized ? 'Restore' : 'Maximize'} onclick={() => toggleMaximize(win.id)} {focused} />
		<WindowControl img="/img/window/close.svg" alt="Close" onclick={() => closeWindow(win.id)} {focused} variant="close" />
	</div>
</div>
