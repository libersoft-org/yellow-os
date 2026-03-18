<script lang="ts">
	import { windows, focusWindow, minimizeWindow, isTopWindow, focus } from '../../scripts/window.svelte';
	import TaskbarItemsItem from './TaskbarItemsItem.svelte';
	const DRAG_THRESHOLD = 4;
	let dragging = $state(false);
	let dragId = $state<string | null>(null);
	let dragStartX = 0;
	let dragTranslateX = $state(0);
	let pointerDown = false;
	let btnElements = new Map<string, HTMLElement>();

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
		if (minimized) focusWindow(id);
		else if (focus.id === id && isTopWindow(id)) minimizeWindow(id);
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

			if (targetIdx > dragIdx && e.clientX > midX) {
				const item = windows.splice(dragIdx, 1)[0];
				if (!item) break;
				windows.splice(targetIdx, 0, item);
				dragStartX = e.clientX;
				dragTranslateX = 0;
				break;
			} else if (targetIdx < dragIdx && e.clientX < midX) {
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
			const win = windows.find(w => w.id === dragId);
			if (win) onWindowButtonClick(win.id, win.minimized);
		}
		dragId = null;
	}
</script>

<style>
	.window-buttons {
		display: flex;
		gap: 4px;
		overflow: hidden;
		flex: 1;
	}
</style>

<div class="window-buttons" onpointermove={onPointerMove} onpointerup={onPointerUp} role="tablist" tabindex="-1">
	{#each windows as win (win.id)}
		<div use:trackBtn={win.id}>
			<TaskbarItemsItem icon={win.icon} title={win.title} active={focus.id === win.id && !win.minimized} dragging={dragging && dragId === win.id} translateX={dragging && dragId === win.id ? dragTranslateX : 0} onpointerdown={e => onPointerDown(e, win.id)} />
		</div>
	{/each}
</div>
