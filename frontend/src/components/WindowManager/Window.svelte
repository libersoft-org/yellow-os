<script lang="ts">
	import type { WindowState } from '../../scripts/window.svelte';
	import { focusWindow, finishMinimize, finishClose, finishSnapAnimation, focus, snapAnimatingIds, RESIZE_DIRS, getHandleStyle, createResizeHandler } from '../../scripts/window.svelte';
	import WindowTitlebar from './WindowTitlebar.svelte';

	interface Props {
		win: WindowState;
	}

	const { win }: Props = $props();
	const WindowContent = $derived(win.component);
	const focused = $derived(focus.id === win.id);
	const snapAnimating = $derived(!!snapAnimatingIds[win.id]);
	const winId = $derived(win.id);
	const resize = createResizeHandler(() => winId);

	function onWindowPointerDown() {
		focusWindow(win.id);
	}

	function onWindowTransitionEnd(e: TransitionEvent) {
		if (e.propertyName === 'transform' && win.minimizing) finishMinimize(win.id);
		if (e.propertyName === 'transform' && win.closing) finishClose(win.id);
		if (e.propertyName === 'width' && snapAnimating) finishSnapAnimation(win.id);
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

	.window.opening {
		transform: scale(0.85);
		opacity: 0;
	}

	.window.closing {
		transform: scale(0.85);
		opacity: 0;
		pointer-events: none;
	}

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

	.window.snap-animating {
		transition:
			box-shadow 0.15s,
			transform 0.2s ease,
			opacity 0.2s ease,
			left 0.2s ease,
			top 0.2s ease,
			width 0.2s ease,
			height 0.2s ease,
			border-radius 0.2s ease;
	}

	.content {
		flex: 1;
		overflow: auto;
		padding: 16px;
		border: 1px solid var(--color-border);
		border-top: none;
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}

	.maximized .content {
		border-radius: 0;
	}
</style>

<div class="window" role="application" class:focused class:maximized={win.maximized} class:minimized={win.minimized} class:minimizing={win.minimizing} class:opening={win.opening} class:closing={win.closing} class:snap-animating={snapAnimating} class:restoring={win.restoring} style:left="{win.x}px" style:top="{win.y}px" style:width="{win.width}px" style:height="{win.height}px" style:z-index={win.zIndex} onpointerdown={onWindowPointerDown} ontransitionend={onWindowTransitionEnd}>
	<WindowTitlebar {win} />
	<div class="content">
		<WindowContent />
	</div>
	{#if !win.maximized}
		{#each RESIZE_DIRS as dir}
			<div role="separator" style={getHandleStyle(dir)} onpointerdown={e => resize.start(e, dir)} onpointermove={resize.move} onpointerup={resize.up}></div>
		{/each}
	{/if}
</div>
