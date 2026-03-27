<script lang="ts">
	import { defocusAll } from '../../scripts/window-store.svelte.ts';
	import { OS_PATH } from '../../scripts/opfs-init.ts';
	import DirectoryView from '../DirectoryView/DirectoryView.svelte';
	import type { ContextMenuItem } from '../ContextMenu/context-menu.ts';
	const DESKTOP_PATH = OS_PATH + '/Desktop';
	interface Props {
		desktopId?: number | undefined;
	}
	const {}: Props = $props();
	const extraMenuItems: ContextMenuItem[] = [{ separator: true }, { icon: '/img/settings.svg', label: 'Settings', onclick: () => {} }];
	let directoryView = $state<DirectoryView>();

	function onItemsMove(_moves: { id: string; gridX: number; gridY: number }[]): void {
		// TODO: persist desktop icon positions
	}

	export function clearSelection(): void {
		directoryView?.clearSelection();
	}
</script>

<style>
	.desktop-icons {
		position: absolute;
		inset: 0;
		padding: 8px;
		outline: none;
	}
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="desktop-icons" onpointerdown={defocusAll}>
	<DirectoryView bind:this={directoryView} path={DESKTOP_PATH} columnFirst hideLinkExtension hideEmptyLabel extraEmptySpaceMenuItems={extraMenuItems} onitemsmove={onItemsMove} />
</div>
