<script lang="ts">
	import { appSwitcher } from '../../scripts/system/app-switcher.svelte.ts';
	import Icon from '../Icon/Icon.svelte';
</script>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
	}

	.switcher {
		display: flex;
		gap: 8px;
		padding: 16px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		box-shadow: 0 8px 32px var(--color-shadow);
		max-width: 80vw;
		overflow-x: auto;
	}

	.item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px;
		border-radius: 8px;
		min-width: 80px;
		max-width: 120px;
		cursor: default;
		transition: background 0.15s;
	}

	.item:hover {
		background: var(--color-hover);
	}

	.item.selected {
		background: var(--color-accent);
	}

	.label {
		font-size: 11px;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
		color: var(--color-text);
	}

	.item.selected .label {
		color: var(--color-accent-fg);
	}
</style>

{#if appSwitcher.open}
	<div class="overlay">
		<div class="switcher">
			{#each appSwitcher.windows as win, i}
				<div class="item" class:selected={i === appSwitcher.selectedIndex}>
					<Icon img={win.icon || '/img/file.svg'} alt={win.title} size="48px" padding="0" colorVariable={i === appSwitcher.selectedIndex ? '--color-accent-fg' : '--color-text'} />
					<div class="label">{win.title || 'Untitled'}</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
