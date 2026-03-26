<script lang="ts">
	import type { MenuBarSubmenuEntry } from './menu-bar.ts';
	import MenuBarSubmenuItem from './MenuBarSubmenuItem.svelte';
	import MenuBarSubmenuSeparator from './MenuBarSubmenuSeparator.svelte';
	interface Props {
		items: MenuBarSubmenuEntry[];
		onitemclick: (onclick: () => void) => void;
	}
	const { items, onitemclick }: Props = $props();
</script>

<style>
	.submenu {
		position: absolute;
		top: 100%;
		left: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 4px;
		min-width: 200px;
		box-shadow: 0 4px 20px var(--color-shadow);
		z-index: 100;
	}
</style>

<div class="submenu" role="menu">
	{#each items as item}
		{#if 'separator' in item}
			<MenuBarSubmenuSeparator />
		{:else}
			<MenuBarSubmenuItem {item} onclick={() => onitemclick(item.onclick)} />
		{/if}
	{/each}
</div>
