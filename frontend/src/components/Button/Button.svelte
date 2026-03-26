<script lang="ts">
	import type { Snippet } from 'svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	interface Props {
		children?: Snippet;
		onclick?: ((e: MouseEvent) => void) | undefined;
		colorVariable?: string | undefined;
		backgroundColorVariable?: string | undefined;
		enabled?: boolean | undefined;
	}
	let { children, onclick, colorVariable, backgroundColorVariable, enabled = true }: Props = $props();
	const hasCustomColors = $derived(!!colorVariable || !!backgroundColorVariable);
</script>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 16px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: bold;
		cursor: pointer;
		user-select: none;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	.button:hover {
		background: var(--color-hover);
	}

	.button.colored {
		background: var(--btn-bg);
		border-color: var(--btn-bg);
		color: var(--btn-fg);
	}

	.button.colored:hover {
		filter: brightness(1.15);
	}

	.button.disabled {
		background-color: var(--color-surface-2);
		color: var(--color-text-dim);
		cursor: default;
	}
</style>

<Clickable {onclick} {enabled}>
	<div class="button" class:colored={hasCustomColors} class:disabled={enabled === false} style:--btn-bg={backgroundColorVariable ? `var(${backgroundColorVariable})` : undefined} style:--btn-fg={colorVariable ? `var(${colorVariable})` : undefined}>
		{#if children}
			{@render children()}
		{/if}
	</div>
</Clickable>
