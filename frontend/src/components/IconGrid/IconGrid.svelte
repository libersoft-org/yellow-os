<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconGridItemData } from './icon-grid.ts';
	import { createSelection } from '../../scripts/selection.svelte.ts';
	import { pointerGestures } from '../../scripts/pointer-gestures.ts';
	import { startGlobalDrag, endGlobalDrag, cancelGlobalDrag, updateGlobalGhost, type DragGhostItem } from '../../scripts/drag-state.svelte.ts';
	import IconGridItem from './IconGridItem.svelte';
	interface Props {
		items: IconGridItemData[];
		dirPath?: string | undefined;
		cellWidth?: number | undefined;
		cellHeight?: number | undefined;
		iconSize?: string | undefined;
		onclick?: ((item: IconGridItemData) => void) | undefined;
		ondblclick?: ((item: IconGridItemData) => void) | undefined;
		onselectionchange?: ((selectedIds: Set<string>) => void) | undefined;
		onitemsmove?: ((moves: { id: string; gridX: number; gridY: number }[]) => void) | undefined;
		ondrop?: ((draggedIds: string[], targetId: string | null, e: PointerEvent) => void) | undefined;
		columnFirst?: boolean | undefined;
		empty?: Snippet | undefined;
	}
	let { items, dirPath, cellWidth = 90, cellHeight = 90, iconSize = '40px', onclick, ondblclick, onselectionchange, onitemsmove, ondrop, columnFirst, empty }: Props = $props();
	const selection = createSelection();

	function emitSelectionChange(): void {
		onselectionchange?.(selection.selected);
	}
	let containerEl: HTMLElement | undefined = $state();
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	const itemSignature = $derived(items.map(i => i.id).join('\0'));
	let _overrides = $state({ sig: '', map: new Map<string, { gridX: number; gridY: number }>() });
	let _selSig = $state('');
	const _pendingOverrides = new Map<string, { gridX: number; gridY: number }>();
	const positionOverrides = $derived(_overrides.sig === itemSignature ? _overrides.map : new Map<string, { gridX: number; gridY: number }>());

	function isItemSelected(id: string): boolean {
		return _selSig === itemSignature && selection.isSelected(id);
	}

	function resetIfItemsChanged(): void {
		if (_selSig !== itemSignature) {
			_selSig = itemSignature;
			const mergedOverrides = new Map<string, { gridX: number; gridY: number }>();
			const itemIds = new Set(items.map(i => i.id));
			for (const [id, pos] of _pendingOverrides) {
				if (itemIds.has(id)) {
					mergedOverrides.set(id, pos);
					_pendingOverrides.delete(id);
				}
			}
			_overrides = { sig: itemSignature, map: mergedOverrides };
			selection.clear();
			emitSelectionChange();
		}
	}

	const cols = $derived(Math.max(1, Math.floor((containerWidth || 400) / cellWidth)));
	const rows = $derived(Math.max(1, Math.floor((containerHeight || 400) / cellHeight)));

	function getPosition(item: IconGridItemData, index: number): { gridX: number; gridY: number } {
		const pending = _pendingOverrides.get(item.id);
		if (pending) return pending;
		const override = positionOverrides.get(item.id);
		if (override) return override;
		if (item.gridX != null && item.gridY != null) return { gridX: item.gridX, gridY: item.gridY };
		if (columnFirst) return { gridX: Math.floor(index / rows), gridY: index % rows };
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
	let dragOverId = $state<string | null>(null);
	let dragButton = 0;

	function observeResize(node: HTMLElement): { destroy(): void } {
		containerWidth = node.clientWidth;
		containerHeight = node.clientHeight;
		const ro = new ResizeObserver(entries => {
			containerWidth = entries[0]!.contentRect.width;
			containerHeight = entries[0]!.contentRect.height;
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
					emitSelectionChange();
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
			dragButton = e.button;
			dragMoveItemId = id;
			const pos = itemPositions.get(id)!;
			const coords = getContainerCoords(e);
			dragMoveOffset = {
				x: coords.x - pos.gridX * cellWidth,
				y: coords.y - pos.gridY * cellHeight,
			};
			dragGhostPos = { x: pos.gridX * cellWidth, y: pos.gridY * cellHeight };
		} else {
			if (e.button !== 0) return false;
			lastClickedItemId = null;
			if (!(e.ctrlKey || e.metaKey)) selection.clear();
			pressedOnItem = false;
			const coords = getContainerCoords(e);
			dragSelectStart = coords;
			dragSelectEnd = coords;
			dragPreSelected = e.ctrlKey || e.metaKey ? new Set(selection.selected) : new Set();
		}
		emitSelectionChange();
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
		emitSelectionChange();
	}

	function handleDragStart(): void {
		dragMode = pressedOnItem ? 'move' : 'select';
		pendingDeselect = null;
		if (pressedOnItem && dirPath && containerEl) {
			startGlobalDrag(containerEl);
		}
	}

	function getItemAtCoords(cx: number, cy: number): string | null {
		for (const [id, pos] of itemPositions) {
			if (selection.isSelected(id)) continue;
			const left = pos.gridX * cellWidth;
			const top = pos.gridY * cellHeight;
			if (cx >= left && cx < left + cellWidth && cy >= top && cy < top + cellHeight) {
				return id;
			}
		}
		return null;
	}

	function handleDragMove(e: PointerEvent): void {
		if (dragMode === 'move') {
			const coords = getContainerCoords(e);
			dragGhostPos = {
				x: coords.x - dragMoveOffset.x,
				y: coords.y - dragMoveOffset.y,
			};
			const hoveredId = getItemAtCoords(coords.x, coords.y);
			if (hoveredId) {
				const item = items.find(i => i.id === hoveredId);
				dragOverId = item?.droppable ? hoveredId : null;
			} else {
				dragOverId = null;
			}

			if (dirPath && dragMoveItemId) {
				const origPos = itemPositions.get(dragMoveItemId);
				if (origPos) {
					const ghostItems: DragGhostItem[] = [];
					for (const item of items) {
						if (!selection.isSelected(item.id)) continue;
						const itemPos = itemPositions.get(item.id);
						if (!itemPos) continue;
						ghostItems.push({
							icon: item.icon,
							label: item.label,
							iconColor: item.iconColor,
							offsetX: (itemPos.gridX - origPos.gridX) * cellWidth,
							offsetY: (itemPos.gridY - origPos.gridY) * cellHeight,
						});
					}
					updateGlobalGhost(ghostItems, e.clientX - dragMoveOffset.x, e.clientY - dragMoveOffset.y, cellWidth, cellHeight, iconSize);
				}
			}
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
			emitSelectionChange();
		}
	}

	function handleDragEnd(e: PointerEvent): void {
		if (dragMode === 'move' && dragMoveItemId) {
			let handled = false;
			if (dirPath) {
				handled = endGlobalDrag(dirPath, [...selection.selected], dragButton, e.clientX, e.clientY);
			}
			if (!handled) {
				if (ondrop && (dragOverId || e.button === 2)) {
					const draggedIds = [...selection.selected];
					ondrop(draggedIds, dragOverId, e);
				} else {
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
			}
		}

		cancelGlobalDrag();
		dragMode = 'none';
		dragMoveItemId = null;
		pendingDeselect = null;
		dragOverId = null;
	}

	function onKeydown(e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			_selSig = itemSignature;
			selection.selectAll(items.map(i => i.id));
			emitSelectionChange();
		}
	}

	export function clearSelection(): void {
		selection.clear();
	}

	export function schedulePositions(positions: Map<string, { gridX: number; gridY: number }>): void {
		for (const [id, pos] of positions) {
			_pendingOverrides.set(id, pos);
		}
	}

	export function screenToGrid(screenX: number, screenY: number): { gridX: number; gridY: number } {
		if (!containerEl) return { gridX: 0, gridY: 0 };
		const rect = containerEl.getBoundingClientRect();
		const localX = screenX - rect.left + (containerEl.scrollLeft || 0);
		const localY = screenY - rect.top + (containerEl.scrollTop || 0);
		return {
			gridX: Math.max(0, Math.floor(localX / cellWidth)),
			gridY: Math.max(0, Math.floor(localY / cellHeight)),
		};
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

	.icon-cell.drop-target {
		background: var(--color-selection);
		outline: 2px dashed var(--color-accent);
	}

	.icon-cell.is-dragging {
		opacity: 0.3;
	}

	.drag-rect {
		position: absolute;
		border: 1px solid var(--color-accent);
		background: var(--color-selection);
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

<div class="icon-grid" role="grid" use:observeResize bind:this={containerEl} style:min-height="max(100%, {contentHeight}px)" use:pointerGestures={{ onpress: handlePress, onclick: handleClick, ondragstart: handleDragStart, ondragmove: handleDragMove, ondragend: handleDragEnd }} onkeydown={onKeydown} tabindex="0">
	{#if items.length === 0 && empty}
		<div class="empty-state">{@render empty()}</div>
	{/if}

	{#each items as item (item.id)}
		{@const pos = itemPositions.get(item.id)}
		{#if pos}
			<div class="icon-cell" class:selected={isItemSelected(item.id)} class:is-dragging={dragMode === 'move' && isItemSelected(item.id)} class:drop-target={dragOverId === item.id} data-icon-id={item.id} style="left: {pos.gridX * cellWidth}px; top: {pos.gridY * cellHeight}px; width: {cellWidth}px; height: {cellHeight}px;">
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

	{#if dragMode === 'move' && dragMoveItemId && !dirPath}
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
