import type { Component } from 'svelte';
import { flushSync } from 'svelte';
import { desktop } from './desktop.svelte.ts';
import type { SnapZone } from './window-snap.ts';
import { getSnapBounds } from './window-snap.ts';
export type WindowPosition = 'default' | 'center';
export type WindowStartState = 'normal' | 'minimized' | 'maximized';
export interface AppConfig {
	title: string;
	icon: string;
	width?: number;
	height?: number;
	position?: WindowPosition;
	startState?: WindowStartState;
}
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
	opening: boolean;
	closing: boolean;
	preMaximize: { x: number; y: number; width: number; height: number } | null;
	snappedZone: SnapZone | null;
	component: Component;
	desktopId: number;
}
const Z_INDEX_COMPACT_THRESHOLD = 1000;
const CASCADE_OFFSET = 30;
const CASCADE_ORIGIN = 100;
const CASCADE_SLOTS = 5;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_MIN_WIDTH = 200;
const DEFAULT_MIN_HEIGHT = 150;

function getChrome(): { width: number; height: number } {
	const titlebarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--titlebar-height'));
	return { width: 2, height: titlebarHeight + 1 };
}
let nextZIndex = $state(1);
const _windows: WindowState[] = $state([]);
const _windowMap = new Map<string, WindowState>();
export const focus: { id: string | null } = $state({ id: null });
export const snapPreview: { zone: SnapZone | null } = $state({ zone: null });
export const snapAnimatingIds: Record<string, boolean> = $state({});

export function getWindows(): WindowState[] {
	return _windows;
}

export function getWindow(id: string): WindowState | undefined {
	return _windowMap.get(id);
}

function compactZIndexes(): void {
	const sorted = [..._windows].sort((a, b) => a.zIndex - b.zIndex);
	for (let i = 0; i < sorted.length; i++) sorted[i]!.zIndex = i + 1;
	nextZIndex = sorted.length + 1;
}

function assignZIndex(win: WindowState): void {
	win.zIndex = nextZIndex++;
	if (nextZIndex > Z_INDEX_COMPACT_THRESHOLD) compactZIndexes();
}

export function triggerSnapAnimation(id: string): void {
	snapAnimatingIds[id] = true;
	flushSync();
}

export function finishSnapAnimation(id: string): void {
	delete snapAnimatingIds[id];
}

export function openWindow(opts: { title: string; icon: string; component: Component; width?: number; height?: number; x?: number; y?: number; position?: WindowPosition; startState?: WindowStartState }): string {
	const id = crypto.randomUUID();
	const count = _windows.length;
	const w = opts.width ?? DEFAULT_WIDTH;
	const h = opts.height ?? DEFAULT_HEIGHT;
	const position = opts.position ?? 'default';
	const startState = opts.startState ?? 'normal';
	const chrome = getChrome();
	const outerW = w + chrome.width;
	const outerH = h + chrome.height;
	let normalX: number;
	let normalY: number;
	if (opts.x != null && opts.y != null) {
		normalX = opts.x;
		normalY = opts.y;
	} else if (position === 'center') {
		normalX = Math.round((window.innerWidth - outerW) / 2);
		normalY = Math.round((window.innerHeight - outerH) / 2);
	} else {
		normalX = CASCADE_ORIGIN + (count % CASCADE_SLOTS) * CASCADE_OFFSET;
		normalY = CASCADE_ORIGIN + (count % CASCADE_SLOTS) * CASCADE_OFFSET;
	}
	let x = normalX;
	let y = normalY;
	if (startState === 'maximized') {
		const bounds = getSnapBounds('top');
		x = bounds.x;
		y = bounds.y;
	}
	const win: WindowState = {
		id,
		title: opts.title,
		icon: opts.icon,
		x,
		y,
		width: outerW,
		height: outerH,
		minWidth: DEFAULT_MIN_WIDTH,
		minHeight: DEFAULT_MIN_HEIGHT,
		zIndex: nextZIndex++,
		minimized: startState === 'minimized',
		minimizing: false,
		maximized: startState === 'maximized',
		restoring: false,
		opening: true,
		closing: false,
		preMaximize: startState === 'maximized' ? { x: normalX, y: normalY, width: outerW, height: outerH } : null,
		snappedZone: startState === 'maximized' ? 'top' : null,
		component: opts.component,
		desktopId: desktop.active,
	};
	_windows.push(win);
	const ref = _windows[_windows.length - 1]!;
	_windowMap.set(id, ref);
	if (startState === 'maximized') {
		const bounds = getSnapBounds('top');
		ref.x = bounds.x;
		ref.y = bounds.y;
		ref.width = bounds.width;
		ref.height = bounds.height;
	}
	focus.id = id;
	requestAnimationFrame(() => {
		requestAnimationFrame(() => (ref.opening = false));
	});
	return id;
}

