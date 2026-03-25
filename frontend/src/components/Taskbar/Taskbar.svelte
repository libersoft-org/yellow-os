<script lang="ts">
	import TaskbarMenu from './TaskbarMenu.svelte';
	import TaskbarItems from './TaskbarItems.svelte';
	import TaskbarDesktops from './TaskbarDesktops.svelte';
	import TaskbarTime from './TaskbarTime.svelte';
	import { defocusAll } from '../../scripts/window-store.svelte.ts';
	const { desktopId }: { desktopId?: number | undefined } = $props();
</script>

<style>
	.taskbar {
		z-index: 99999;
		display: flex;
		align-items: center;
		gap: 5px;
		height: var(--taskbar-height);
		background: var(--color-surface);
		box-shadow: inset 0 1px 0 0 var(--color-border);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		flex-shrink: 0;
	}
</style>

<div class="taskbar" role="toolbar" tabindex="-1" onpointerdown={defocusAll}>
	<TaskbarMenu />
	<TaskbarItems {desktopId} />
	<TaskbarDesktops />
	<TaskbarTime />
</div>
