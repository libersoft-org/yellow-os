<script lang="ts">
	import type { Component } from 'svelte';
	import { openWindow } from '../../scripts/window.svelte';
	import IconView, { type IconViewItem } from '../IconView/IconView.svelte';
	import FileManager from '../../apps/FileManager/FileManager.svelte';

	interface DesktopShortcut {
		id: string;
		name: string;
		icon: string;
		iconColor?: string;
		gridX: number;
		gridY: number;
		component?: Component;
		windowWidth?: number;
		windowHeight?: number;
	}

	let shortcuts = $state<DesktopShortcut[]>([
		{ id: 'file-manager', name: 'File Manager', icon: '/img/apps/file-manager.svg', iconColor: '--color-accent', gridX: 0, gridY: 0, component: FileManager, windowWidth: 700, windowHeight: 500 },
		{ id: 'recycle-bin', name: 'Recycle Bin', icon: '/img/apps/recycle-bin.svg', iconColor: '--color-text-dim', gridX: 0, gridY: 1 },
	]);

	let iconView: ReturnType<typeof IconView> | undefined = $state();

	const iconViewItems = $derived<IconViewItem[]>(
		shortcuts.map(s => ({
			id: s.id,
			icon: s.icon,
			label: s.name,
			iconColor: s.iconColor,
			gridX: s.gridX,
			gridY: s.gridY,
		}))
	);

	function onDblClick(item: IconViewItem) {
		const shortcut = shortcuts.find(s => s.id === item.id);
		if (shortcut?.component) {
			openWindow({
				title: shortcut.name,
				icon: shortcut.icon,
				component: shortcut.component,
				...(shortcut.windowWidth != null && { width: shortcut.windowWidth }),
				...(shortcut.windowHeight != null && { height: shortcut.windowHeight }),
			});
		}
	}

	function onItemsMove(moves: { id: string; gridX: number; gridY: number }[]) {
		for (const move of moves) {
			const s = shortcuts.find(s => s.id === move.id);
			if (s) {
				s.gridX = move.gridX;
				s.gridY = move.gridY;
			}
		}
	}

	export function clearSelection() {
		iconView?.clearSelection();
	}
</script>

<style>
	.desktop-icons {
		position: absolute;
		inset: 0;
		padding: 8px;
	}
</style>

<div class="desktop-icons">
	<IconView bind:this={iconView} items={iconViewItems} ondblclick={onDblClick} onitemsmove={onItemsMove} />
</div>
