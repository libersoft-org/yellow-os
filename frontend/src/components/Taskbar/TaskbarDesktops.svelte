<script lang="ts">
	import { DESKTOP_COUNT, desktop, switchDesktop } from '../../scripts/desktop.svelte';
</script>

<style>
	.desktop-switcher {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.desktop-btn {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		user-select: none;
		color: var(--color-text-dim);
		background: var(--color-fill);
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.desktop-btn:hover {
		background: var(--color-hover);
		color: var(--color-text);
	}

	.desktop-btn.active {
		background: var(--color-accent-subtle);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>

<div class="desktop-switcher">
	{#each Array(DESKTOP_COUNT) as _, i}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="desktop-btn" class:active={desktop.active === i} onpointerdown={() => switchDesktop(i)}>
			{i + 1}
		</div>
	{/each}
</div>
