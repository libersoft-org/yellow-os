<script lang="ts">
	import Desktop from '../components/Desktop/Desktop.svelte';
	import LoadingScreen from '../components/LoadingScreen/LoadingScreen.svelte';
	import { settingsReady } from '../scripts/settings.svelte.ts';
</script>

{#if !settingsReady.value}
	<LoadingScreen />
{/if}
<Desktop />
