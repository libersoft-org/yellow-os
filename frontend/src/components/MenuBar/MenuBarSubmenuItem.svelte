<script lang="ts">
	import type { MenuBarAction } from './menu-bar.ts';
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
</style>

<div class="submenu-item" class:disabled={item.disabled === true} role="menuitem" tabindex="-1" onpointerdown={handlePointerdown}>
	<span>{item.label}</span>
	{#if item.shortcut}
		<span class="shortcut">{item.shortcut}</span>
	{/if}
</div>
