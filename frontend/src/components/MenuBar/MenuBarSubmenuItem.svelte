<script lang="ts">
	import type { MenuBarAction } from './menu-bar.ts';
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		item: MenuBarAction;
		onclick: () => void;
	}
	const { item, onclick }: Props = $props();

	function handlePointerdown(e: PointerEvent): void {
		e.preventDefault();
		onclick();
	}
</script>

<style>
	.submenu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 5px 12px;
		border-radius: 5px;
		color: var(--color-text);
		cursor: default;
		white-space: nowrap;
	}

	.submenu-item:hover:not(.disabled) {
		background: var(--color-accent);
		color: var(--color-surface);
	}

	.submenu-item.disabled {
		color: var(--color-text-dim);
		pointer-events: none;
	}

	.shortcut {
		margin-left: 24px;
		font-size: 11px;
		color: var(--color-text-dim);
	}

	.submenu-item:hover:not(.disabled) .shortcut {
		color: var(--color-surface);
	}

	.check {
		width: 16px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.submenu-item:hover:not(.disabled) .check :global(img) {
		filter: none !important;
	}

	.label-group {
		display: flex;
		align-items: center;
		gap: 6px;
	}
</style>

<div class="submenu-item" class:disabled={item.disabled === true} role="menuitem" tabindex="-1" onpointerdown={handlePointerdown}>
	<span class="label-group">
		<span class="check">
			{#if item.checked === true}
				<Icon img="/img/check.svg" size="12px" padding="0" colorVariable="--color-text" />
			{/if}
		</span>
		{item.label}
	</span>
	{#if item.shortcut}
		<span class="shortcut">{item.shortcut}</span>
	{/if}
</div>
