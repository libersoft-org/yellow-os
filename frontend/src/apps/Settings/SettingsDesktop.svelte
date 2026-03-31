<script lang="ts">
	import { settings } from '../../scripts/system/settings.svelte.ts';
	import { loadWallpapers, selectWallpaper, setDesktopTrash } from './settings-desktop.ts';
	import type { WallpaperItem } from './settings-desktop.ts';
	import SettingsTitle from './components/SettingsTitle.svelte';
	import SettingsDesktopWallpaperItem from './components/SettingsDesktopWallpaperItem.svelte';
	import SettingsOptionRow from './components/SettingsOptionRow.svelte';
	import SettingsOption from './components/SettingsOption.svelte';
	let wallpapers = $state<WallpaperItem[]>([]);

	loadWallpapers().then(items => {
		wallpapers = items;
	});
</script>

<style>
	.settings-desktop {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.wallpaper-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 10px;
	}
</style>

<div class="settings-desktop">
	<SettingsTitle label="Desktop icons" />
	<SettingsOptionRow>
		<SettingsOption active={settings.desktopTrash} onclick={() => setDesktopTrash(!settings.desktopTrash)}>Trash</SettingsOption>
	</SettingsOptionRow>
	<SettingsTitle label="Wallpaper" />
	<div class="wallpaper-grid">
		{#each wallpapers as wp}
			<SettingsDesktopWallpaperItem src={wp.blobUrl} label={wp.label} active={settings.wallpaper === wp.filename} onclick={() => selectWallpaper(wp.filename)} />
		{/each}
	</div>
</div>
