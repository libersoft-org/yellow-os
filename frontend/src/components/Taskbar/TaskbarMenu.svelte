<script lang="ts">
	import { openWindow } from '../../scripts/window.svelte';
	import { PRODUCT_NAME, PRODUCT_VERSION } from '../../scripts/product';
	import Icon from '../Icon/Icon.svelte';
	import TaskbarMenuItem from './TaskbarMenuItem.svelte';
	import Calculator from '../../apps/Calculator/Calculator.svelte';
	import FileManager from '../../apps/FileManager/FileManager.svelte';
	import Notepad from '../../apps/Notepad/Notepad.svelte';
	import Pong from '../../apps/Pong/Pong.svelte';
	import Snake from '../../apps/Snake/Snake.svelte';
	import About from '../../apps/About/About.svelte';
	const apps = [
		{ name: 'About Yellow OS', icon: '/img/logo.svg', component: About, width: 480, height: 340 },
		{ name: 'File Manager', icon: '/img/apps/file-manager.svg', component: FileManager, width: 700, height: 500 },
		{ name: 'Calculator', icon: '/img/apps/calculator.svg', component: Calculator, width: 280, height: 420 },
		{ name: 'Notepad', icon: '/img/apps/notepad.svg', component: Notepad, width: 600, height: 450 },
		{ name: 'Pong', icon: '/img/apps/pong.svg', component: Pong, width: 600, height: 420 },
		{ name: 'Snake', icon: '/img/apps/snake.svg', component: Snake, width: 500, height: 500 },
	];
	let menuOpen = $state(false);

	function launchApp(app: (typeof apps)[number]) {
		openWindow({ title: app.name, icon: app.icon, component: app.component, width: app.width, height: app.height });
		menuOpen = false;
	}

	function onClickOutside(e: PointerEvent) {
		if (menuOpen && !(e.target as HTMLElement).closest('.taskbar-menu-area')) menuOpen = false;
	}
</script>

<style>
	.taskbar-menu-area {
		position: relative;
	}

	.menu-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
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
		background: var(--color-accent);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 5px;
		flex-shrink: 0;
		cursor: pointer;
		border: none;
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
	<button class="menu-btn" onclick={() => (menuOpen = !menuOpen)}>
		<Icon img="/img/logo.svg" alt={PRODUCT_NAME} size="24px" padding="10px" colorVariable="--color-accent" />
	</button>
	{#if menuOpen}
		<div class="menu-popup">
			<button
				class="menu-brand"
				onclick={() => {
					if (apps[0]) launchApp(apps[0]);
				}}><span>{PRODUCT_NAME} {PRODUCT_VERSION}</span></button
			>
			<div class="menu-items">
				{#each apps as app}
					<TaskbarMenuItem icon={app.icon} name={app.name} onclick={() => launchApp(app)} />
				{/each}
			</div>
		</div>
	{/if}
</div>