export function closeWindow(id: string): void {
	const win = _windowMap.get(id);
	if (!win || win.closing) return;
	win.closing = true;
	if (focus.id === id) focus.id = null;
}

export function finishClose(id: string): void {
	const idx = _windows.findIndex(w => w.id === id);
	if (idx === -1) return;
	_windows.splice(idx, 1);
	_windowMap.delete(id);
	compactZIndexes();
}

export function focusWindow(id: string): void {
	const win = _windowMap.get(id);
	if (!win) return;
	assignZIndex(win);
	if (win.minimized) {
		win.restoring = true;
		win.minimized = false;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => (win.restoring = false));
		});
	}
	focus.id = id;
}

export function minimizeWindow(id: string): void {
	const win = _windowMap.get(id);
	if (!win || win.minimized || win.minimizing) return;
	win.minimizing = true;
}

export function finishMinimize(id: string): void {
	const win = _windowMap.get(id);
	if (!win || !win.minimizing) return;
	win.minimized = true;
	win.minimizing = false;
}

export function restoreWindow(id: string): void {
	const win = _windowMap.get(id);
	if (!win || !win.preMaximize) return;
	triggerSnapAnimation(id);
	win.x = win.preMaximize.x;
	win.y = win.preMaximize.y;
	win.width = win.preMaximize.width;
	win.height = win.preMaximize.height;
	win.maximized = false;
	win.preMaximize = null;
	win.snappedZone = null;
	assignZIndex(win);
	focus.id = id;
}

export function toggleMaximize(id: string): void {
	const win = _windowMap.get(id);
	if (!win) return;
	if (win.maximized) restoreWindow(id);
	else snapWindow(id, 'top');
}

export function moveWindow(id: string, x: number, y: number): void {
	const win = _windowMap.get(id);
	if (win) {
		win.x = x;
		win.y = y;
	}
}

export function resizeWindow(id: string, width: number, height: number, x?: number, y?: number): void {
	const win = _windowMap.get(id);
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
	return focus.id === id;
}

export function reorderWindow(dragId: string, targetId: string): void {
	const dragIdx = _windows.findIndex(w => w.id === dragId);
	const targetIdx = _windows.findIndex(w => w.id === targetId);
	if (dragIdx === -1 || targetIdx === -1) return;
	const [removed] = _windows.splice(dragIdx, 1);
	_windows.splice(targetIdx, 0, removed!);
}

export function snapWindow(id: string, zone: SnapZone): void {
	const win = _windowMap.get(id);
	if (!win) return;
	triggerSnapAnimation(id);
	const bounds = getSnapBounds(zone);
	if (!win.preMaximize) win.preMaximize = { x: win.x, y: win.y, width: win.width, height: win.height };
	win.x = bounds.x;
	win.y = bounds.y;
	win.width = bounds.width;
	win.height = bounds.height;
	win.maximized = zone === 'top';
	win.snappedZone = zone;
	assignZIndex(win);
	focus.id = id;
}
