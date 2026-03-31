<script lang="ts">
	import Spinner from '../Spinner/Spinner.svelte';
	import { getResetState } from '../../scripts/system/factory-reset.svelte.ts';
	const resetState = getResetState();
	let logEl: HTMLElement | undefined = $state();
	const _autoScroll = $derived.by(() => {
		const _len = resetState.lines.length;
		const el = logEl;
		if (el)
			requestAnimationFrame(() => {
				el.scrollTop = el.scrollHeight;
			});
		return _len;
	});
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
		max-height: 50vh;
		overflow-y: auto;
		width: 80%;
	}

	.error {
		color: var(--color-danger);
		white-space: pre-line;
	}

	.success {
		color: var(--color-success);
	}
</style>

<div class="reset-screen">
	<div class="title">Factory reset</div>
	<Spinner size="64px" colorVariable="--color-accent" />
	<div class="log" bind:this={logEl} data-count={_autoScroll}>
		{#each resetState.lines as line}
			<div>{line}</div>
		{/each}
		{#if resetState.success}
			<div class="success">{resetState.success}</div>
		{/if}
		{#if resetState.error}
			<div class="error">{resetState.error}</div>
		{/if}
	</div>
</div>
