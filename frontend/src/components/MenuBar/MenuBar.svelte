<script lang="ts">
	import type { MenuBarMenu } from './menu-bar.ts';
	import MenuBarItem from './MenuBarItem.svelte';
	interface Props {
		menus: MenuBarMenu[];
	}
	const { menus }: Props = $props();
	let openMenuIndex = $state<number | null>(null);
	let hoverActive = $state(false);

	function handleLabelClick(index: number): void {
		if (openMenuIndex === index) {
			openMenuIndex = null;
			hoverActive = false;
		} else {
			openMenuIndex = index;
			hoverActive = true;
		}
	}

	function handleLabelEnter(index: number): void {
		if (hoverActive) openMenuIndex = index;
	}

	function handleItemClick(onclick: () => void): void {
		onclick();
		openMenuIndex = null;
		hoverActive = false;
	}

	function handleBackdropClick(e: PointerEvent): void {
		e.preventDefault();
		openMenuIndex = null;
		hoverActive = false;
	}
</script>

<style>
	.menubar {
		display: flex;
		align-items: center;
		background: var(--color-surface-2);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
		font-size: 14px;
		user-select: none;
		position: relative;
		z-index: 100;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
	}
</style>

{#if openMenuIndex !== null}
	<div class="backdrop" role="button" tabindex="-1" onpointerdown={handleBackdropClick}></div>
{/if}

<div class="menubar" role="menubar">
	{#each menus as menu, i}
		<MenuBarItem {menu} open={openMenuIndex === i} onlabelclick={() => handleLabelClick(i)} onlabelenter={() => handleLabelEnter(i)} onitemclick={handleItemClick} />
	{/each}
</div>
