<script lang="ts">
	import Icon from '../Icon/Icon.svelte';
	import ListItem from '../ListItem/ListItem.svelte';
	import ContextMenuSeparator from './ContextMenuSeparator.svelte';
	import { isSeparator, isCategory, type ContextMenuItem, type ContextMenuAction } from './context-menu.ts';
	interface Props {
		items: ContextMenuItem[];
		x: number;
		y: number;
		onclose: () => void;
	}
	const { items, x, y, onclose }: Props = $props();
	let openCategory: string | null = $state(null);

	function adjustPosition(node: HTMLDivElement): void {
		const rect = node.getBoundingClientRect();
		const taskbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 0;
		const maxY = globalThis.innerHeight - taskbarHeight;
		node.style.left = `${x + rect.width > globalThis.innerWidth ? x - rect.width : x}px`;
		node.style.top = `${y + rect.height > maxY ? y - rect.height : y}px`;
	}

	function handlePointerDown(e: PointerEvent): void {
		if (!(e.target as HTMLElement).closest('.context-menu')) onclose();
	}

	function handleContextMenu(e: MouseEvent): void {
		e.preventDefault();
		onclose();
	}

	function handleItemClick(item: ContextMenuAction, e: MouseEvent): void {
		item.onclick(e);
		onclose();
	}
</script>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 999;
	}

	.context-menu {
		position: fixed;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 6px;
		min-width: 180px;
		box-shadow: 0 4px 20px var(--color-shadow);
	}

	.category-item {
		position: relative;
	}

	.category-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.submenu {
		position: absolute;
		left: 100%;
		top: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 6px;
		min-width: 180px;
		box-shadow: 0 4px 20px var(--color-shadow);
		z-index: 1;
	}
</style>

<div class="backdrop" role="none" onpointerdown={handlePointerDown} oncontextmenu={handleContextMenu}>
	<div class="context-menu" use:adjustPosition style:left="{x}px" style:top="{y}px">
		{#each items as item}
			{#if isSeparator(item)}
				<ContextMenuSeparator />
			{:else if isCategory(item)}
				<div class="category-item" role="menuitem" tabindex="-1" onpointerenter={() => (openCategory = item.label)} onpointerleave={() => (openCategory = null)}>
					<ListItem onclick={() => (openCategory = openCategory === item.label ? null : item.label)}>
						{#if item.icon}<Icon img={item.icon} alt={item.label} size="16px" padding="0" colorVariable="--color-text" />{/if}
						<div class="category-label">
							{item.label}
							<Icon img="/img/caret-right.svg" alt="" size="10px" padding="0" colorVariable="--color-text" />
						</div>
					</ListItem>
					{#if openCategory === item.label}
						<div class="submenu">
							{#each item.children as child}
								{#if isSeparator(child)}
									<ContextMenuSeparator />
								{:else if !isCategory(child)}
									<ListItem onclick={e => handleItemClick(child, e)}>
										{#if child.icon}<Icon img={child.icon} alt={child.label} size="16px" padding="0" colorVariable="--color-text" />{/if}
										<div>{child.label}</div>
									</ListItem>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<ListItem onclick={e => handleItemClick(item, e)}>
					{#if item.icon}<Icon img={item.icon} alt={item.label} size="16px" padding="0" colorVariable="--color-text" />{/if}
					<div>{item.label}</div>
				</ListItem>
			{/if}
		{/each}
	</div>
</div>
