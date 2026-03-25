<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconGridItemData } from './icon-grid.ts';
	import { createSelection } from '../../scripts/selection.svelte';
	import { pointerGestures } from '../../scripts/pointer-gestures.ts';
	import IconGridItem from './IconGridItem.svelte';
	interface Props {
		items: IconGridItemData[];
		cellWidth?: number;
		cellHeight?: number;
		iconSize?: string;
		onclick?: (item: IconGridItemData) => void;
		ondblclick?: (item: IconGridItemData) => void;
		onitemsmove?: (moves: { id: string; gridX: number; gridY: number }[]) => void;
		empty?: Snippet;
	}
	let { items, cellWidth = 90, cellHeight = 90, iconSize = '40px', onclick, ondblclick, onitemsmove, empty }: Props = $props();
	const selection = createSelection();
	let containerEl: HTMLElement | undefined = $state();
	let containerWidth = $state(0);
	const itemSignature = $derived(items.map(i => i.id).join('\0'));
	let _overrides = $state({ sig: '', map: new Map<string, { gridX: number; gridY: number }>() });
	let _selSig = $state('');
	const positionOverrides = $derived(_overrides.sig === itemSignature ? _overrides.map : new Map<string, { gridX: number; gridY: number }>());

	function isItemSelected(id: string): boolean {
		return _selSig === itemSignature && selection.isSelected(id);
	}

	function resetIfItemsChanged(): void {
		if (_selSig !== itemSignature) {
			_selSig = itemSignature;
			_overrides = { sig: itemSignature, map: new Map() };
			selection.clear();
		}
	}

	const cols = $derived(Math.max(1, Math.floor((containerWidth || 400) / cellWidth)));

	function getPosition(item: IconGridItemData, index: number): { gridX: number; gridY: number } {
		const override = positionOverrides.get(item.id);
		if (override) return override;
		if (item.gridX != null && item.gridY != null) return { gridX: item.gridX, gridY: item.gridY };
		return { gridX: index % cols, gridY: Math.floor(index / cols) };
	}

	const itemPositions = $derived(new Map(items.map((item, i) => [item.id, getPosition(item, i)])));

	const contentHeight = $derived.by(() => {
		let maxRow = 0;
		for (const pos of itemPositions.values()) maxRow = Math.max(maxRow, pos.gridY);
		return (maxRow + 1) * cellHeight;
	});

	// Drag state
	type DragMode = 'none' | 'select' | 'move';
	let dragMode = $state<DragMode>('none');
	let pressedOnItem = false;
	let dragSelectStart = $state({ x: 0, y: 0 });
	let dragSelectEnd = $state({ x: 0, y: 0 });
	let dragPreSelected = new Set<string>();
	let dragMoveItemId = $state<string | null>(null);
	let dragMoveOffset = $state({ x: 0, y: 0 });
	let dragGhostPos = $state({ x: 0, y: 0 });
	let pendingDeselect = $state<string | null>(null);
	let lastClickedItemId = $state<string | null>(null);
	let lastTapTime = 0;
	let lastTapItemId: string | null = null;
	const DOUBLE_TAP_MS = 300;

	function observeResize(node: HTMLElement): { destroy(): void } {
		containerWidth = node.clientWidth;
		const ro = new ResizeObserver(entries => {
			containerWidth = entries[0]!.contentRect.width;
		});
		ro.observe(node);
		return { destroy: () => ro.disconnect() };
	}

	function getContainerCoords(e: PointerEvent): { x: number; y: number } {
		const rect = containerEl!.getBoundingClientRect();
		return {
			x: e.clientX - rect.left + (containerEl!.scrollLeft || 0),
			y: e.clientY - rect.top + (containerEl!.scrollTop || 0),
		};
	}

	function handlePress(e: PointerEvent): boolean | void {
		resetIfItemsChanged();
		e.preventDefault();
		pendingDeselect = null;

		const cell = (e.target as HTMLElement).closest('[data-icon-id]') as HTMLElement | null;
		if (cell) {
			const id = cell.dataset['iconId']!;
			lastClickedItemId = id;

			if (selection.isSelected(id)) {
				if (e.ctrlKey || e.metaKey) {
					const idx = items.findIndex(i => i.id === id);
					selection.select(
						id,
						idx,
						items.map(i => i.id),
						e
					);
					return false;
				}
				pendingDeselect = id;
			} else {
				const idx = items.findIndex(i => i.id === id);
				selection.select(
					id,
					idx,
					items.map(i => i.id),
					e
				);
			}

			pressedOnItem = true;
			dragMoveItemId = id;
			const pos = itemPositions.get(id)!;
			const coords = getContainerCoords(e);
			dragMoveOffset = {
				x: coords.x - pos.gridX * cellWidth,
				y: coords.y - pos.gridY * cellHeight,
			};
			dragGhostPos = { x: pos.gridX * cellWidth, y: pos.gridY * cellHeight };
		} else {
			lastClickedItemId = null;
			if (!(e.ctrlKey || e.metaKey)) selection.clear();
			pressedOnItem = false;
			const coords = getContainerCoords(e);
			dragSelectStart = coords;
			dragSelectEnd = coords;
			dragPreSelected = e.ctrlKey || e.metaKey ? new Set(selection.selected) : new Set();
		}
	}

	function handleClick(): void {
		if (ondblclick && lastClickedItemId) {
			const now = Date.now();
			if (now - lastTapTime < DOUBLE_TAP_MS && lastTapItemId === lastClickedItemId) {
				lastTapTime = 0;
				lastTapItemId = null;
				const item = items.find(i => i.id === lastClickedItemId);
				if (item) ondblclick(item);
				return;
			}
			lastTapTime = now;
			lastTapItemId = lastClickedItemId;
		}

		if (onclick && lastClickedItemId) {
			const item = items.find(i => i.id === lastClickedItemId);
			if (item) onclick(item);
		}

		if (pendingDeselect) {
			selection.set(new Set([pendingDeselect]));
			pendingDeselect = null;
		}
	}

	function handleDragStart(): void {
		dragMode = pressedOnItem ? 'move' : 'select';
		pendingDeselect = null;
	}

	function handleDragMove(e: PointerEvent): void {
		if (dragMode === 'move') {
			const coords = getContainerCoords(e);
			dragGhostPos = {
				x: coords.x - dragMoveOffset.x,
				y: coords.y - dragMoveOffset.y,
			};
		}

		if (dragMode === 'select') {
			dragSelectEnd = getContainerCoords(e);
			const selRect = {
				left: Math.min(dragSelectStart.x, dragSelectEnd.x),
				right: Math.max(dragSelectStart.x, dragSelectEnd.x),
				top: Math.min(dragSelectStart.y, dragSelectEnd.y),
				bottom: Math.max(dragSelectStart.y, dragSelectEnd.y),
			};

			const next = new Set(dragPreSelected);
			for (const item of items) {
				const pos = itemPositions.get(item.id)!;
				const left = pos.gridX * cellWidth;
				const top = pos.gridY * cellHeight;
				const right = left + cellWidth;
				const bottom = top + cellHeight;
				if (right > selRect.left && left < selRect.right && bottom > selRect.top && top < selRect.bottom) {
					next.add(item.id);
				}
			}
			selection.set(next);
		}
	}

	function handleDragEnd(): void {
		if (dragMode === 'move' && dragMoveItemId) {
			const newGridX = Math.max(0, Math.round(dragGhostPos.x / cellWidth));
			const newGridY = Math.max(0, Math.round(dragGhostPos.y / cellHeight));
			const origPos = itemPositions.get(dragMoveItemId)!;
			const deltaX = newGridX - origPos.gridX;
			const deltaY = newGridY - origPos.gridY;

			if (deltaX !== 0 || deltaY !== 0) {
				const selectedIds = [...selection.selected];
				const newPositions = new Map<string, { gridX: number; gridY: number }>();
				for (const id of selectedIds) {
					const pos = itemPositions.get(id)!;
					newPositions.set(id, { gridX: Math.max(0, pos.gridX + deltaX), gridY: Math.max(0, pos.gridY + deltaY) });
				}

				const selectedSet = new Set(selectedIds);
				let valid = true;
				for (const [, newPos] of newPositions) {
					for (const item of items) {
						if (selectedSet.has(item.id)) continue;
						const itemPos = itemPositions.get(item.id)!;
						if (itemPos.gridX === newPos.gridX && itemPos.gridY === newPos.gridY) {
							valid = false;
							break;
						}
					}
					if (!valid) break;
				}

				if (valid) {
					const nextOverrides = new Map(positionOverrides);
					const moves: { id: string; gridX: number; gridY: number }[] = [];
					for (const [id, pos] of newPositions) {
						nextOverrides.set(id, pos);
						moves.push({ id, ...pos });
					}
					_overrides = { sig: itemSignature, map: nextOverrides };
					onitemsmove?.(moves);
				}
			}
		}

		dragMode = 'none';
		dragMoveItemId = null;
		pendingDeselect = null;
	}

	function onKeydown(e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			_selSig = itemSignature;
			selection.selectAll(items.map(i => i.id));
		}
	}

	export function clearSelection(): void {
		selection.clear();
	}
