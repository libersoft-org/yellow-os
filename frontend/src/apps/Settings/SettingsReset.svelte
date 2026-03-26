<script lang="ts">
	import { confirmFactoryReset } from './settings-reset.ts';
	import Button from '../../components/Button/Button.svelte';
	import SettingsTitle from './components/SettingsTitle.svelte';
	import SettingsDescription from './components/SettingsDescription.svelte';
</script>

<style>
	.settings-reset {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>

<div class="settings-reset">
	<SettingsTitle label="Factory reset" />
	<SettingsDescription text="This will erase all data including files, settings and cache. The system will be restored to its default state." />
	<Button backgroundColorVariable="--color-danger" onclick={confirmFactoryReset}>Factory reset</Button>
</div>
