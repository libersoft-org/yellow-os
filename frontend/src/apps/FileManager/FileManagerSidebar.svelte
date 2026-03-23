<script lang="ts">
	import type { DiskInfo } from './filemanager.ts';
	import IconGridItem from '../../components/IconGrid/IconGridItem.svelte';
	import Clickable from '../../components/Clickable/Clickable.svelte';
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

	.item {
		display: flex;
		align-items: center;
		border-radius: 10px;
		padding: 6px 12px;
		width: 100%;
		box-sizing: border-box;
	}

	.item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.item.active {
		background: var(--color-accent);
	}
</style>

<div class="sidebar" style:width="{width}px">
	<div class="items">
		{#each disks as disk}
			<Clickable onclick={() => onnavigate(disk.path)}>
				<div class="item" class:active={currentPath === disk.path}>
					<IconGridItem icon={disk.icon} label={disk.name} subtitle="{disk.free} free of {disk.total}" layout="horizontal" iconSize="20px" iconColor={currentPath === disk.path ? '--color-bg' : '--color-accent'} color={currentPath === disk.path ? 'var(--color-bg)' : undefined} />
				</div>
			</Clickable>
		{/each}
	</div>
</div>
