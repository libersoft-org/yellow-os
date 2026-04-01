<script lang="ts">
	import type { Snippet } from 'svelte';
	interface Props {
		left?: Snippet;
		center?: Snippet;
		right?: Snippet;
	}
	const { left, center, right }: Props = $props();
</script>

<style>
	.statusbar {
		display: flex;
		background: var(--color-surface-2);
		border-top: 1px solid var(--color-border);
		font-size: 14px;
		color: var(--color-text);
		flex-shrink: 0;
	}

	.section {
		display: flex;
	}

	.section-left {
		margin-right: auto;
	}

	.section-center {
		margin-left: auto;
		margin-right: auto;
	}

	.section-right {
		margin-left: auto;
	}
</style>

<div class="statusbar">
	{#if left}
		<div class="section section-left">{@render left()}</div>
	{/if}
	{#if center}
		<div class="section section-center">{@render center()}</div>
	{/if}
	{#if right}
		<div class="section section-right">{@render right()}</div>
	{/if}
</div>
