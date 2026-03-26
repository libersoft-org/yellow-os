<script lang="ts">
	import type { MenuBarMenu } from './menu-bar.ts';
	import MenuBarSubmenu from './MenuBarSubmenu.svelte';
	interface Props {
		menu: MenuBarMenu;
		open: boolean;
		onlabelclick: () => void;
		onlabelenter: () => void;
		onitemclick: (onclick: () => void) => void;
	}
	const { menu, open, onlabelclick, onlabelenter, onitemclick }: Props = $props();

	function handleLabelDown(e: PointerEvent): void {
		e.preventDefault();
		onlabelclick();
	}
</script>

<style>
	.menu-item {
		position: relative;
		z-index: 100;
	}

	.menu-label {
		padding: 4px 8px;
		border-radius: 4px;
		color: var(--color-text);
		cursor: default;
	}

	.menu-label:hover,
	.menu-label.open {
		background: var(--color-hover);
	}
</style>

<div class="menu-item">
	<div class="menu-label" class:open role="button" tabindex="-1" onpointerdown={handleLabelDown} onpointerenter={onlabelenter}>
		{menu.label}
	</div>
	{#if open}
		<MenuBarSubmenu items={menu.items} {onitemclick} />
	{/if}
</div>
