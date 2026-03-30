<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from '../Icon/Icon.svelte';
	import ListItem from '../List/ListItem.svelte';
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
	let menuEl: HTMLDivElement | undefined = $state();

	function adjustPosition(node: HTMLDivElement): void {
		menuEl = node;
		const rect = node.getBoundingClientRect();
		const taskbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 0;
		const maxY = globalThis.innerHeight - taskbarHeight;
		node.style.left = `${x + rect.width > globalThis.innerWidth ? x - rect.width : x}px`;
		node.style.top = `${y + rect.height > maxY ? y - rect.height : y}px`;
	}

	function isInsideMenu(e: Event): boolean {
		return !!menuEl && menuEl.contains(e.target as Node);
	}

	function onDocumentPointerDown(e: PointerEvent): void {
		if (isInsideMenu(e)) return;
		onclose();
	}

	function onDocumentContextMenu(e: MouseEvent): void {
		if (isInsideMenu(e)) return;
		onclose();
	}

	onMount(() => {
		document.addEventListener('pointerdown', onDocumentPointerDown, true);
		document.addEventListener('contextmenu', onDocumentContextMenu, true);
	});

	onDestroy(() => {
		document.removeEventListener('pointerdown', onDocumentPointerDown, true);
		document.removeEventListener('contextmenu', onDocumentContextMenu, true);
	});

	function handleItemClick(item: ContextMenuAction, e: MouseEvent): void {
		if (item.disabled) return;
		item.onclick(e);
		onclose();
	}

	function adjustSubmenu(node: HTMLDivElement): void {
		const rect = node.getBoundingClientRect();
		const taskbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 0;
		const maxY = globalThis.innerHeight - taskbarHeight;
		if (rect.right > globalThis.innerWidth) {
			node.style.left = 'auto';
			node.style.right = '100%';
		}
		if (rect.bottom > maxY) {
			node.style.top = 'auto';
			node.style.bottom = '0';
		}
	}
</script>

<style>
	.context-menu {
		position: fixed;
		z-index: 999;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 6px;
		min-width: 180px;
		box-shadow: 0 4px 20px var(--color-shadow);
	}

	.disabled {
		opacity: 0.4;
		pointer-events: none;
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
		right: auto;
		bottom: auto;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 6px;
		min-width: 180px;
		box-shadow: 0 4px 20px var(--color-shadow);
		z-index: 1;
	}
</style>

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
					<div class="submenu" use:adjustSubmenu>
						{#each item.children as child}
							{#if isSeparator(child)}
								<ContextMenuSeparator />
							{:else if !isCategory(child)}
								<div class:disabled={child.disabled}>
									<ListItem onclick={e => handleItemClick(child, e)}>
										{#if child.icon}<Icon img={child.icon} alt={child.label} size="16px" padding="0" colorVariable="--color-text" />{/if}
										<div>{child.label}</div>
									</ListItem>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<div class:disabled={item.disabled}>
				<ListItem onclick={e => handleItemClick(item, e)}>
					{#if item.icon}<Icon img={item.icon} alt={item.label} size="16px" padding="0" colorVariable="--color-text" />{/if}
					<div>{item.label}</div>
				</ListItem>
			</div>
		{/if}
	{/each}
</div>
