<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconGridItemData } from './icon-grid.ts';
	import { createSelectableItems, type GhostConfig } from '../../scripts/ui/selectable-items.svelte.ts';
	import { pointerGestures } from '../../scripts/ui/pointer-gestures.ts';
	import { type DragGhostItem, type DropResult } from '../../scripts/ui/drag-state.svelte.ts';
	import IconGridItem from './IconGridItem.svelte';
	interface Props {
		items: IconGridItemData[];
		dirPath?: string | undefined;
		cellWidth?: number | undefined;
		cellHeight?: number | undefined;
		iconSize?: string | undefined;
		getInitialSelection?: (() => Set<string>) | undefined;
		onclick?: ((item: IconGridItemData) => void) | undefined;
		ondblclick?: ((item: IconGridItemData) => void) | undefined;
		onselectionchange?: ((selectedIds: Set<string>) => void) | undefined;
		onitemsmove?: ((moves: { id: string; gridX: number; gridY: number }[]) => void) | undefined;
		ondrop?: ((draggedIds: string[], targetId: string | null, e: PointerEvent) => void) | undefined;
		onkeyaction?: ((e: KeyboardEvent) => void) | undefined;
		externalDragOverId?: string | null | undefined;
		cutItemIds?: Set<string> | undefined;
		columnFirst?: boolean | undefined;
		empty?: Snippet | undefined;
	}
	let { items, dirPath, cellWidth = 100, cellHeight = 100, iconSize = '40px', getInitialSelection, onclick, ondblclick, onselectionchange, onitemsmove, ondrop, onkeyaction, externalDragOverId, cutItemIds, columnFirst, empty }: Props = $props();
	let containerEl: HTMLElement | undefined = $state();
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let _positions = $state({ map: new Map<string, { gridX: number; gridY: number }>() });

	// --- Grid layout ---

	const cols = $derived(Math.max(1, Math.floor((containerWidth || 400) / cellWidth)));
	const rows = $derived(Math.max(1, Math.floor((containerHeight || 400) / cellHeight)));

	const itemPositions = $derived.by(() => {
		const result = new Map<string, { gridX: number; gridY: number }>();
		const occupied = new Set<string>();

		for (const item of items) {
			const pos = _positions.map.get(item.id);
			if (pos) {
				result.set(item.id, pos);
				occupied.add(pos.gridX + ',' + pos.gridY);
			} else if (item.gridX != null && item.gridY != null) {
				result.set(item.id, { gridX: item.gridX, gridY: item.gridY });
				occupied.add(item.gridX + ',' + item.gridY);
			}
		}

		for (let i = 0; i < items.length; i++) {
			const item = items[i]!;
			if (result.has(item.id)) continue;
			let fallbackX: number;
			let fallbackY: number;
			if (columnFirst) {
				fallbackX = Math.floor(i / rows);
				fallbackY = i % rows;
			} else {
				fallbackX = i % cols;
				fallbackY = Math.floor(i / cols);
			}
			const free = findFreePosition(fallbackX, fallbackY, occupied);
			result.set(item.id, free);
			occupied.add(free.gridX + ',' + free.gridY);
		}

		return result;
	});

	function findFreePosition(startX: number, startY: number, occupied: Set<string>): { gridX: number; gridY: number } {
		function isOccupied(gx: number, gy: number): boolean {
			return occupied.has(gx + ',' + gy);
		}
		if (!isOccupied(startX, startY)) return { gridX: startX, gridY: startY };
		for (let radius = 1; radius < 100; radius++) {
			for (let dy = -radius; dy <= radius; dy++) {
				for (let dx = -radius; dx <= radius; dx++) {
					if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
					const gx = startX + dx;
					const gy = startY + dy;
					if (gx < 0 || gy < 0) continue;
					if (!isOccupied(gx, gy)) return { gridX: gx, gridY: gy };
				}
			}
		}
		return { gridX: startX, gridY: startY };
	}

	function getOccupiedSet(excludeIds: Set<string>): Set<string> {
		const occupied = new Set<string>();
		for (const [id, pos] of itemPositions) {
			if (excludeIds.has(id)) continue;
			occupied.add(pos.gridX + ',' + pos.gridY);
		}
		return occupied;
	}

	const contentHeight = $derived.by(() => {
		let maxRow = 0;
		for (const pos of itemPositions.values()) maxRow = Math.max(maxRow, pos.gridY);
		return (maxRow + 1) * cellHeight;
	});

	const contentWidth = $derived.by(() => {
		let maxCol = 0;
		for (const pos of itemPositions.values()) maxCol = Math.max(maxCol, pos.gridX);
		return (maxCol + 1) * cellWidth;
	});

	// --- Grid-specific drag state ---

	let dragMoveItemId = $state<string | null>(null);
	let dragMoveOffset = $state({ x: 0, y: 0 });
	let dragGhostPos = $state({ x: 0, y: 0 });

	// --- Resize observer ---

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

	// --- Arrow key navigation ---

	function findItemInDirection(fromId: string | null, key: string): string | null {
		if (!fromId) return null;
		const fromPos = itemPositions.get(fromId);
		if (!fromPos) return null;
		const dx = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
		const dy = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
		let bestId: string | null = null;
		let bestDist = Infinity;
		for (const [id, pos] of itemPositions) {
			if (id === fromId) continue;
			const relX = pos.gridX - fromPos.gridX;
			const relY = pos.gridY - fromPos.gridY;
			if (dx !== 0 && Math.sign(relX) !== dx) continue;
			if (dy !== 0 && Math.sign(relY) !== dy) continue;
			const primary = dx !== 0 ? Math.abs(relX) : Math.abs(relY);
			const secondary = dx !== 0 ? Math.abs(relY) : Math.abs(relX);
			const dist = primary + secondary * 1000;
			if (dist < bestDist) {
				bestDist = dist;
				bestId = id;
			}
		}
		return bestId;
	}

	// --- Selectable items ---

	const si = createSelectableItems({
		getItems: () => items,
		getContainerEl: () => containerEl,
		getDirPath: () => dirPath,
		getItemIdAt(screenX: number, screenY: number): string | null {
			if (!containerEl) return null;
			const rect = containerEl.getBoundingClientRect();
			const cx = screenX - rect.left + (containerEl.scrollLeft || 0);
			const cy = screenY - rect.top + (containerEl.scrollTop || 0);
			for (const [id, pos] of itemPositions) {
				if (si.isSelected(id)) continue;
				const left = pos.gridX * cellWidth;
				const top = pos.gridY * cellHeight;
				if (cx >= left && cx < left + cellWidth && cy >= top && cy < top + cellHeight) {
					return id;
				}
			}
			return null;
		},
		toLocalCoords: getContainerCoords,
		buildGhostConfig(e: PointerEvent, selectedIds: Set<string>): GhostConfig | null {
			if (!dragMoveItemId) return null;
			const origPos = itemPositions.get(dragMoveItemId);
			if (!origPos) return null;
			const coords = getContainerCoords(e);
			dragGhostPos = {
				x: coords.x - dragMoveOffset.x,
				y: coords.y - dragMoveOffset.y,
			};
			const ghostItems: DragGhostItem[] = [];
			for (const item of items) {
				if (!selectedIds.has(item.id)) continue;
				const itemPos = itemPositions.get(item.id);
				if (!itemPos) continue;
				ghostItems.push({ id: item.id, icon: item.icon, label: item.label, iconColor: item.iconColor, offsetX: (itemPos.gridX - origPos.gridX) * cellWidth, offsetY: (itemPos.gridY - origPos.gridY) * cellHeight });
			}
			return { items: ghostItems, x: e.clientX - dragMoveOffset.x, y: e.clientY - dragMoveOffset.y, cellWidth, cellHeight, iconSize };
		},
		getItemIdsInRect(x1: number, y1: number, x2: number, y2: number): string[] {
			const result: string[] = [];
			for (const item of items) {
				const pos = itemPositions.get(item.id);
				if (!pos) continue;
				const left = pos.gridX * cellWidth;
				const top = pos.gridY * cellHeight;
				const right = left + cellWidth;
				const bottom = top + cellHeight;
				if (right > x1 && left < x2 && bottom > y1 && top < y2) {
					result.push(item.id);
				}
			}
			return result;
		},
		onPressItem(id: string, e: PointerEvent): void {
			dragMoveItemId = id;
			const pos = itemPositions.get(id)!;
			const coords = getContainerCoords(e);
			dragMoveOffset = {
				x: coords.x - pos.gridX * cellWidth,
				y: coords.y - pos.gridY * cellHeight,
			};
			dragGhostPos = { x: pos.gridX * cellWidth, y: pos.gridY * cellHeight };
		},
		onMoveDragEnd(dropResult: DropResult | null, _draggedIds: string[], dragOverId: string | null, e: PointerEvent): boolean {
			if (!dragMoveItemId) return false;
			if (dropResult === 'handled') {
				const next = new Map(_positions.map);
				for (const [id, pos] of itemPositions) next.set(id, pos);
				_positions = { map: next };
				dragMoveItemId = null;
				return true;
			}
			if (dropResult === 'blocked') {
				dragMoveItemId = null;
				return true;
			}
			// Drop onto a droppable item or right-click: call ondrop directly (grid must
			// decide between local grid-move vs item/context-menu drop before delegating)
			if (ondrop && (dragOverId || e.button === 2)) {
				ondrop([...si.selected], dragOverId, e);
				dragMoveItemId = null;
				return true;
			}
			// Local grid move
			const coords = getContainerCoords(e);
			dragGhostPos = {
				x: coords.x - dragMoveOffset.x,
				y: coords.y - dragMoveOffset.y,
			};
			const newGridX = Math.max(0, Math.round(dragGhostPos.x / cellWidth));
			const newGridY = Math.max(0, Math.round(dragGhostPos.y / cellHeight));
			const origPos = itemPositions.get(dragMoveItemId)!;
			const deltaX = newGridX - origPos.gridX;
			const deltaY = newGridY - origPos.gridY;
			if (deltaX !== 0 || deltaY !== 0) {
				const selectedIds = [...si.selected];
				const selectedSet = new Set(selectedIds);
				const occupied = getOccupiedSet(selectedSet);
				const newPositions = new Map<string, { gridX: number; gridY: number }>();
				for (const id of selectedIds) {
					const pos = itemPositions.get(id)!;
					const wanted = { gridX: Math.max(0, pos.gridX + deltaX), gridY: Math.max(0, pos.gridY + deltaY) };
					const free = findFreePosition(wanted.gridX, wanted.gridY, occupied);
					newPositions.set(id, free);
					occupied.add(free.gridX + ',' + free.gridY);
				}
				const next = new Map(_positions.map);
				const moves: { id: string; gridX: number; gridY: number }[] = [];
				for (const [id, pos] of newPositions) {
					next.set(id, pos);
					moves.push({ id, ...pos });
				}
				_positions = { map: next };
				onitemsmove?.(moves);
			}
			dragMoveItemId = null;
			return true;
		},
		onselectionchange(selectedIds: Set<string>): void {
			onselectionchange?.(selectedIds);
		},
		onclick(id: string): void {
			const item = items.find(i => i.id === id);
			if (item) onclick?.(item);
		},
		ondblclick(id: string): void {
			const item = items.find(i => i.id === id);
			if (item) ondblclick?.(item);
		},
		ondrop(draggedIds: string[], targetId: string | null, e: PointerEvent): void {
			ondrop?.(draggedIds, targetId, e);
		},
		onkeyaction(e: KeyboardEvent): void {
			onkeyaction?.(e);
		},
		onArrowKey: findItemInDirection,
		getInitialSelection: () => getInitialSelection?.(),
	});

	// --- Exports ---

	export function clearSelection(): void {
		si.clearSelection();
	}

	export function selectAll(): void {
		si.selectAll();
	}

	export function selectSingle(id: string): void {
		si.selectSingle(id);
	}

	export function clearPositions(): void {
		_positions = { map: new Map() };
	}

	export function focus(): void {
		containerEl?.focus();
	}

	export function renamePosition(oldId: string, newId: string): void {
		const pos = _positions.map.get(oldId) ?? itemPositions.get(oldId);
		if (!pos) return;
		const next = new Map(_positions.map);
		next.set(newId, pos);
		_positions = { map: next };
		if (si.isSelected(oldId)) {
			const sel = new Set(si.selected);
			sel.delete(oldId);
			sel.add(newId);
			si.setSelection(sel);
		}
	}

	export function schedulePositions(positions: Map<string, { gridX: number; gridY: number }>): void {
		const next = new Map(_positions.map);
		for (const [id, pos] of itemPositions) {
			if (!next.has(id) && !positions.has(id)) next.set(id, pos);
		}
		const incomingIds = new Set(positions.keys());
		const occupied = new Set<string>();
		for (const [id, pos] of itemPositions) {
			if (incomingIds.has(id)) continue;
			occupied.add(pos.gridX + ',' + pos.gridY);
		}
		for (const [id, pos] of next) {
			if (incomingIds.has(id)) continue;
			occupied.add(pos.gridX + ',' + pos.gridY);
		}
		for (const [id, pos] of positions) {
			const free = findFreePosition(pos.gridX, pos.gridY, occupied);
			next.set(id, free);
			occupied.add(free.gridX + ',' + free.gridY);
		}
		_positions = { map: next };
	}

	export function getItemPosition(id: string): { gridX: number; gridY: number } | null {
		return itemPositions.get(id) ?? null;
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

	export function getItemAtScreen(screenX: number, screenY: number): IconGridItemData | null {
		if (!containerEl) return null;
		const rect = containerEl.getBoundingClientRect();
		const cx = screenX - rect.left + (containerEl.scrollLeft || 0);
		const cy = screenY - rect.top + (containerEl.scrollTop || 0);
		for (const [id, pos] of itemPositions) {
			const left = pos.gridX * cellWidth;
			const top = pos.gridY * cellHeight;
			if (cx >= left && cx < left + cellWidth && cy >= top && cy < top + cellHeight) {
				return items.find(i => i.id === id) ?? null;
			}
		}
		return null;
	}
</script>

<style>
	.icon-grid {
		position: relative;
		outline: none;
	}

	.icon-cell {
		--cell-gap: 4px;
		position: absolute;
		left: calc(var(--cx) + var(--cell-gap));
		top: calc(var(--cy) + var(--cell-gap));
		width: calc(var(--cw) - var(--cell-gap) * 2);
		height: calc(var(--ch) - var(--cell-gap) * 2);
		display: flex;
		align-items: start;
		justify-content: center;
		padding-top: 6px;
		box-sizing: border-box;
		border-radius: 8px;
		border: 1px solid transparent;
		cursor: default;
		user-select: none;
		transition: background 0.3s linear;
		overflow: hidden;
	}

	.icon-cell:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.icon-cell.selected {
		background: var(--color-selection);
		border-color: var(--color-accent);
	}

	.icon-cell.drop-target {
		background: var(--color-selection);
		border: 2px dashed var(--color-accent);
	}

	.icon-cell.is-dragging {
		opacity: 0.3;
	}

	.icon-cell.cut {
		opacity: 0.4;
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

<div class="icon-grid" role="grid" use:observeResize bind:this={containerEl} style:min-height="max(100%, {contentHeight}px)" style:min-width="max(100%, {contentWidth}px)" use:pointerGestures={{ onpress: e => si.handlePress(e), onclick: () => si.handleClick(), ondblclick: () => si.handleDblClick(), ondragstart: () => si.handleDragStart(), ondragmove: e => si.handleDragMove(e), ondragend: e => si.handleDragEnd(e) }} onkeydown={e => si.handleKeydown(e)} tabindex="0">
	{#if items.length === 0 && empty}
		<div class="empty-state">{@render empty()}</div>
	{/if}

	{#each items as item (item.id)}
		{@const pos = itemPositions.get(item.id)}
		{#if pos}
			<div class="icon-cell" class:selected={si.isSelected(item.id)} class:is-dragging={si.dragMode === 'move' && si.isSelected(item.id)} class:drop-target={si.dragOverId === item.id || externalDragOverId === item.id} class:cut={cutItemIds?.has(item.id) ?? false} data-icon-id={item.id} style="--cx: {pos.gridX * cellWidth}px; --cy: {pos.gridY * cellHeight}px; --cw: {cellWidth}px; --ch: {cellHeight}px;">
				<IconGridItem icon={item.icon} label={item.label} {iconSize} iconColor={item.iconColor} />
			</div>
		{/if}
	{/each}

	{#if si.dragMode === 'select'}
		{@const sx = Math.min(si.dragSelectStart.x, si.dragSelectEnd.x)}
		{@const sy = Math.min(si.dragSelectStart.y, si.dragSelectEnd.y)}
		{@const sw = Math.abs(si.dragSelectEnd.x - si.dragSelectStart.x)}
		{@const sh = Math.abs(si.dragSelectEnd.y - si.dragSelectStart.y)}
		{#if sw > 3 || sh > 3}
			<div class="drag-rect" style="left: {sx}px; top: {sy}px; width: {sw}px; height: {sh}px;"></div>
		{/if}
	{/if}

	{#if si.dragMode === 'move' && dragMoveItemId && !dirPath}
		{@const origPos = itemPositions.get(dragMoveItemId)}
		{#if origPos}
			{#each items as item (item.id)}
				{#if si.isSelected(item.id)}
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
