<script lang="ts">
	import { windows, focusWindow, minimizeWindow, isTopWindow, focus, getWindow } from '../../scripts/window.svelte';
	import { desktop } from '../../scripts/desktop.svelte';
	import TaskbarItemsItem from './TaskbarItemsItem.svelte';
	import Icon from '../Icon/Icon.svelte';
	const { desktopId }: { desktopId?: number | undefined } = $props();
	const activeId = $derived(desktopId ?? desktop.active);
	const desktopWindows = $derived(windows.filter(w => w.desktopId === activeId));
	const DRAG_THRESHOLD = 4;
	const SCROLL_STEP = 150;
	let dragging = $state(false);
	let dragId = $state<string | null>(null);
	let dragStartX = 0;
	let dragTranslateX = $state(0);
	let pointerDown = false;
	let btnElements = new Map<string, HTMLElement>();
	let scrollContainer: HTMLElement | undefined = $state();
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function updateScrollState() {
		if (!scrollContainer) return;
		canScrollLeft = scrollContainer.scrollLeft > 0;
		canScrollRight = scrollContainer.scrollLeft + scrollContainer.clientWidth < scrollContainer.scrollWidth - 1;
	}

	function scrollBy(delta: number) {
		scrollContainer?.scrollTo({ left: scrollContainer.scrollLeft + delta, behavior: 'smooth' });
	}

	function scrollToFocused() {
		if (!focus.id) return;
		const el = btnElements.get(focus.id);
		if (el && scrollContainer) {
			const containerRect = scrollContainer.getBoundingClientRect();
			const elRect = el.getBoundingClientRect();
			if (elRect.left < containerRect.left) scrollContainer.scrollTo({ left: scrollContainer.scrollLeft + elRect.left - containerRect.left - 4, behavior: 'smooth' });
			else if (elRect.right > containerRect.right) scrollContainer.scrollTo({ left: scrollContainer.scrollLeft + elRect.right - containerRect.right + 4, behavior: 'smooth' });
		}
	}

	function observeOverflow(node: HTMLElement) {
		const ro = new ResizeObserver(() => updateScrollState());
		ro.observe(node);
		const mo = new MutationObserver(() => requestAnimationFrame(updateScrollState));
		mo.observe(node, { childList: true });
		return {
			destroy() {
				ro.disconnect();
				mo.disconnect();
			},
		};
	}

	function scrollOnFocusChange(_node: HTMLElement, _focusId: string | null) {
		return {
			update() {
				scrollToFocused();
			},
		};
	}

	function onWheel(e: WheelEvent) {
		if (!scrollContainer) return;
		if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) return;
		e.preventDefault();
		scrollContainer.scrollLeft += e.deltaY || e.deltaX;
		updateScrollState();
	}

	function trackBtn(node: HTMLElement, id: string) {
		btnElements.set(id, node);
		return {
			update(newId: string) {
				btnElements.delete(id);
				id = newId;
				btnElements.set(id, node);
			},
			destroy() {
				btnElements.delete(id);
			},
		};
	}

	function onWindowButtonClick(id: string, minimized: boolean) {
		if (!minimized && focus.id === id && isTopWindow(id)) minimizeWindow(id);
		else focusWindow(id);
	}

	function onPointerDown(e: PointerEvent, id: string) {
		pointerDown = true;
		dragId = id;
		dragStartX = e.clientX;
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointerDown || !dragId) return;
		const dx = e.clientX - dragStartX;
		if (!dragging && Math.abs(dx) < DRAG_THRESHOLD) return;
		if (!dragging) {
			dragging = true;
			const btn = btnElements.get(dragId);
			if (btn) btn.setPointerCapture(e.pointerId);
		}
		dragTranslateX = dx;
		const dragIdx = windows.findIndex(w => w.id === dragId);
		if (dragIdx === -1) return;
		for (const [id, el] of btnElements) {
			if (id === dragId) continue;
			const rect = el.getBoundingClientRect();
			const midX = rect.left + rect.width / 2;
			const targetIdx = windows.findIndex(w => w.id === id);
			if (targetIdx === -1) continue;
			if ((targetIdx > dragIdx && e.clientX > midX) || (targetIdx < dragIdx && e.clientX < midX)) {
				const item = windows.splice(dragIdx, 1)[0];
				if (!item) break;
				windows.splice(targetIdx, 0, item);
				dragStartX = e.clientX;
				dragTranslateX = 0;
				break;
			}
		}
	}

	function onPointerUp() {
		pointerDown = false;
		const wasDragging = dragging;
		dragging = false;
		dragTranslateX = 0;
		if (!wasDragging && dragId) {
			const win = getWindow(dragId);
			if (win) onWindowButtonClick(win.id, win.minimized);
		}
		dragId = null;
	}
</script>

<style>
	.taskbar-items {
		display: flex;
		align-items: center;
		flex: 1;
		overflow: hidden;
	}

	.scroll-btn {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: calc(var(--taskbar-height) - 12px);
		flex-shrink: 0;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.15s;
		z-index: 1;
	}

	.scroll-btn:hover {
		opacity: 1;
	}

	.window-buttons {
		--fade: 20px;
		display: flex;
		gap: 4px;
		overflow-x: auto;
		flex: 1;
		scrollbar-width: none;
	}

	.window-buttons:is(.fade-left, .fade-right) {
		--fl: 0px;
		--fr: 0px;
		-webkit-mask-image: linear-gradient(to right, transparent, black var(--fl), black calc(100% - var(--fr)), transparent);
		mask-image: linear-gradient(to right, transparent, black var(--fl), black calc(100% - var(--fr)), transparent);
	}

	.window-buttons.fade-left {
		--fl: var(--fade);
	}
	.window-buttons.fade-right {
		--fr: var(--fade);
	}

	.window-buttons::-webkit-scrollbar {
		display: none;
	}
</style>

<div class="taskbar-items">
	{#if canScrollLeft}
		<button type="button" class="scroll-btn" tabindex="-1" onclick={() => scrollBy(-SCROLL_STEP)}>
			<Icon img="/img/caret-left.svg" alt="Scroll left" size="12px" padding="0" colorVariable="--color-text" />
		</button>
	{/if}
	<div class="window-buttons" class:fade-left={canScrollLeft} class:fade-right={canScrollRight} bind:this={scrollContainer} use:observeOverflow use:scrollOnFocusChange={focus.id} onscroll={updateScrollState} onwheel={onWheel} onpointermove={onPointerMove} onpointerup={onPointerUp} role="tablist" tabindex="-1">
		{#each desktopWindows as win (win.id)}
			<div use:trackBtn={win.id}>
				<TaskbarItemsItem icon={win.icon} title={win.title} active={focus.id === win.id && !win.minimized} dragging={dragging && dragId === win.id} translateX={dragging && dragId === win.id ? dragTranslateX : 0} onpointerdown={e => onPointerDown(e, win.id)} />
			</div>
		{/each}
	</div>
	{#if canScrollRight}
		<button type="button" class="scroll-btn" tabindex="-1" onclick={() => scrollBy(SCROLL_STEP)}>
			<Icon img="/img/caret-right.svg" alt="Scroll right" size="12px" padding="0" colorVariable="--color-text" />
		</button>
	{/if}
</div>
