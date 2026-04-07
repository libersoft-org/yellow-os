import type { Component } from 'svelte';
import { flushSync } from 'svelte';
import { desktop } from '../system/desktop.svelte.ts';
import type { SnapZone } from './window-snap.ts';
import { getSnapBounds } from './window-snap.ts';
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
	maxWidth: number;
	maxHeight: number;
	resizable: boolean;
	canMinimize: boolean;
	canMaximize: boolean;
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
	props: Record<string, unknown>;
	desktopId: number;
	showInTaskbar: boolean;
	frameless: boolean;
	fullscreen: boolean;
	preFullscreen: { x: number; y: number; width: number; height: number; frameless: boolean } | null;
	set position(value: 'default' | 'center');
	set state(value: 'normal' | 'maximized' | 'minimized' | 'fullscreen');
}
const Z_INDEX_COMPACT_THRESHOLD = 1000;
const CASCADE_OFFSET = 30;
const CASCADE_ORIGIN = 100;
const CASCADE_SLOTS = 5;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_MIN_WIDTH = 200;
const DEFAULT_MIN_HEIGHT = 150;

export function getChrome(): { width: number; height: number } {
	const titlebarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--titlebar-height'));
	return { width: 2, height: titlebarHeight + 1 };
}
let nextZIndex = $state(1);
const _windows: WindowState[] = $state([]);
const _windowMap = new Map<string, WindowState>();
export const focus: { id: string | null } = $state({ id: null });
export const snapPreview: { zone: SnapZone | null } = $state({ zone: null });
export const snapAnimatingIds: Record<string, boolean> = $state({});
const _focusCallbacks = new Map<string, () => void>();
const _closeCallbacks = new Map<string, () => void>();
const _beforeCloseCallbacks = new Map<string, () => boolean>();
let _justOpenedId: string | null = null;

export function registerFocusCallback(id: string, callback: () => void): void {
	_focusCallbacks.set(id, callback);
}

export function unregisterFocusCallback(id: string): void {
	_focusCallbacks.delete(id);
}

export function onWindowClosed(id: string, callback: () => void): void {
	_closeCallbacks.set(id, callback);
}

export function onBeforeClose(id: string, callback: () => boolean): void {
	_beforeCloseCallbacks.set(id, callback);
}

export function getWindows(): WindowState[] {
	return _windows;
}

