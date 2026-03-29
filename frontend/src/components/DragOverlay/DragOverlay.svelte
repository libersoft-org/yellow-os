<script lang="ts">
	import { globalGhost } from '../../scripts/ui/drag-state.svelte.ts';
	import IconGridItem from '../IconGrid/IconGridItem.svelte';
</script>

<style>
	.drag-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		z-index: 10000;
		pointer-events: none;
	}

	.drag-ghost-item {
		position: absolute;
		opacity: 0.7;
		pointer-events: none;
	}

	.drag-overlay.no-drop .drag-ghost-item {
		opacity: 0.4;
	}

	.no-drop-badge {
		position: absolute;
		pointer-events: none;
	}
</style>

{#if globalGhost.active}
	<div class="drag-overlay" class:no-drop={!globalGhost.canDrop}>
		{#each globalGhost.items as item}
			<div class="drag-ghost-item" style="left: {globalGhost.x + item.offsetX}px; top: {globalGhost.y + item.offsetY}px; width: {globalGhost.cellWidth}px; height: {globalGhost.cellHeight}px;">
				<IconGridItem icon={item.icon} label={item.label} iconSize={globalGhost.iconSize} iconColor={item.iconColor} />
			</div>
		{/each}
		{#if !globalGhost.canDrop}
			<div class="no-drop-badge" style="left: {globalGhost.x + globalGhost.cellWidth - 14}px; top: {globalGhost.y + globalGhost.cellHeight - 14}px;">
				<svg width="22" height="22" viewBox="0 0 22 22">
					<circle cx="11" cy="11" r="10" fill="rgba(180, 30, 30, 0.9)" stroke="white" stroke-width="1.5" />
					<line x1="5" y1="11" x2="17" y2="11" stroke="white" stroke-width="2.5" stroke-linecap="round" />
				</svg>
			</div>
		{/if}
	</div>
{/if}
