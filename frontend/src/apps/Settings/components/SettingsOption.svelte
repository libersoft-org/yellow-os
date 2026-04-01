<script lang="ts">
	import type { Snippet } from 'svelte';
	import Clickable from '../../../components/Clickable/Clickable.svelte';
	interface Props {
		active?: boolean;
		onclick?: (() => void) | undefined;
		children: Snippet;
	}
	let { active = false, onclick, children }: Props = $props();
</script>

<style>
	.option-btn {
		padding: 6px 14px;
		border-radius: 6px;
		font-size: 13px;
		color: var(--color-text);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		transition: all 0.15s;
	}

	.option-btn:hover {
		background: var(--color-hover);
	}

	.option-btn.active {
		background: var(--color-accent-subtle);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>

<Clickable {onclick}>
	<div class="option-btn" class:active>{@render children()}</div>
</Clickable>
