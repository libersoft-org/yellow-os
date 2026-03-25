<script lang="ts">
	import type { Snippet } from 'svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	interface Props {
		onclick?: (e: MouseEvent) => void;
		active?: boolean | undefined;
		children: Snippet;
	}
	let { onclick, active = false, children }: Props = $props();
</script>

<style>
	.list-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		border-radius: 10px;
		background: transparent;
		transition: background 0.3s linear;
	}

	.list-item:hover {
		background: var(--color-hover);
	}

	.list-item.active {
		background: var(--color-selection);
		outline: 1px solid var(--color-accent);
	}
</style>

<Clickable {onclick}>
	<div class="list-item" class:active>
		{@render children()}
	</div>
</Clickable>
