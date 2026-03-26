<script lang="ts">
	import type { Snippet } from 'svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	interface Props {
		children?: Snippet;
		onclick?: ((e: MouseEvent) => void) | undefined;
		variant?: 'default' | 'danger';
		enabled?: boolean | undefined;
	}
	let { children, onclick, variant = 'default', enabled = true }: Props = $props();
</script>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 16px;
		border-radius: 6px;
		font-size: 13px;
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

	.button.danger {
		background: #b91c1c;
		border-color: #991b1b;
		color: #fff;
	}

	.button.danger:hover {
		background: #dc2626;
	}

	.button.disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>

<Clickable {onclick} {enabled}>
	<div class="button" class:danger={variant === 'danger'} class:disabled={enabled === false}>
		{#if children}
			{@render children()}
		{/if}
	</div>
</Clickable>
