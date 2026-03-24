<script lang="ts">
	import { openWindow } from '../../scripts/window-store.svelte.ts';
	import { PRODUCT_NAME, PRODUCT_VERSION } from '../../scripts/product.ts';
	import Icon from '../Icon/Icon.svelte';
	import ListItem from '../ListItem/ListItem.svelte';
	import About, { appConfig as aboutConfig } from '../../apps/About/About.svelte';
	import FileManager, { appConfig as fileManagerConfig } from '../../apps/FileManager/FileManager.svelte';
	import Calculator, { appConfig as calculatorConfig } from '../../apps/Calculator/Calculator.svelte';
	import Notepad, { appConfig as notepadConfig } from '../../apps/Notepad/Notepad.svelte';
	import Pong, { appConfig as pongConfig } from '../../apps/Pong/Pong.svelte';
	import Snake, { appConfig as snakeConfig } from '../../apps/Snake/Snake.svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	const apps = [
		{ ...aboutConfig, component: About },
		{ ...fileManagerConfig, component: FileManager },
		{ ...calculatorConfig, component: Calculator },
		{ ...notepadConfig, component: Notepad },
		{ ...pongConfig, component: Pong },
		{ ...snakeConfig, component: Snake },
	];
	let menuOpen = $state(false);

	function launchApp(app: (typeof apps)[number]): void {
		openWindow({ ...app });
		menuOpen = false;
	}

	function onClickOutside(e: PointerEvent): void {
		if (menuOpen && !(e.target as HTMLElement).closest('.taskbar-menu-area')) menuOpen = false;
	}

	function toggleMenu(): void {
		menuOpen = !menuOpen;
	}

	function launchBrand(): void {
		if (apps[0]) launchApp(apps[0]);
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
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
		overflow: hidden;
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
		color: #000;
		letter-spacing: 1px;
		white-space: nowrap;
	}

	.menu-items {
		display: flex;
		flex-direction: column;
		padding: 10px;
		flex: 1;
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
				{#each apps as app}
					<ListItem onclick={() => launchApp(app)}>
						<Icon img={app.icon} alt={app.title} size="18px" padding="0" colorVariable="--color-text" />
						<div>{app.title}</div>
					</ListItem>
				{/each}
			</div>
		</div>
	{/if}
</div>
