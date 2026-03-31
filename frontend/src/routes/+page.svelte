<script lang="ts">
	import Desktop from '../components/Desktop/Desktop.svelte';
	import DragOverlay from '../components/DragOverlay/DragOverlay.svelte';
	import LoadingScreen from '../components/LoadingScreen/LoadingScreen.svelte';
	import ResetScreen from '../components/ResetScreen/ResetScreen.svelte';
	import Dialog from '../components/Dialog/Dialog.svelte';
	import ConflictDialog from '../components/ConflictDialog/ConflictDialog.svelte';
	import ProgressDialog from '../components/ProgressDialog/ProgressDialog.svelte';
	import { registerDialogComponent } from '../scripts/ui/dialog.ts';
	import { registerConflictDialog } from '../scripts/fs/file-conflict.ts';
	import { registerProgressDialog } from '../scripts/fs/file-progress.svelte.ts';
	import { settingsReady } from '../scripts/system/settings.svelte.ts';
	import { getResetState } from '../scripts/system/factory-reset.svelte.ts';
	registerDialogComponent(Dialog);
	registerConflictDialog(ConflictDialog);
	registerProgressDialog(ProgressDialog);
	const resetState = getResetState();
</script>

{#if resetState.active}
	<ResetScreen />
{:else if !settingsReady.value}
	<LoadingScreen />
{/if}
<Desktop />
<DragOverlay />
