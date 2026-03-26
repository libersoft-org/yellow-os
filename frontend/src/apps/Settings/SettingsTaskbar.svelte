<script lang="ts">
	import { settings } from '../../scripts/settings.svelte.ts';
	import { setDesktopCount, setTaskbarShowText } from './settings-taskbar.ts';
	import SettingsTitle from './components/SettingsTitle.svelte';
	import SettingsOptionRow from './components/SettingsOptionRow.svelte';
	import SettingsOption from './components/SettingsOption.svelte';
</script>

<style>
	.settings-taskbar {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>

<div class="settings-taskbar">
	<SettingsTitle label="Number of desktops" />
	<SettingsOptionRow>
		{#each [1, 2, 3, 4, 5, 6, 7, 8] as count}
			<SettingsOption active={settings.desktopCount === count} onclick={() => setDesktopCount(count)}>{count}</SettingsOption>
		{/each}
	</SettingsOptionRow>
	<SettingsTitle label="Task buttons" />
	<SettingsOptionRow>
		<SettingsOption active={settings.taskbarShowText} onclick={() => setTaskbarShowText(true)}>Icon and text</SettingsOption>
		<SettingsOption active={!settings.taskbarShowText} onclick={() => setTaskbarShowText(false)}>Icon only</SettingsOption>
	</SettingsOptionRow>
</div>
