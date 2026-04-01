<script lang="ts">
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import StorageEntryInfo from './StorageEntryInfo.svelte';
	interface Props {
		entry?: FileEntry | undefined;
		entries?: FileEntry[] | undefined;
		path?: string | undefined;
	}
	const { entry, entries, path }: Props = $props();
</script>

<style>
	.properties {
		padding: 16px;
		overflow-y: auto;
		height: 100%;
	}
</style>

<div class="properties">
	<StorageEntryInfo {entry} {entries} recursive {path} />
</div>
