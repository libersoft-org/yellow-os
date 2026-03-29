<script lang="ts">
	import Spinner from '../Spinner/Spinner.svelte';
	import { getResetState } from '../../scripts/system/factory-reset.svelte.ts';

	const resetState = getResetState();
</script>

<style>
	.reset-screen {
		z-index: 3000;
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		gap: 24px;
		background: #000;
	}

	.title {
		font-size: 28px;
		font-weight: bold;
		color: #fff;
	}

	.log {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		color: var(--color-text-dim);
		min-height: 24px;
	}

	.error {
		color: var(--color-danger);
		white-space: pre-line;
	}
</style>

<div class="reset-screen">
	<div class="title">Factory reset</div>
	<Spinner size="64px" colorVariable="--color-accent" />
	<div class="log">
		{#each resetState.lines as line}
			<div>{line}</div>
		{/each}
		{#if resetState.error}
			<div class="error">{resetState.error}</div>
		{/if}
	</div>
</div>
