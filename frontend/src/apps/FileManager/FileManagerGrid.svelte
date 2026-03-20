<script lang="ts">
	import type { FileEntry } from './filemanager';
	import { computeClickSelection } from '../../scripts/selection.svelte';
	import FileManagerGridItem from './FileManagerGridItem.svelte';
	interface Props {
		entries: FileEntry[];
		selected: Set<string>;
		onselectionchange: (selected: Set<string>) => void;
		onopen: (entry: FileEntry) => void;
	}
	const { entries, selected, onselectionchange, onopen }: Props = $props();
	let lastClickedIndex = -1;
	let fileGrid: HTMLElement | undefined = $state();
	let dragSelecting = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let dragEnd = $state({ x: 0, y: 0 });
	let dragPreSelected = new Set<string>();
	let entryElements = new Map<string, HTMLElement>();

	function selectEntry(name: string, e: MouseEvent | KeyboardEvent) {
		const allIds = entries.map(en => en.name);
		const idx = allIds.indexOf(name);
		const result = computeClickSelection(selected, name, idx, allIds, lastClickedIndex, e);
		lastClickedIndex = result.lastClickedIndex;
		onselectionchange(result.selected);
	}

	function trackEntry(node: HTMLElement, name: string) {
		entryElements.set(name, node);
		return {
			update(newName: string) {
				entryElements.delete(name);
				name = newName;
				entryElements.set(name, node);
			},
			destroy() {
				entryElements.delete(name);
			},
		};
	}

	function onGridPointerDown(e: PointerEvent) {
		if ((e.target as HTMLElement).closest('.item')) return;
		dragSelecting = true;
		const rect = fileGrid!.getBoundingClientRect();
		const x = e.clientX - rect.left + fileGrid!.scrollLeft;
		const y = e.clientY - rect.top + fileGrid!.scrollTop;
		dragStart = { x, y };
		dragEnd = { x, y };
		dragPreSelected = e.ctrlKey || e.metaKey ? new Set(selected) : new Set();
		fileGrid!.setPointerCapture(e.pointerId);
	}

	function onGridPointerMove(e: PointerEvent) {
		if (!dragSelecting || !fileGrid) return;
		const rect = fileGrid.getBoundingClientRect();
		dragEnd = {
			x: e.clientX - rect.left + fileGrid.scrollLeft,
			y: e.clientY - rect.top + fileGrid.scrollTop,
		};
		const selRect = {
			left: Math.min(dragStart.x, dragEnd.x),
			right: Math.max(dragStart.x, dragEnd.x),
			top: Math.min(dragStart.y, dragEnd.y),
			bottom: Math.max(dragStart.y, dragEnd.y),
		};
		const next = new Set(dragPreSelected);
		const gridRect = fileGrid.getBoundingClientRect();
		for (const [name, el] of entryElements) {
			const er = el.getBoundingClientRect();
			const elLeft = er.left - gridRect.left + fileGrid.scrollLeft;
			const elTop = er.top - gridRect.top + fileGrid.scrollTop;
			const elRight = elLeft + er.width;
			const elBottom = elTop + er.height;
			if (elRight > selRect.left && elLeft < selRect.right && elBottom > selRect.top && elTop < selRect.bottom) next.add(name);
		}
		onselectionchange(next);
	}

	function onGridPointerUp() {
		if (dragSelecting) {
			const dx = Math.abs(dragEnd.x - dragStart.x);
			const dy = Math.abs(dragEnd.y - dragStart.y);
			if (dx < 3 && dy < 3) onselectionchange(dragPreSelected);
		}
		dragSelecting = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			onselectionchange(new Set(entries.map(en => en.name)));
		}
	}
</script>

<style>
	.file-grid {
		flex: 1;
		overflow: auto;
		padding: 12px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 4px;
		align-content: start;
		position: relative;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		color: var(--color-text-dim);
		font-size: 14px;
	}

	.drag-rect {
		position: absolute;
		border: 1px solid var(--color-accent);
		background: rgba(253, 221, 51, 0.1);
		pointer-events: none;
		z-index: 10;
	}
</style>

{#if entries.length === 0}
	<div class="empty">This directory is empty</div>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div class="file-grid" bind:this={fileGrid} onpointerdown={onGridPointerDown} onpointermove={onGridPointerMove} onpointerup={onGridPointerUp} onkeydown={onKeydown} tabindex="0">
		{#if dragSelecting}
			<div class="drag-rect" style:left="{Math.min(dragStart.x, dragEnd.x)}px" style:top="{Math.min(dragStart.y, dragEnd.y)}px" style:width="{Math.abs(dragEnd.x - dragStart.x)}px" style:height="{Math.abs(dragEnd.y - dragStart.y)}px"></div>
		{/if}
		{#each entries as entry (entry.name)}
			<div use:trackEntry={entry.name}>
				<FileManagerGridItem {entry} selected={selected.has(entry.name)} onclick={e => selectEntry(entry.name, e)} ondblclick={() => onopen(entry)} />
			</div>
		{/each}
	</div>
{/if}
