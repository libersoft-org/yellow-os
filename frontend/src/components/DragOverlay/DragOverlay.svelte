<script lang="ts">
	import { globalGhost } from '../../scripts/drag-state.svelte.ts';
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
</style>

{#if globalGhost.active}
	<div class="drag-overlay">
		{#each globalGhost.items as item}
			<div class="drag-ghost-item" style="left: {globalGhost.x + item.offsetX}px; top: {globalGhost.y + item.offsetY}px; width: {globalGhost.cellWidth}px; height: {globalGhost.cellHeight}px;">
				<IconGridItem icon={item.icon} label={item.label} iconSize={globalGhost.iconSize} iconColor={item.iconColor} />
			</div>
		{/each}
	</div>
{/if}
