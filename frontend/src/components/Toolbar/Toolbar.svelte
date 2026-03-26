<script lang="ts">
	import type { Snippet } from 'svelte';
	interface Props {
		children: Snippet;
	}
	const { children }: Props = $props();
</script>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 4px;
		background: var(--color-surface-2);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}
</style>

<div class="toolbar">
	{@render children()}
</div>
