<script lang="ts">
	import type { DiskInfo } from './filemanager';
	import IconItem from '../../components/IconItem/IconItem.svelte';
	interface Props {
		disks: DiskInfo[];
		currentPath: string;
		onnavigate: (path: string) => void;
		width?: number;
	}
	const { disks, currentPath, onnavigate, width = 180 }: Props = $props();
</script>

<style>
	.sidebar {
		flex-shrink: 0;
		overflow-y: auto;
		padding: 8px 0;
	}

	.sidebar .items {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 5px;
	}

	.sidebar .items .item {
		all: unset;
		display: flex;
		align-items: center;
		border-radius: 10px;
		padding: 6px 12px;
		width: 100%;
		box-sizing: border-box;
		cursor: pointer;
	}

	.sidebar .items .item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.sidebar .items .item.active {
		background: var(--color-accent);
	}
</style>

<div class="sidebar" style:width="{width}px">
	<div class="items">
		{#each disks as disk}
			<button class="item" class:active={currentPath === disk.path} onclick={() => onnavigate(disk.path)}>
				<IconItem icon={disk.icon} label={disk.name} subtitle="{disk.free} free of {disk.total}" layout="horizontal" iconSize="20px" iconColor={currentPath === disk.path ? '--color-bg' : '--color-accent'} color={currentPath === disk.path ? 'var(--color-bg)' : undefined} />
			</button>
		{/each}
	</div>
</div>
