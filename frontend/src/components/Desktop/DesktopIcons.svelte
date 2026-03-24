<script lang="ts">
	import type { Component } from 'svelte';
	import { openWindow, defocusAll } from '../../scripts/window-store.svelte.ts';
	import type { AppConfig } from '../../scripts/window-store.svelte.ts';
	import { DESKTOP_COUNT, desktop } from '../../scripts/desktop.svelte.ts';
	import type { IconGridItemData } from '../IconGrid/icon-grid.ts';
	import IconGrid from '../IconGrid/IconGrid.svelte';
	import FileManager, { appConfig as fileManagerConfig } from '../../apps/FileManager/FileManager.svelte';
	interface DesktopShortcut {
		id: string;
		label: string;
		icon: string;
		iconColor?: string;
		gridX: number;
		gridY: number;
		appConfig?: AppConfig;
		component?: Component;
	}
	const { desktopId }: { desktopId?: number | undefined } = $props();
	const activeId = $derived(desktopId ?? desktop.active);
	let perDesktopShortcuts = $state<DesktopShortcut[][]>(
		Array.from({ length: DESKTOP_COUNT }, (_, i) =>
			i === 0
				? [
						{ id: 'file-manager', label: fileManagerConfig.title, icon: fileManagerConfig.icon, iconColor: '--color-accent', gridX: 0, gridY: 0, appConfig: fileManagerConfig, component: FileManager },
						{ id: 'trash-can', label: 'Trash can', icon: '/img/apps/trash.svg', iconColor: '--color-text-dim', gridX: 0, gridY: 1 },
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
			label: s.label,
			iconColor: s.iconColor,
			gridX: s.gridX,
			gridY: s.gridY,
		}))
	);

	function onDblClick(item: IconGridItemData): void {
		const shortcut = shortcuts.find(s => s.id === item.id);
		if (shortcut?.appConfig && shortcut.component) {
			openWindow({ ...shortcut.appConfig, component: shortcut.component });
		}
	}

	function onItemsMove(moves: { id: string; gridX: number; gridY: number }[]): void {
		for (const move of moves) {
			const s = shortcuts.find(s => s.id === move.id);
			if (s) {
				s.gridX = move.gridX;
				s.gridY = move.gridY;
			}
		}
	}

	export function clearSelection(): void {
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
