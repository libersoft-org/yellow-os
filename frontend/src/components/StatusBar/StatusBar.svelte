<script lang="ts">
	import type { Snippet } from 'svelte';
	interface Props {
		children: Snippet;
	}
	const { children }: Props = $props();
</script>

<style>
	.statusbar {
		display: flex;
		background: var(--color-surface-2);
		border-top: 1px solid var(--color-border);
		font-size: 11px;
		color: var(--color-text-dim);
		flex-shrink: 0;
	}
</style>

<div class="statusbar">
	{@render children()}
</div>
