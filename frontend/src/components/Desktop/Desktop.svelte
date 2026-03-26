<script lang="ts">
	import WindowManager from '../WindowManager/WindowManager.svelte';
	import Taskbar from '../Taskbar/Taskbar.svelte';
	import DesktopIcons from './DesktopIcons.svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import { defocusAll } from '../../scripts/window-store.svelte.ts';
	import { handleKeyboardShortcut, handleKeyUp } from '../../scripts/window-shortcuts.ts';
	import { desktop, switchDesktop, clearSlide } from '../../scripts/desktop.svelte.ts';
	import { settings, settingsReady, wallpaperUrl } from '../../scripts/settings.svelte.ts';
	const wallpaperCss = $derived(wallpaperUrl.value ? `url('${wallpaperUrl.value}')` : 'none');
	const desktopCount = $derived(settingsReady.value ? settings.desktopCount : 1);
	import AppSwitcher from '../AppSwitcher/AppSwitcher.svelte';
	const sliding = $derived(desktop.slideDirection !== null && desktop.previous !== null);
	const NUMPAD_DESKTOP: Record<string, number> = {
		Numpad1: 0,
		Numpad2: 1,
		Numpad3: 2,
		Numpad4: 3,
		Numpad5: 4,
		Numpad6: 5,
		Numpad7: 6,
		Numpad8: 7,
	};
	function onDesktopPointerDown(e: PointerEvent): void {
		if (e.target === e.currentTarget) defocusAll();
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (e.ctrlKey && e.altKey) {
			if (e.code === 'ArrowLeft') {
				e.preventDefault();
				if (desktop.active > 0) switchDesktop(desktop.active - 1);
				return;
			}
			if (e.code === 'ArrowRight') {
				e.preventDefault();
				if (desktop.active < desktopCount - 1) switchDesktop(desktop.active + 1);
				return;
			}
			const deskIdx = NUMPAD_DESKTOP[e.code];
			if (deskIdx !== undefined && deskIdx < desktopCount) {
				e.preventDefault();
				switchDesktop(deskIdx);
				return;
			}
		}
		handleKeyboardShortcut(e);
	}

	function onAnimationEnd(e: AnimationEvent): void {
		if (e.currentTarget === e.target) clearSlide();
	}

	let contextMenu = $state<{ x: number; y: number } | null>(null);

	const desktopMenuItems = [
		{ icon: '/img/file.svg', label: 'New file', onclick: () => {} },
		{ icon: '/img/directory.svg', label: 'New folder', onclick: () => {} },
		{ icon: '/img/settings.svg', label: 'Settings', onclick: () => {} },
	];

	function onContextMenu(e: MouseEvent): void {
		if ((e.target as HTMLElement).closest('.window')) return;
		e.preventDefault();
		contextMenu = { x: e.clientX, y: e.clientY };
	}
</script>

<style>
	.viewport {
		width: 100vw;
		height: 100dvh;
		overflow: hidden;
		position: relative;
		background: #000;
	}

	.desktop {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		background: center/cover no-repeat;
	}

	.desktop.enter-from-right {
		animation: enter-right 0.3s ease forwards;
	}

	.desktop.enter-from-left {
		animation: enter-left 0.3s ease forwards;
	}

	.desktop.leave-to-left {
		animation: leave-left 0.3s ease forwards;
	}

	.desktop.leave-to-right {
		animation: leave-right 0.3s ease forwards;
	}

	.window-area {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	@keyframes enter-right {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes enter-left {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes leave-left {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-100%);
		}
	}

	@keyframes leave-right {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(100%);
		}
	}
</style>

<svelte:window onkeydown={onKeyDown} onkeyup={handleKeyUp} />

<div class="viewport">
	{#key desktop.slideId}
		{#if sliding}
			<div class="desktop {desktop.slideDirection === 'left' ? 'leave-to-left' : 'leave-to-right'}" style:background-image={wallpaperCss}>
				<div class="window-area" role="presentation">
					<DesktopIcons desktopId={desktop.previous!} />
					<WindowManager desktopId={desktop.previous!} />
				</div>
				<Taskbar desktopId={desktop.previous!} />
			</div>
		{/if}
	{/key}
	<div class="desktop {sliding ? (desktop.slideDirection === 'left' ? 'enter-from-right' : 'enter-from-left') : ''}" style:background-image={wallpaperCss} onanimationend={onAnimationEnd}>
		<div class="window-area" role="presentation" onpointerdown={onDesktopPointerDown} oncontextmenu={onContextMenu}>
			<DesktopIcons />
			<WindowManager />
		</div>
		<Taskbar />
	</div>
	{#if contextMenu}
		<ContextMenu items={desktopMenuItems} x={contextMenu.x} y={contextMenu.y} onclose={() => (contextMenu = null)} />
	{/if}
	<AppSwitcher />
</div>
