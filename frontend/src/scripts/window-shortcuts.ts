import type { SnapZone } from './window-snap.ts';
import { getWindow, focus, minimizeWindow, restoreWindow, snapWindow } from './window-store.svelte.ts';

const NUMPAD_SNAP: Record<string, SnapZone> = {
	Numpad7: 'top-left',
	Numpad8: 'top',
	Numpad9: 'top-right',
	Numpad4: 'left',
	Numpad6: 'right',
	Numpad1: 'bottom-left',
	Numpad3: 'bottom-right',
};

export function handleKeyboardShortcut(e: KeyboardEvent): void {
	if (!e.metaKey) return;
	const id = focus.id;
	if (!id) return;
	const win = getWindow(id);
	if (!win || win.minimized || win.minimizing) return;
	const zone = NUMPAD_SNAP[e.code];
	if (zone) {
		e.preventDefault();
		snapWindow(id, zone);
		return;
	}
	if (e.code === 'Numpad2') {
		e.preventDefault();
		if (win.maximized || win.preMaximize) restoreWindow(id);
		else minimizeWindow(id);
		return;
	}
	if (e.code === 'Numpad5') {
		e.preventDefault();
		if (win.maximized || win.preMaximize) restoreWindow(id);
	}
}
