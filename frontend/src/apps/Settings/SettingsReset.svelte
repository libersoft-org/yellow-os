<script lang="ts">
	import { factoryReset } from './settings-reset.ts';
	import Button from '../../components/Button/Button.svelte';
	import SettingsTitle from './components/SettingsTitle.svelte';
	import SettingsDescription from './components/SettingsDescription.svelte';
</script>

<SettingsTitle label="Factory reset" />
<SettingsDescription text="This will erase all data including files, settings and cache. The system will be restored to its default state." />
<Button variant="danger" onclick={factoryReset}>Factory Reset</Button>
