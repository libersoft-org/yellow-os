<script lang="ts">
	import { openWindow } from '../../scripts/window-store.svelte.ts';
	import { PRODUCT_NAME, PRODUCT_VERSION } from '../../scripts/product.ts';
	import Icon from '../Icon/Icon.svelte';
	import ListItem from '../ListItem/ListItem.svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	import { readDirectory } from '../../scripts/opfs.ts';
	import { isLinkFile, readLink, resolveLink } from '../../scripts/link.ts';
	import type { LinkData } from '../../scripts/link.ts';
	import { ensureOpfsReady, OS_PATH } from '../../scripts/opfs-init.ts';
	import { browser } from '$app/environment';

	interface MenuApp {
		label: string;
		icon: string;
		link: LinkData;
	}
	interface MenuCategory {
		label: string;
		icon: string;
		items: MenuApp[];
	}
	type MenuItem = MenuApp | MenuCategory;

	function isCategory(item: MenuItem): item is MenuCategory {
		return 'items' in item;
	}

	let menuItems = $state<MenuItem[]>([]);

	async function loadMenuItems(): Promise<void> {
		await ensureOpfsReady();
		try {
			const entries = await readDirectory(OS_PATH + '/TaskbarMenu');
			const categories: MenuCategory[] = [];
			const apps: MenuApp[] = [];
			for (const entry of entries) {
				if (entry.type === 'directory') {
					const subEntries = await readDirectory(OS_PATH + '/TaskbarMenu/' + entry.name);
					const subItems: MenuApp[] = [];
					for (const sub of subEntries) {
						if (sub.type === 'file' && isLinkFile(sub.name)) {
							const linkData = await readLink(OS_PATH + '/TaskbarMenu/' + entry.name, sub.name);
							if (linkData) subItems.push({ label: linkData.label, icon: linkData.icon, link: linkData });
						}
					}
					if (subItems.length > 0) {
						subItems.sort((a, b) => a.label.localeCompare(b.label));
						categories.push({ label: entry.name, icon: '/img/directory.svg', items: subItems });
					}
				} else if (isLinkFile(entry.name)) {
					const linkData = await readLink(OS_PATH + '/TaskbarMenu', entry.name);
					if (linkData) apps.push({ label: linkData.label, icon: linkData.icon, link: linkData });
				}
			}
			categories.sort((a, b) => a.label.localeCompare(b.label));
			apps.sort((a, b) => a.label.localeCompare(b.label));
			menuItems = [...categories, ...apps];
		} catch {
			menuItems = [];
		}
	}

	if (browser) loadMenuItems();

	let menuOpen = $state(false);
	let openCategory = $state<string | null>(null);

	function launchApp(item: MenuApp): void {
		const resolved = resolveLink(item.link);
		if (resolved) openWindow(resolved.component, resolved.props);
		menuOpen = false;
		openCategory = null;
	}

	function onClickOutside(e: MouseEvent): void {
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
		const resolved = resolveLink({ appId: 'about', label: 'About', icon: '/img/logo.svg' });
		if (resolved) openWindow(resolved.component, resolved.props);
		menuOpen = false;
		openCategory = null;
	}

	function onCategoryHover(e: PointerEvent, label: string | null): void {
		if (e.pointerType === 'mouse') openCategory = label;
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

<svelte:window onclick={onClickOutside} />

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
						<div
							class="category-item"
							role="menuitem"
							tabindex="-1"
						onpointerenter={e => onCategoryHover(e, item.label)}
						onpointerleave={e => onCategoryHover(e, null)}
						>
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