export function findWindow(id: string): WindowState | undefined {
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

export function openWindow(component: Component, props: Record<string, unknown> = {}): string {
	const id = crypto.randomUUID();
	const count = _windows.length;
	const win: WindowState = {
		id,
		title: '',
		icon: '',
		x: CASCADE_ORIGIN + (count % CASCADE_SLOTS) * CASCADE_OFFSET,
		y: CASCADE_ORIGIN + (count % CASCADE_SLOTS) * CASCADE_OFFSET,
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT,
		minWidth: DEFAULT_MIN_WIDTH,
		minHeight: DEFAULT_MIN_HEIGHT,
		maxWidth: Infinity,
		maxHeight: Infinity,
		resizable: true,
		canMinimize: true,
		canMaximize: true,
		zIndex: nextZIndex++,
		minimized: false,
		minimizing: false,
		maximized: false,
		restoring: false,
		opening: true,
		closing: false,
		preMaximize: null,
		snappedZone: null,
		component,
		props,
		desktopId: desktop.active,
		showInTaskbar: true,
		frameless: false,
		fullscreen: false,
		preFullscreen: null,
		set position(value: 'default' | 'center') {
			if (value === 'center') {
				const chrome = getChrome();
				this.x = Math.round((globalThis.innerWidth - (this.width + chrome.width)) / 2);
				this.y = Math.round((globalThis.innerHeight - (this.height + chrome.height)) / 2);
			}
		},
		set state(value: 'normal' | 'maximized' | 'minimized' | 'fullscreen') {
			if (value === 'fullscreen') {
				if (this.fullscreen) return;
				this.preFullscreen = { x: this.x, y: this.y, width: this.width, height: this.height, frameless: this.frameless };
				this.x = 0;
				this.y = 0;
				this.width = globalThis.innerWidth;
				this.height = globalThis.innerHeight;
				this.frameless = true;
				this.fullscreen = true;
				this.maximized = false;
				this.preMaximize = null;
				this.snappedZone = null;
			} else if (value === 'maximized') {
				const bounds = getSnapBounds('top');
				const chrome = getChrome();
				this.preMaximize = { x: this.x, y: this.y, width: this.width, height: this.height };
				this.x = bounds.x;
				this.y = bounds.y;
				this.width = bounds.width - chrome.width;
				this.height = bounds.height - chrome.height;
				this.maximized = true;
				this.snappedZone = 'top';
			} else if (value === 'minimized') {
				this.minimized = true;
			} else if (value === 'normal') {
				if (this.fullscreen && this.preFullscreen) {
					this.x = this.preFullscreen.x;
					this.y = this.preFullscreen.y;
					this.width = this.preFullscreen.width;
					this.height = this.preFullscreen.height;
					this.frameless = this.preFullscreen.frameless;
					this.fullscreen = false;
					this.preFullscreen = null;
				}
				if (this.maximized && this.preMaximize) {
					this.x = this.preMaximize.x;
					this.y = this.preMaximize.y;
					this.width = this.preMaximize.width;
					this.height = this.preMaximize.height;
					this.maximized = false;
					this.preMaximize = null;
					this.snappedZone = null;
				}
				if (this.minimized) {
					this.minimized = false;
				}
			}
		},
	};
	_windows.push(win);
	const ref = _windows[_windows.length - 1]!;
	_windowMap.set(id, ref);
	focus.id = id;
	_justOpenedId = id;
	requestAnimationFrame(() => {
		_justOpenedId = null;
		requestAnimationFrame(() => (ref.opening = false));
	});
	return id;
}

export function closeWindow(id: string): void {
	const win = _windowMap.get(id);
	if (!win || win.closing) return;
	const beforeClose = _beforeCloseCallbacks.get(id);
	if (beforeClose && !beforeClose()) return;
	win.closing = true;
	if (focus.id === id) focus.id = null;
}

export function finishClose(id: string): void {
	const idx = _windows.findIndex(w => w.id === id);
	if (idx === -1) return;
	const closeCb = _closeCallbacks.get(id);
	_windows.splice(idx, 1);
	_windowMap.delete(id);
	_focusCallbacks.delete(id);
	_closeCallbacks.delete(id);
	_beforeCloseCallbacks.delete(id);
	compactZIndexes();
	if (focus.id === null) {
		const top = _windows.filter(w => !w.minimized && !w.closing && w.desktopId === desktop.active).sort((a, b) => b.zIndex - a.zIndex)[0];
		if (top) {
			focus.id = top.id;
			const cb = _focusCallbacks.get(top.id);
			if (cb) requestAnimationFrame(() => requestAnimationFrame(() => cb()));
		}
	}
	if (closeCb) requestAnimationFrame(() => requestAnimationFrame(() => closeCb()));
}

export function focusWindow(id: string): void {
	if (_justOpenedId && _justOpenedId !== id) return;
	const win = _windowMap.get(id);
	if (!win) return;
	assignZIndex(win);
	if (win.minimized) {
		win.restoring = true;
		win.minimized = false;
		requestAnimationFrame(() => requestAnimationFrame(() => (win.restoring = false)));
	}
	focus.id = id;
	const cb = _focusCallbacks.get(id);
	if (cb) requestAnimationFrame(() => cb());
}

export function minimizeWindow(id: string): void {
	const win = _windowMap.get(id);
	if (!win || !win.canMinimize || win.minimized || win.minimizing) return;
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
	else if (win.canMaximize) snapWindow(id, 'top');
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

export function cycleWindow(direction: 1 | -1): void {
	const visible = _windows.filter(w => !w.closing);
	if (visible.length === 0) return;
	const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
	const currentIdx = sorted.findIndex(w => w.id === focus.id);
	const nextIdx = currentIdx === -1 ? 0 : (currentIdx + direction + sorted.length) % sorted.length;
	focusWindow(sorted[nextIdx]!.id);
}

export function snapWindow(id: string, zone: SnapZone): void {
	const win = _windowMap.get(id);
	if (!win || !win.canMaximize) return;
	triggerSnapAnimation(id);
	const bounds = getSnapBounds(zone);
	if (!win.preMaximize) win.preMaximize = { x: win.x, y: win.y, width: win.width, height: win.height };
	const chrome = getChrome();
	win.x = bounds.x;
	win.y = bounds.y;
	win.width = bounds.width - chrome.width;
	win.height = bounds.height - chrome.height;
	win.maximized = zone === 'top';
	win.snappedZone = zone;
	assignZIndex(win);
	focus.id = id;
}
