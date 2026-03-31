<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconGridItemData } from '../IconGrid/icon-grid.ts';
	import { createSelectableItems, type GhostConfig } from '../../scripts/ui/selectable-items.svelte.ts';
	import { pointerGestures } from '../../scripts/ui/pointer-gestures.ts';
	import type { DragGhostItem } from '../../scripts/ui/drag-state.svelte.ts';
	import IconGridItem from '../IconGrid/IconGridItem.svelte';
	import ListItem from './ListItem.svelte';
	interface Props {
		items: IconGridItemData[];
		dirPath?: string | undefined;
		getInitialSelection?: (() => Set<string>) | undefined;
		onclick?: ((item: IconGridItemData) => void) | undefined;
		ondblclick?: ((item: IconGridItemData) => void) | undefined;
		onselectionchange?: ((selectedIds: Set<string>) => void) | undefined;
		ondrop?: ((draggedIds: string[], targetId: string | null, e: PointerEvent) => void) | undefined;
		onkeyaction?: ((e: KeyboardEvent) => void) | undefined;
		externalDragOverId?: string | null | undefined;
		cutItemIds?: Set<string> | undefined;
		empty?: Snippet | undefined;
	}
	let { items, dirPath, getInitialSelection, onclick, ondblclick, onselectionchange, ondrop, onkeyaction, externalDragOverId, cutItemIds, empty }: Props = $props();
	let containerEl: HTMLElement | undefined = $state();

	function getItemIdFromDom(x: number, y: number): string | null {
		if (!containerEl) return null;
		const els = containerEl.querySelectorAll('[data-icon-id]');
		for (const el of els) {
			const rect = el.getBoundingClientRect();
			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				return (el as HTMLElement).dataset['iconId'] ?? null;
			}
		}
		return null;
	}

	const si = createSelectableItems({
		getItems: () => items,
		getContainerEl: () => containerEl,
		getDirPath: () => dirPath,
		getItemIdAt: getItemIdFromDom,
		toLocalCoords(e: PointerEvent): { x: number; y: number } {
			if (!containerEl) return { x: e.clientX, y: e.clientY };
			const rect = containerEl.getBoundingClientRect();
			return { x: e.clientX - rect.left, y: e.clientY - rect.top };
		},
		buildGhostConfig(e: PointerEvent, selectedIds: Set<string>): GhostConfig | null {
			const ghostItems: DragGhostItem[] = [];
			let i = 0;
			for (const item of items) {
				if (!selectedIds.has(item.id)) continue;
				ghostItems.push({ id: item.id, icon: item.icon, label: item.label, iconColor: item.iconColor, offsetX: 0, offsetY: i * 28 });
				i++;
			}
			return { items: ghostItems, x: e.clientX - 40, y: e.clientY - 14, cellWidth: 200, cellHeight: 28, iconSize: '20px' };
		},
		getItemIdsInRect(_x1: number, y1: number, _x2: number, y2: number): string[] {
			if (!containerEl) return [];
			const result: string[] = [];
			const containerRect = containerEl.getBoundingClientRect();
			const els = containerEl.querySelectorAll('[data-icon-id]');
			for (const el of els) {
				const rect = el.getBoundingClientRect();
				const elTop = rect.top - containerRect.top;
				const elBottom = rect.bottom - containerRect.top;
				if (elBottom > y1 && elTop < y2) {
					const id = (el as HTMLElement).dataset['iconId'];
					if (id) result.push(id);
				}
			}
			return result;
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
		onArrowKey(currentId: string | null, key: string): string | null {
			if (key !== 'ArrowUp' && key !== 'ArrowDown') return null;
			const ids = items.map(i => i.id);
			const idx = currentId ? ids.indexOf(currentId) : -1;
			if (key === 'ArrowDown') return ids[idx + 1] ?? null;
			if (key === 'ArrowUp') return idx > 0 ? ids[idx - 1]! : null;
			return null;
		},
		getInitialSelection: () => getInitialSelection?.(),
	});

	export function clearSelection(): void {
		si.clearSelection();
	}

	export function selectAll(): void {
		si.selectAll();
	}

	export function selectSingle(id: string): void {
		si.selectSingle(id);
	}

	export function focus(): void {
		containerEl?.focus();
	}

	export function getItemAtScreen(screenX: number, screenY: number): IconGridItemData | null {
		const id = getItemIdFromDom(screenX, screenY);
		return id ? (items.find(i => i.id === id) ?? null) : null;
	}
</script>

<style>
	.list-view {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-height: 100%;
		position: relative;
		outline: none;
		padding: 8px;
	}

	.list-item-wrapper.drop-target {
		outline: 2px dashed var(--color-accent);
		border-radius: 10px;
		background: var(--color-selection);
	}

	.list-item-wrapper.is-dragging {
		opacity: 0.3;
	}

	.list-item-wrapper.cut {
		opacity: 0.4;
	}

	.drag-rect {
		position: absolute;
		border: 1px solid var(--color-accent);
		background: var(--color-selection);
		pointer-events: none;
		z-index: 10;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--color-text-dim);
		font-size: 14px;
	}
</style>

<div class="list-view" role="listbox" bind:this={containerEl} use:pointerGestures={{ onpress: e => si.handlePress(e), onclick: () => si.handleClick(), ondblclick: () => si.handleDblClick(), ondragstart: () => si.handleDragStart(), ondragmove: e => si.handleDragMove(e), ondragend: e => si.handleDragEnd(e) }} onkeydown={e => si.handleKeydown(e)} tabindex="0">
	{#if items.length === 0 && empty}
		<div class="empty-state">{@render empty()}</div>
	{/if}
	{#each items as item (item.id)}
		<div class="list-item-wrapper" class:drop-target={si.dragOverId === item.id || externalDragOverId === item.id} class:is-dragging={si.dragMode === 'move' && si.isSelected(item.id)} class:cut={cutItemIds?.has(item.id) ?? false} data-icon-id={item.id}>
			<ListItem active={si.isSelected(item.id)}>
				<IconGridItem icon={item.icon} label={item.label} layout="horizontal" iconSize="20px" iconColor={item.iconColor} />
			</ListItem>
		</div>
	{/each}
	{#if si.dragMode === 'select'}
		{@const left = Math.min(si.dragSelectStart.x, si.dragSelectEnd.x)}
		{@const top = Math.min(si.dragSelectStart.y, si.dragSelectEnd.y)}
		{@const width = Math.abs(si.dragSelectEnd.x - si.dragSelectStart.x)}
		{@const height = Math.abs(si.dragSelectEnd.y - si.dragSelectStart.y)}
		{#if width > 3 || height > 3}
			<div class="drag-rect" style="top: {top}px; left: {left}px; width: {width}px; height: {height}px;"></div>
		{/if}
	{/if}
</div>