</script>

<style>
	.icon-grid {
		position: relative;
		outline: none;
	}

	.icon-cell {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		cursor: default;
		user-select: none;
		transition: background 0.3s linear;
	}

	.icon-cell:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.icon-cell.selected {
		background: var(--color-selection);
		outline: 1px solid var(--color-accent);
	}

	.icon-cell.is-dragging {
		opacity: 0.3;
	}

	.drag-rect {
		position: absolute;
		border: 1px solid var(--color-accent);
		background: rgba(253, 221, 51, 0.1);
		pointer-events: none;
		z-index: 10;
	}

	.drag-ghost {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		opacity: 0.6;
		z-index: 100;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		inset: 0;
		color: var(--color-text-dim);
		font-size: 14px;
	}
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="icon-grid" use:observeResize bind:this={containerEl} style:min-height="max(100%, {contentHeight}px)" use:pointerGestures={{ onpress: handlePress, onclick: handleClick, ondragstart: handleDragStart, ondragmove: handleDragMove, ondragend: handleDragEnd }} onkeydown={onKeydown} tabindex="0">
	{#if items.length === 0 && empty}
		<div class="empty-state">{@render empty()}</div>
	{/if}

	{#each items as item (item.id)}
		{@const pos = itemPositions.get(item.id)}
		{#if pos}
			<div class="icon-cell" class:selected={isItemSelected(item.id)} class:is-dragging={dragMode === 'move' && isItemSelected(item.id)} data-icon-id={item.id} style="left: {pos.gridX * cellWidth}px; top: {pos.gridY * cellHeight}px; width: {cellWidth}px; height: {cellHeight}px;">
				<IconGridItem icon={item.icon} label={item.label} {iconSize} iconColor={item.iconColor} />
			</div>
		{/if}
	{/each}

	{#if dragMode === 'select'}
		{@const sx = Math.min(dragSelectStart.x, dragSelectEnd.x)}
		{@const sy = Math.min(dragSelectStart.y, dragSelectEnd.y)}
		{@const sw = Math.abs(dragSelectEnd.x - dragSelectStart.x)}
		{@const sh = Math.abs(dragSelectEnd.y - dragSelectStart.y)}
		{#if sw > 3 || sh > 3}
			<div class="drag-rect" style="left: {sx}px; top: {sy}px; width: {sw}px; height: {sh}px;"></div>
		{/if}
	{/if}

	{#if dragMode === 'move' && dragMoveItemId}
		{@const origPos = itemPositions.get(dragMoveItemId)}
		{#if origPos}
			{#each items as item (item.id)}
				{#if selection.isSelected(item.id)}
					{@const itemPos = itemPositions.get(item.id)}
					{#if itemPos}
						{@const offsetX = (itemPos.gridX - origPos.gridX) * cellWidth}
						{@const offsetY = (itemPos.gridY - origPos.gridY) * cellHeight}
						<div class="drag-ghost" style="left: {dragGhostPos.x + offsetX}px; top: {dragGhostPos.y + offsetY}px; width: {cellWidth}px; height: {cellHeight}px;">
							<IconGridItem icon={item.icon} label={item.label} {iconSize} iconColor={item.iconColor} />
						</div>
					{/if}
				{/if}
			{/each}
		{/if}
	{/if}
</div>
