<script lang="ts">
	import type { FileEntry } from './filemanager';
	import IconItem from '../../components/IconItem/IconItem.svelte';
	interface Props {
		entry: FileEntry;
		selected: boolean;
		onclick: (e: MouseEvent) => void;
		ondblclick: () => void;
	}
	const { entry, selected, onclick, ondblclick }: Props = $props();
</script>

<style>
	.item {
		padding: 8px 4px;
		border-radius: 6px;
		cursor: pointer;
	}

	.item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.item.selected {
		background: rgba(253, 221, 51, 0.15);
		outline: 1px solid var(--color-accent);
	}
</style>

<div class="item" class:selected {onclick} {ondblclick} role="button" tabindex="0" onkeydown={e => e.key === 'Enter' && ondblclick()}>
	<IconItem icon={entry.type === 'directory' ? '/img/directory.svg' : '/img/file.svg'} label={entry.name} iconSize="40px" iconColor={entry.type === 'directory' ? '--color-accent' : '--color-text-dim'} />
</div>
