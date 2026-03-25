<script lang="ts">
	import type { Component } from 'svelte';
	import { openWindow } from '../../scripts/window-store.svelte.ts';
	import { PRODUCT_NAME, PRODUCT_VERSION } from '../../scripts/product.ts';
	import Icon from '../Icon/Icon.svelte';
	import ListItem from '../ListItem/ListItem.svelte';
	import About from '../../apps/About/About.svelte';
	import FileManager from '../../apps/FileManager/FileManager.svelte';
	import Calculator from '../../apps/Calculator/Calculator.svelte';
	import Notepad from '../../apps/Notepad/Notepad.svelte';
	import Pong from '../../apps/Pong/Pong.svelte';
	import Snake from '../../apps/Snake/Snake.svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	interface MenuApp {
		label: string;
		icon: string;
		component: Component;
	}
	interface MenuCategory {
		label: string;
		icon: string;
		items: MenuItem[];
	}
	type MenuItem = MenuApp | MenuCategory;

	function isCategory(item: MenuItem): item is MenuCategory {
		return 'items' in item;
	}

	const menuItems: MenuItem[] = [
		{
			label: 'Programs',
			icon: '/img/directory.svg',
			items: [
				{ label: 'File Manager', icon: '/img/apps/file-manager.svg', component: FileManager },
				{ label: 'Calculator', icon: '/img/apps/calculator.svg', component: Calculator },
				{ label: 'Notepad', icon: '/img/apps/notepad.svg', component: Notepad },
			],
		},
		{
			label: 'Games',
			icon: '/img/directory.svg',
			items: [
				{ label: 'Pong', icon: '/img/apps/pong.svg', component: Pong },
				{ label: 'Snake', icon: '/img/apps/snake.svg', component: Snake },
			],
		},
		{ label: `About ${PRODUCT_NAME}`, icon: '/img/logo.svg', component: About },
	];
	let menuOpen = $state(false);
	let openCategory = $state<string | null>(null);

	function launchApp(item: MenuApp): void {
		openWindow(item.component);
		menuOpen = false;
		openCategory = null;
	}

	function onClickOutside(e: PointerEvent): void {
		if (menuOpen && !(e.target as HTMLElement).closest('.taskbar-menu-area')) {
			menuOpen = false;
			openCategory = null;
		}
	}

	function toggleMenu(): void {
		menuOpen = !menuOpen;
		if (!menuOpen) openCategory = null;
	}

	function launchBrand(): void {
		openWindow(About);
		menuOpen = false;
		openCategory = null;
	}
</script>

<style>
	.taskbar-menu-area {
		position: relative;
	}

	.menu-btn {
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		width: var(--taskbar-height);
		height: var(--taskbar-height);
	}

	.menu-btn:hover {
		opacity: 0.8;
	}

	.menu-popup {
		position: fixed;
		bottom: var(--taskbar-height);
		left: 0;
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		border-right: 1px solid var(--color-border);
		border-radius: 0 10px 0 0;
		padding: 0;
		display: flex;
		min-width: 220px;
		box-shadow: 0 -4px 20px var(--color-shadow);
	}

	.menu-brand {
		width: 32px;
		height: 100%;
		background: var(--color-accent);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 5px;
		flex-shrink: 0;
	}
	.menu-brand span {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		font-size: 14px;
		font-weight: bold;
		color: var(--color-accent-fg);
		letter-spacing: 1px;
		white-space: nowrap;
	}

	.menu-items {
		display: flex;
		flex-direction: column;
		padding: 10px;
		flex: 1;
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
		bottom: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 10px;
		min-width: 200px;
		box-shadow: 0 -4px 20px var(--color-shadow);
		z-index: 1;
	}
</style>

<svelte:window onpointerdown={onClickOutside} />

<div class="taskbar-menu-area">
	<Clickable onclick={toggleMenu}>
		<div class="menu-btn">
			<Icon img="/img/logo.svg" alt={PRODUCT_NAME} size="calc(var(--taskbar-height) * 0.6)" padding="calc(var(--taskbar-height) * 0.2)" colorVariable="--color-accent" />
		</div>
	</Clickable>
	{#if menuOpen}
		<div class="menu-popup">
			<Clickable onclick={launchBrand} style="align-self: stretch">
				<div class="menu-brand"><span>{PRODUCT_NAME} {PRODUCT_VERSION}</span></div>
			</Clickable>
			<div class="menu-items">
				{#each menuItems as item}
					{#if isCategory(item)}
						<div class="category-item" role="menuitem" tabindex="-1" onpointerenter={() => (openCategory = item.label)} onpointerleave={() => (openCategory = null)}>
							<ListItem onclick={() => (openCategory = openCategory === item.label ? null : item.label)}>
								<Icon img={item.icon} alt={item.label} size="18px" padding="0" colorVariable="--color-text" />
								<div class="category-label">
									{item.label}
									<Icon img="/img/caret-right.svg" alt="" size="10px" padding="0" colorVariable="--color-text" />
								</div>
							</ListItem>
							{#if openCategory === item.label}
								<div class="submenu">
									{#each item.items as subItem}
										{#if !isCategory(subItem)}
											<ListItem onclick={() => launchApp(subItem)}>
												<Icon img={subItem.icon} alt={subItem.label} size="18px" padding="0" colorVariable="--color-text" />
												<div>{subItem.label}</div>
											</ListItem>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<ListItem onclick={() => launchApp(item)}>
							<Icon img={item.icon} alt={item.label} size="18px" padding="0" colorVariable="--color-text" />
							<div>{item.label}</div>
						</ListItem>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
