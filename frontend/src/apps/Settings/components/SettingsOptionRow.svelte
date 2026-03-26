<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<style>
	.option-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
</style>

<div class="option-row">{@render children()}</div>
