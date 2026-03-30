<script lang="ts">
	import { defocusAll, openWindow } from '../../scripts/window/window-store.svelte.ts';
	import { OS_PATH } from '../../scripts/fs/opfs-init.ts';
	import { getAppComponent } from '../../scripts/system/app-registry.ts';
	import DirectoryView from '../DirectoryView/DirectoryView.svelte';
	import type { ContextMenuItem } from '../ContextMenu/context-menu.ts';
	const DESKTOP_PATH = OS_PATH + '/Desktop';
	interface Props {
		desktopId?: number | undefined;
	}
	const {}: Props = $props();
	const extraMenuItems: ContextMenuItem[] = [
		{ separator: true },
		{
			icon: '/img/settings.svg',
			label: 'Settings',
			onclick: () => {
				const c = getAppComponent('settings');
				if (c) openWindow(c);
			},
		},
	];
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
		outline: none;
	}
</style>

<div class="desktop-icons" role="group" onpointerdown={defocusAll}>
	<DirectoryView bind:this={directoryView} path={DESKTOP_PATH} columnFirst hideLinkExtension hideEmptyLabel extraEmptySpaceMenuItems={extraMenuItems} onitemsmove={onItemsMove} />
</div>
