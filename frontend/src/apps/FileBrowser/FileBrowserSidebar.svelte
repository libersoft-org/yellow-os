<script lang="ts">
	import type { DiskInfo } from './filebrowser.ts';
	import { formatBytes } from '../../scripts/format.ts';
	import IconGridItem from '../../components/IconGrid/IconGridItem.svelte';
	import ListItem from '../../components/ListItem/ListItem.svelte';
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
</style>

<div class="sidebar" style:width="{width}px">
	<div class="items">
		{#each disks as disk}
			<ListItem onclick={() => onnavigate(disk.path)} active={currentPath === disk.path || currentPath.startsWith(disk.path === '/' ? '/' : disk.path + '/')}>
				<IconGridItem icon={disk.icon} label={disk.name} subtitle="{formatBytes(disk.free)} free of {formatBytes(disk.total)}" layout="horizontal" iconSize="20px" iconColor="--color-accent" />
			</ListItem>
		{/each}
	</div>
</div>
