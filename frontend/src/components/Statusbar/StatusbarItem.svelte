<script lang="ts">
	import type { Snippet } from 'svelte';
	interface Props {
		children: Snippet;
	}
	const { children }: Props = $props();
</script>

<style>
	.statusbar-item {
		padding: 2px 10px;
		border-right: 1px solid var(--color-border);
		white-space: nowrap;
	}

	.statusbar-item:last-child {
		border-right: none;
	}
</style>

<span class="statusbar-item">
	{@render children()}
</span>
