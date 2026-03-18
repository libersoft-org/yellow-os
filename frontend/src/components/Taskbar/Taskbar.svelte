<script lang="ts">
	import TaskbarMenu from './TaskbarMenu.svelte';
	import TaskbarItems from './TaskbarItems.svelte';
	import TaskbarTime from './TaskbarTime.svelte';
</script>

<style>
	.taskbar {
		height: var(--taskbar-height);
		background: var(--color-surface);
		border-top: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		/*padding: 0 12px;*/
		flex-shrink: 0;
		z-index: 99999;
	}
</style>

<div class="taskbar">
	<TaskbarMenu />
	<TaskbarItems />
	<TaskbarTime />
</div>
