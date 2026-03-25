<script lang="ts">
	import type { WindowState } from '../../scripts/window-store.svelte.ts';
	import { closeWindow, minimizeWindow, toggleMaximize, restoreWindow, moveWindow, focus, snapPreview, snapWindow, triggerSnapAnimation } from '../../scripts/window-store.svelte.ts';
	import { getSnapZone } from '../../scripts/window-snap.ts';
	import { pointerGestures } from '../../scripts/pointer-gestures.ts';
	import Icon from '../Icon/Icon.svelte';
	import WindowControl from './WindowControl.svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
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
	let iconMenu = $state<{ x: number; y: number } | null>(null);
	let iconOpenTime = 0;
	const DBLCLICK_THRESHOLD = 400;

	function handleIconPointerDown(e: PointerEvent): void {
		e.preventDefault();
		e.stopPropagation();
		if (e.button === 2) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		iconMenu = { x: rect.left, y: rect.bottom };
		iconOpenTime = Date.now();
	}

	function handleIconContextMenu(e: MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		iconMenu = { x: rect.left, y: rect.bottom };
		iconOpenTime = 0;
	}

	function closeIconMenu(): void {
		const wasQuick = iconOpenTime > 0 && Date.now() - iconOpenTime < DBLCLICK_THRESHOLD;
		iconMenu = null;
		iconOpenTime = 0;
		if (wasQuick) closeWindow(win.id);
	}

	function resetAndRestore(): void {
		iconOpenTime = 0;
		restoreWindow(win.id);
	}

	function resetAndToggleMaximize(): void {
		iconOpenTime = 0;
		toggleMaximize(win.id);
	}

	function resetAndMinimize(): void {
		iconOpenTime = 0;
		minimizeWindow(win.id);
	}

	function resetAndClose(): void {
		iconOpenTime = 0;
		closeWindow(win.id);
	}

	function getIconMenuItems(): { icon: string; label: string; onclick: () => void }[] {
		const items: { icon: string; label: string; onclick: () => void }[] = [];
		if (win.minimized) {
			items.push({ icon: '/img/window/restore.svg', label: 'Restore', onclick: resetAndRestore });
		} else if (win.maximized) {
			items.push({ icon: '/img/window/restore.svg', label: 'Restore', onclick: resetAndToggleMaximize });
			if (win.canMinimize) items.push({ icon: '/img/window/minimize.svg', label: 'Minimize', onclick: resetAndMinimize });
		} else {
			if (win.canMaximize) items.push({ icon: '/img/window/maximize.svg', label: 'Maximize', onclick: resetAndToggleMaximize });
			if (win.canMinimize) items.push({ icon: '/img/window/minimize.svg', label: 'Minimize', onclick: resetAndMinimize });
		}
		items.push({ icon: '/img/window/close.svg', label: 'Close', onclick: resetAndClose });
		return items;
	}

	function handleTitlebarContextMenu(e: MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();
		iconMenu = { x: e.clientX, y: e.clientY };
		iconOpenTime = 0;
	}

	function handlePress(e: PointerEvent): boolean | void {
		if ((e.target as HTMLElement).closest('.window-controls, .titlebar-icon')) return false;
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
			triggerSnapAnimation(win.id);
			win.x = e.clientX - prevW * relativeX;
			win.y = e.clientY - UNMAXIMIZE_Y_OFFSET;
			win.width = prevW;
			win.height = prevH;
			win.maximized = false;
			win.preMaximize = null;
			win.snappedZone = null;
			dragStartedMaximized = false;
			dragRefX = e.clientX;
			dragRefY = e.clientY;
			dragWinStartX = win.x;
			dragWinStartY = win.y;
		}
	}

	function handleDragMove(e: PointerEvent): void {
		moveWindow(win.id, dragWinStartX + e.clientX - dragRefX, dragWinStartY + e.clientY - dragRefY);
		snapPreview.zone = win.canMaximize ? getSnapZone(e.clientX, e.clientY) : null;
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
		padding: 0;
		background: var(--color-surface-2);
		cursor: grab;
		flex-shrink: 0;
		border-radius: var(--border-radius) var(--border-radius) 0 0;
		transition: background 0.15s;
		border: 1px solid var(--color-border);
		border-bottom: none;
		overflow: hidden;
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
		overflow: hidden;
	}

	.titlebar-icon {
		pointer-events: auto;
		cursor: pointer;
		flex-shrink: 0;
		padding: 10px;
	}

	.title {
		font-size: 13px;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: none;
	}

	.focused .title {
		color: var(--color-accent-fg);
		font-weight: bold;
	}

	.window-controls {
		display: flex;
	}
</style>

<div class="titlebar" class:focused class:maximized={win.maximized} role="toolbar" tabindex="-1" oncontextmenu={handleTitlebarContextMenu} use:pointerGestures={{ onpress: handlePress, ondblclick: () => win.canMaximize && toggleMaximize(win.id), ondragstart: handleDragStart, ondragmove: handleDragMove, ondragend: handleDragEnd, dragThreshold: DRAG_THRESHOLD }}>
	<div class="titlebar-left">
		<div class="titlebar-icon" role="button" tabindex="-1" onpointerdown={handleIconPointerDown} oncontextmenu={handleIconContextMenu}>
			<Icon img={win.icon} alt={win.title} size="16px" padding="0" colorVariable={focused ? '--color-accent-fg' : '--color-text'} />
		</div>
		<span class="title">{win.title}</span>
	</div>
	<div class="window-controls">
		{#if win.canMinimize}
			<WindowControl img="/img/window/minimize.svg" alt="Minimize" onclick={() => minimizeWindow(win.id)} {focused} />
		{/if}
		{#if win.canMaximize}
			<WindowControl img={win.maximized ? '/img/window/restore.svg' : '/img/window/maximize.svg'} alt={win.maximized ? 'Restore' : 'Maximize'} onclick={() => toggleMaximize(win.id)} {focused} />
		{/if}
		<WindowControl img="/img/window/close.svg" alt="Close" onclick={() => closeWindow(win.id)} {focused} variant="close" />
	</div>
</div>
{#if iconMenu}
	<ContextMenu items={getIconMenuItems()} x={iconMenu.x} y={iconMenu.y} onclose={closeIconMenu} />
{/if}
