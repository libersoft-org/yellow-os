<script lang="ts">
	import Desktop from '../components/Desktop/Desktop.svelte';
	import DragOverlay from '../components/DragOverlay/DragOverlay.svelte';
	import LoadingScreen from '../components/LoadingScreen/LoadingScreen.svelte';
	import Dialog from '../components/Dialog/Dialog.svelte';
	import { registerDialogComponent } from '../scripts/ui/dialog.ts';
	import { settingsReady } from '../scripts/system/settings.svelte.ts';
	registerDialogComponent(Dialog);
</script>

{#if !settingsReady.value}
	<LoadingScreen />
{/if}
<Desktop />
<DragOverlay />
