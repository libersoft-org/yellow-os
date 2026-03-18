import type { Component } from 'svelte';
export type SnapZone = 'left' | 'right' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
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
function getTaskbarHeight(): number {
	return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 50;
}
const SNAP_RATIO = 0.05;
const Z_INDEX_COMPACT_THRESHOLD = 1000;
let nextZIndex = $state(1);
export const windows: WindowState[] = $state([]);
const windowMap = new Map<string, WindowState>();
export const focus: { id: string | null } = $state({ id: null });
export const snapPreview: { zone: SnapZone | null } = $state({ zone: null });

export function getWindow(id: string): WindowState | undefined {
	return windowMap.get(id);
}

function compactZIndexes(): void {
	const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex);
	for (let i = 0; i < sorted.length; i++) sorted[i]!.zIndex = i + 1;
	nextZIndex = sorted.length + 1;
}

function assignZIndex(win: WindowState): void {
	win.zIndex = nextZIndex++;
	if (nextZIndex > Z_INDEX_COMPACT_THRESHOLD) compactZIndexes();
}

export function openWindow(opts: { title: string; icon: string; component: Component; width?: number; height?: number; x?: number; y?: number }): string {
	const id = crypto.randomUUID();
	const win: WindowState = {
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
	};
	windows.push(win);
	windowMap.set(id, windows[windows.length - 1]!);
	focus.id = id;
	return id;
}

export function closeWindow(id: string): void {
	const idx = windows.findIndex(w => w.id === id);
	if (idx !== -1) {
		windows.splice(idx, 1);
		windowMap.delete(id);
		if (focus.id === id) focus.id = null;
		compactZIndexes();
	}
}

export function focusWindow(id: string): void {
	const win = getWindow(id);
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
	const win = getWindow(id);
	if (!win || win.minimized || win.minimizing) return;
	win.minimizing = true;
}

export function finishMinimize(id: string): void {
	const win = getWindow(id);
	if (!win || !win.minimizing) return;
	win.minimized = true;
	win.minimizing = false;
}

export function restoreWindow(id: string): void {
	const win = getWindow(id);
	if (!win || !win.preMaximize) return;
	win.x = win.preMaximize.x;
	win.y = win.preMaximize.y;
	win.width = win.preMaximize.width;
	win.height = win.preMaximize.height;
	win.maximized = false;
	win.preMaximize = null;
	assignZIndex(win);
	focus.id = id;
}

export function toggleMaximize(id: string): void {
	const win = getWindow(id);
	if (!win) return;
	if (win.maximized || win.preMaximize) restoreWindow(id);
	else snapWindow(id, 'top');
}

export function moveWindow(id: string, x: number, y: number): void {
	const win = getWindow(id);
	if (win) {
		win.x = x;
		win.y = y;
	}
}

