<script lang="ts">
	import { settings } from '../../scripts/system/settings.svelte.ts';
	import { loadWallpapers, selectWallpaper, setDesktopTrash, setWallpaperMode, setWallpaperColor } from './settings-desktop.ts';
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

	.color-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.color-input {
		width: 60px;
		height: 36px;
		border: 2px solid var(--color-border);
		border-radius: 6px;
		padding: 2px;
		background: transparent;
		cursor: pointer;
	}

	.color-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.color-input::-webkit-color-swatch {
		border: none;
		border-radius: 4px;
	}

	.color-input::-moz-color-swatch {
		border: none;
		border-radius: 4px;
	}

	.color-label {
		font-size: 14px;
		color: var(--color-text-dim);
	}
</style>

<div class="settings-desktop">
	<SettingsTitle label="Desktop icons" />
	<SettingsOptionRow>
		<SettingsOption active={settings.desktopTrash} onclick={() => setDesktopTrash(!settings.desktopTrash)}>Trash</SettingsOption>
	</SettingsOptionRow>
	<SettingsTitle label="Wallpaper" />
	<SettingsOptionRow>
		<SettingsOption active={settings.wallpaperMode === 'image'} onclick={() => setWallpaperMode('image')}>Image</SettingsOption>
		<SettingsOption active={settings.wallpaperMode === 'color'} onclick={() => setWallpaperMode('color')}>Color</SettingsOption>
	</SettingsOptionRow>
	{#if settings.wallpaperMode === 'image'}
		<div class="wallpaper-grid">
			{#each wallpapers as wp}
				<SettingsDesktopWallpaperItem src={wp.blobUrl} label={wp.label} active={settings.wallpaper === wp.filename} onclick={() => selectWallpaper(wp.filename)} />
			{/each}
		</div>
	{:else}
		<div class="color-row">
			<input type="color" class="color-input" value={settings.wallpaperColor} oninput={e => setWallpaperColor(e.currentTarget.value)} />
			<span class="color-label">{settings.wallpaperColor}</span>
		</div>
	{/if}
</div>
