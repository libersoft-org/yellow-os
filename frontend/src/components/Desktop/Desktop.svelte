<script lang="ts">
	import WindowManager from '../WindowManager/WindowManager.svelte';
	import Taskbar from '../Taskbar/Taskbar.svelte';
	import DesktopIcons from './DesktopIcons.svelte';
	import { defocusAll, handleKeyboardShortcut } from '../../scripts/window.svelte';

	let desktopIcons: ReturnType<typeof DesktopIcons> | undefined = $state();

	function onDesktopPointerDown(e: PointerEvent) {
		if (e.target === e.currentTarget) {
			defocusAll();
			desktopIcons?.clearSelection();
		}
	}
</script>

<style>
	.desktop {
		width: 100vw;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: url('/img/wallpapers/waves-dark.webp') center/cover no-repeat;
	}

	.window-area {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
</style>

<svelte:window onkeydown={handleKeyboardShortcut} />

<div class="desktop">
	<div class="window-area" role="presentation" onpointerdown={onDesktopPointerDown}>
		<DesktopIcons bind:this={desktopIcons} />
		<WindowManager />
	</div>
	<Taskbar />
</div>