export function resizeWindow(id: string, width: number, height: number, x?: number, y?: number): void {
	const win = getWindow(id);
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

export function getSnapZone(clientX: number, clientY: number): SnapZone | null {
	const w = globalThis.innerWidth;
	const h = globalThis.innerHeight - getTaskbarHeight();
	const snapThreshold = globalThis.innerHeight * SNAP_RATIO;
	const nearLeft = clientX <= snapThreshold;
	const nearRight = clientX >= w - snapThreshold;
	const nearTop = clientY <= snapThreshold;
	const nearBottom = clientY >= h - snapThreshold;
	if (nearLeft && nearTop) return 'top-left';
	if (nearRight && nearTop) return 'top-right';
	if (nearLeft && nearBottom) return 'bottom-left';
	if (nearRight && nearBottom) return 'bottom-right';
	if (nearTop) return 'top';
	if (nearLeft) return 'left';
	if (nearRight) return 'right';
	return null;
}

export function getSnapBounds(zone: SnapZone): { x: number; y: number; width: number; height: number } {
	const w = globalThis.innerWidth;
	const h = globalThis.innerHeight - getTaskbarHeight();
	const halfW = Math.floor(w / 2);
	const halfH = Math.floor(h / 2);
	switch (zone) {
		case 'left':
			return { x: 0, y: 0, width: halfW, height: h };
		case 'right':
			return { x: halfW, y: 0, width: w - halfW, height: h };
		case 'top':
			return { x: 0, y: 0, width: w, height: h };
		case 'top-left':
			return { x: 0, y: 0, width: halfW, height: halfH };
		case 'top-right':
			return { x: halfW, y: 0, width: w - halfW, height: halfH };
		case 'bottom-left':
			return { x: 0, y: halfH, width: halfW, height: h - halfH };
		case 'bottom-right':
			return { x: halfW, y: halfH, width: w - halfW, height: h - halfH };
	}
}

export function snapWindow(id: string, zone: SnapZone): void {
	const win = getWindow(id);
	if (!win) return;
	const bounds = getSnapBounds(zone);
	if (!win.preMaximize) win.preMaximize = { x: win.x, y: win.y, width: win.width, height: win.height };
	win.x = bounds.x;
	win.y = bounds.y;
	win.width = bounds.width;
	win.height = bounds.height;
	win.maximized = zone === 'top';
	assignZIndex(win);
	focus.id = id;
}

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const RESIZE_DIRS: readonly ResizeDir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const HANDLE_STYLES: Record<ResizeDir, string> = {
	n: 'top:-4px;left:10px;right:10px;height:8px;cursor:n-resize',
	s: 'bottom:-4px;left:10px;right:10px;height:8px;cursor:s-resize',
	e: 'top:10px;bottom:10px;right:-4px;width:8px;cursor:e-resize',
	w: 'top:10px;bottom:10px;left:-4px;width:8px;cursor:w-resize',
	ne: 'top:-4px;right:-4px;width:14px;height:14px;cursor:ne-resize',
	nw: 'top:-4px;left:-4px;width:14px;height:14px;cursor:nw-resize',
	se: 'bottom:-4px;right:-4px;width:14px;height:14px;cursor:se-resize',
	sw: 'bottom:-4px;left:-4px;width:14px;height:14px;cursor:sw-resize',
};

export function getHandleStyle(dir: ResizeDir): string {
	return `position:absolute;z-index:10;${HANDLE_STYLES[dir]}`;
}

export function createResizeHandler(winId: string) {
	let resizing = $state(false);
	let dir: ResizeDir = 'se';
	let startX = 0;
	let startY = 0;
	let winStartX = 0;
	let winStartY = 0;
	let winStartW = 0;
	let winStartH = 0;

	function start(e: PointerEvent, d: ResizeDir) {
		const win = getWindow(winId);
		if (!win || win.maximized) return;
		resizing = true;
		dir = d;
		startX = e.clientX;
		startY = e.clientY;
		winStartX = win.x;
		winStartY = win.y;
		winStartW = win.width;
		winStartH = win.height;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
		focusWindow(winId);
	}

	function move(e: PointerEvent) {
		if (!resizing) return;
		const win = getWindow(winId);
		if (!win) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		let x = winStartX;
		let y = winStartY;
		let w = winStartW;
		let h = winStartH;
		if (dir.includes('e')) w += dx;
		if (dir.includes('w')) { w -= dx; x += dx; }
		if (dir.includes('s')) h += dy;
		if (dir.includes('n')) { h -= dy; y += dy; }
		if (w < win.minWidth) {
			if (dir.includes('w')) x -= win.minWidth - w;
			w = win.minWidth;
		}
		if (h < win.minHeight) {
			if (dir.includes('n')) y -= win.minHeight - h;
			h = win.minHeight;
		}
		resizeWindow(winId, w, h, x, y);
	}

	function up() {
		resizing = false;
	}

	return {
		get resizing() { return resizing; },
		start,
		move,
		up,
	};
}
