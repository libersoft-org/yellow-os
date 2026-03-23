<script lang="ts">
	import WindowManager from '../WindowManager/WindowManager.svelte';
	import Taskbar from '../Taskbar/Taskbar.svelte';
	import DesktopIcons from './DesktopIcons.svelte';
	import { defocusAll, handleKeyboardShortcut } from '../../scripts/window.svelte';
	import { DESKTOP_COUNT, desktop, switchDesktop, clearSlide } from '../../scripts/desktop.svelte';
	const sliding = $derived(desktop.slideDirection !== null && desktop.previous !== null);
	const NUMPAD_DESKTOP: Record<string, number> = {
		Numpad1: 0,
		Numpad2: 1,
		Numpad3: 2,
		Numpad4: 3,
	};
	function onDesktopPointerDown(e: PointerEvent) {
		if (e.target === e.currentTarget) defocusAll();
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.ctrlKey && e.altKey) {
			if (e.code === 'ArrowLeft') {
				e.preventDefault();
				if (desktop.active > 0) switchDesktop(desktop.active - 1);
				return;
			}
			if (e.code === 'ArrowRight') {
				e.preventDefault();
				if (desktop.active < DESKTOP_COUNT - 1) switchDesktop(desktop.active + 1);
				return;
			}
			const deskIdx = NUMPAD_DESKTOP[e.code];
			if (deskIdx !== undefined) {
				e.preventDefault();
				switchDesktop(deskIdx);
				return;
			}
		}
		handleKeyboardShortcut(e);
	}

	function onAnimationEnd(e: AnimationEvent) {
		if (e.currentTarget === e.target) clearSlide();
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
		background: url('/img/wallpapers/waves-dark.webp') center/cover no-repeat;
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

<svelte:window onkeydown={onKeyDown} />

<div class="viewport">
	{#key desktop.slideId}
		{#if sliding}
			<div class="desktop {desktop.slideDirection === 'left' ? 'leave-to-left' : 'leave-to-right'}">
				<div class="window-area" role="presentation">
					<DesktopIcons desktopId={desktop.previous!} />
					<WindowManager desktopId={desktop.previous!} />
				</div>
				<Taskbar desktopId={desktop.previous!} />
			</div>
		{/if}
	{/key}
	<div class="desktop {sliding ? (desktop.slideDirection === 'left' ? 'enter-from-right' : 'enter-from-left') : ''}" onanimationend={onAnimationEnd}>
		<div class="window-area" role="presentation" onpointerdown={onDesktopPointerDown}>
			<DesktopIcons />
			<WindowManager />
		</div>
		<Taskbar />
	</div>
</div>
