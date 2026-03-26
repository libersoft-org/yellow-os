<script lang="ts">
	import { openWindow, defocusAll } from '../../scripts/window-store.svelte.ts';
	import { DESKTOP_COUNT, desktop } from '../../scripts/desktop.svelte.ts';
	import type { IconGridItemData } from '../IconGrid/icon-grid.ts';
	import IconGrid from '../IconGrid/IconGrid.svelte';
	import { readDirectory } from '../../scripts/opfs.ts';
	import { isLinkFile, readLink, resolveLink } from '../../scripts/link.ts';
	import type { LinkData } from '../../scripts/link.ts';
	import { ensureOpfsReady, OS_PATH } from '../../scripts/opfs-init.ts';
	import { browser } from '$app/environment';

	interface DesktopShortcut {
		id: string;
		label: string;
		icon: string;
		iconColor?: string;
		gridX: number;
		gridY: number;
		link: LinkData | null;
	}

	const { desktopId }: { desktopId?: number | undefined } = $props();
	const activeId = $derived(desktopId ?? desktop.active);
	let perDesktopShortcuts = $state<DesktopShortcut[][]>(Array.from({ length: DESKTOP_COUNT }, () => []));

	async function loadDesktopLinks(): Promise<void> {
		await ensureOpfsReady();
		try {
			const entries = await readDirectory(OS_PATH + '/Desktop');
			const linkFiles = entries.filter(e => e.type === 'file' && isLinkFile(e.name));
			const shortcuts: DesktopShortcut[] = [];
			for (let i = 0; i < linkFiles.length; i++) {
				const entry = linkFiles[i]!;
				const linkData = await readLink(OS_PATH + '/Desktop', entry.name);
				if (linkData) {
					shortcuts.push({
						id: entry.name,
						label: linkData.label,
						icon: linkData.icon,
						iconColor: '--color-accent',
						gridX: 0,
						gridY: i,
						link: linkData,
					});
				}
			}
			perDesktopShortcuts[0] = shortcuts;
		} catch {
			// Desktop folder may not exist yet
		}
	}

	if (browser) loadDesktopLinks();

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
		if (shortcut?.link) {
			const resolved = resolveLink(shortcut.link);
			if (resolved) openWindow(resolved.component, resolved.props);
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

<div class="desktop-icons" role="application" onpointerdown={defocusAll}>
	<IconGrid bind:this={iconView} items={iconViewItems} ondblclick={onDblClick} onitemsmove={onItemsMove} />
</div>
