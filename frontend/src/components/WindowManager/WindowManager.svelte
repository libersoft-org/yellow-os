<script lang="ts">
	import { windows, snapPreview, getSnapBounds } from '../../scripts/window.svelte';
	import Window from './Window.svelte';
	const previewBounds = $derived(snapPreview.zone ? getSnapBounds(snapPreview.zone) : null);
</script>

<style>
	.snap-preview {
		position: absolute;
		background: rgba(255, 221, 51, 0.15);
		border: 2px solid var(--color-accent);
		border-radius: var(--border-radius);
		z-index: 999999;
		pointer-events: none;
		transition:
			left 0.15s ease,
			top 0.15s ease,
			width 0.15s ease,
			height 0.15s ease;
	}
</style>

{#each windows as win (win.id)}
	<Window {win} />
{/each}
{#if previewBounds}
	<div class="snap-preview" style:left="{previewBounds.x}px" style:top="{previewBounds.y}px" style:width="{previewBounds.width}px" style:height="{previewBounds.height}px"></div>
{/if}
