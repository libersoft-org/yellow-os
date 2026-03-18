import type { Component } from 'svelte';

export interface WindowState {
	id: string;
	title: string;
	icon: string;
	x: number;
	y: number;
	width: number;
	height: number;
	minWidth: number;
	minHeight: number;
	zIndex: number;
	minimized: boolean;
	minimizing: boolean;
	maximized: boolean;
	restoring: boolean;
	preMaximize: { x: number; y: number; width: number; height: number } | null;
	component: Component;
}

const TASKBAR_HEIGHT = 48;

let nextZIndex = $state(1);
export const windows: WindowState[] = $state([]);
export const focus: { id: string | null } = $state({ id: null });

export function openWindow(opts: { title: string; icon: string; component: Component; width?: number; height?: number; x?: number; y?: number }): string {
	const id = crypto.randomUUID();
	windows.push({
		id,
		title: opts.title,
		icon: opts.icon,
		x: opts.x ?? 100 + (windows.length % 5) * 30,
		y: opts.y ?? 100 + (windows.length % 5) * 30,
		width: opts.width ?? 600,
		height: opts.height ?? 400,
		minWidth: 200,
		minHeight: 150,
		zIndex: nextZIndex++,
		minimized: false,
		minimizing: false,
		maximized: false,
		restoring: false,
		preMaximize: null,
		component: opts.component,
	});
	focus.id = id;
	return id;
}

export function closeWindow(id: string): void {
	const idx = windows.findIndex(w => w.id === id);
	if (idx !== -1) {
		windows.splice(idx, 1);
		if (focus.id === id) focus.id = null;
	}
}

export function focusWindow(id: string): void {
	const win = windows.find(w => w.id === id);
	if (!win) return;
	win.zIndex = nextZIndex++;
	if (win.minimized) {
		win.restoring = true;
		win.minimized = false;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				win.restoring = false;
			});
		});
	}
	focus.id = id;
}

export function minimizeWindow(id: string): void {
	const win = windows.find(w => w.id === id);
	if (!win || win.minimized || win.minimizing) return;
	win.minimizing = true;
	setTimeout(() => {
		win.minimized = true;
		win.minimizing = false;
	}, 200);
}

export function toggleMaximize(id: string): void {
	const win = windows.find(w => w.id === id);
	if (!win) return;

	if (win.maximized) {
		if (win.preMaximize) {
			win.x = win.preMaximize.x;
			win.y = win.preMaximize.y;
			win.width = win.preMaximize.width;
			win.height = win.preMaximize.height;
		}
		win.maximized = false;
		win.preMaximize = null;
	} else {
		win.preMaximize = { x: win.x, y: win.y, width: win.width, height: win.height };
		win.x = 0;
		win.y = 0;
		win.width = globalThis.innerWidth;
		win.height = globalThis.innerHeight - TASKBAR_HEIGHT;
		win.maximized = true;
	}
	win.zIndex = nextZIndex++;
	focus.id = id;
}

export function moveWindow(id: string, x: number, y: number): void {
	const win = windows.find(w => w.id === id);
	if (win) {
		win.x = x;
		win.y = y;
	}
}

export function resizeWindow(id: string, width: number, height: number, x?: number, y?: number): void {
	const win = windows.find(w => w.id === id);
	if (!win) return;
	win.width = width;
	win.height = height;
	if (x !== undefined) win.x = x;
	if (y !== undefined) win.y = y;
}

export function defocusAll(): void {
	focus.id = null;
}

export function isTopWindow(id: string): boolean {
	const visible = windows.filter(w => !w.minimized);
	if (visible.length === 0) return false;
	const topZ = Math.max(...visible.map(w => w.zIndex));
	const win = windows.find(w => w.id === id);
	return win !== undefined && win.zIndex === topZ;
}
