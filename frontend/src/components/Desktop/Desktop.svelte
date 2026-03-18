<script lang="ts">
	import WindowManager from '../WindowManager/WindowManager.svelte';
	import Taskbar from '../Taskbar/Taskbar.svelte';
	import { defocusAll, handleKeyboardShortcut } from '../../scripts/window.svelte';

	function onDesktopPointerDown(e: PointerEvent) {
		if (e.target === e.currentTarget) defocusAll();
	}
</script>

<style>
	.desktop {
		width: 100vw;
		height: 100vh;
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
		<WindowManager />
	</div>
	<Taskbar />
</div>
