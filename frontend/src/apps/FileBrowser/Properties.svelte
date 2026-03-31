<script lang="ts">
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import EntryInfo from '../../components/EntryInfo/EntryInfo.svelte';
	interface Props {
		entry?: FileEntry | undefined;
		entries?: FileEntry[] | undefined;
	}
	const { entry, entries }: Props = $props();
</script>

<style>
	.properties {
		padding: 16px;
		overflow-y: auto;
		height: 100%;
	}
</style>

<div class="properties">
	<EntryInfo {entry} {entries} />
</div>
