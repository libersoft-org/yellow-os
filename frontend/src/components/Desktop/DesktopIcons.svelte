<script lang="ts">
	import type { Component } from 'svelte';
	import { openWindow, defocusAll } from '../../scripts/window.svelte';
	import { DESKTOP_COUNT, desktop } from '../../scripts/desktop.svelte';
	import IconGrid, { type IconGridItemData } from '../IconGrid/IconGrid.svelte';
	import FileManager from '../../apps/FileManager/FileManager.svelte';

	const { desktopId }: { desktopId?: number | undefined } = $props();
	const activeId = $derived(desktopId ?? desktop.active);

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

	let perDesktopShortcuts = $state<DesktopShortcut[][]>(
		Array.from({ length: DESKTOP_COUNT }, (_, i) =>
			i === 0
				? [
						{ id: 'file-manager', name: 'File Manager', icon: '/img/apps/file-manager.svg', iconColor: '--color-accent', gridX: 0, gridY: 0, component: FileManager, windowWidth: 700, windowHeight: 500 },
						{ id: 'trash-can', name: 'Trash can', icon: '/img/apps/trash.svg', iconColor: '--color-text-dim', gridX: 0, gridY: 1 },
					]
				: []
		)
	);

	const shortcuts = $derived(perDesktopShortcuts[activeId] ?? []);

	let iconView: ReturnType<typeof IconGrid> | undefined = $state();

	const iconViewItems = $derived<IconGridItemData[]>(
		shortcuts.map(s => ({
			id: s.id,
			icon: s.icon,
			label: s.name,
			iconColor: s.iconColor,
			gridX: s.gridX,
			gridY: s.gridY,
		}))
	);

	function onDblClick(item: IconGridItemData) {
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="desktop-icons" onpointerdown={defocusAll}>
	<IconGrid bind:this={iconView} items={iconViewItems} ondblclick={onDblClick} onitemsmove={onItemsMove} />
</div>
