import type { SnapZone } from './window-snap.ts';
import { closeWindow, findWindow, focus, minimizeWindow, restoreWindow, snapWindow } from './window-store.svelte.ts';
import { appSwitcher, openSwitcher, cycleSwitcher, confirmSwitcher } from '../system/app-switcher.svelte.ts';

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
	if (e.altKey && !e.ctrlKey && !e.metaKey) {
		if (e.code === 'Digit1' || e.code === 'Digit2') {
			e.preventDefault();
			const direction = e.code === 'Digit1' ? -1 : 1;
			if (appSwitcher.open) cycleSwitcher(direction);
			else openSwitcher();
			return;
		}
	}
	if (!e.metaKey) return;
	const id = focus.id;
	if (!id) return;
	if (e.code === 'F4') {
		e.preventDefault();
		closeWindow(id);
		return;
	}
	const win = findWindow(id);
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

export function handleKeyUp(e: KeyboardEvent): void {
	if ((e.code === 'AltLeft' || e.code === 'AltRight') && appSwitcher.open) {
		e.preventDefault();
		confirmSwitcher();
	}
}
