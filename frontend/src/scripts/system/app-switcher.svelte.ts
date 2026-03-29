import type { WindowState } from '../window/window-store.svelte.ts';
import { getWindows, focusWindow } from '../window/window-store.svelte.ts';
import { desktop } from './desktop.svelte.ts';

export const appSwitcher: { open: boolean; selectedIndex: number; windows: WindowState[] } = $state({
	open: false,
	selectedIndex: 0,
	windows: [],
});

export function openSwitcher(): void {
	const visible = getWindows().filter(w => !w.closing && w.desktopId === desktop.active);
	if (visible.length === 0) return;
	const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
	appSwitcher.windows = sorted;
	appSwitcher.selectedIndex = sorted.length > 1 ? 1 : 0;
	appSwitcher.open = true;
}

export function cycleSwitcher(direction: 1 | -1): void {
	if (!appSwitcher.open || appSwitcher.windows.length === 0) return;
	const len = appSwitcher.windows.length;
	appSwitcher.selectedIndex = (appSwitcher.selectedIndex + direction + len) % len;
}

export function confirmSwitcher(): void {
	if (!appSwitcher.open) return;
	const win = appSwitcher.windows[appSwitcher.selectedIndex];
	appSwitcher.open = false;
	appSwitcher.windows = [];
	if (win) focusWindow(win.id);
}

export function cancelSwitcher(): void {
	appSwitcher.open = false;
	appSwitcher.windows = [];
}
