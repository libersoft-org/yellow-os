import { getWindow, focusWindow, resizeWindow } from './window-store.svelte.ts';
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
	return `position:absolute;z-index:10;touch-action:none;${HANDLE_STYLES[dir]}`;
}

export function createResizeHandler(getWinId: () => string) {
	let resizing = $state(false);
	let dir: ResizeDir = 'se';
	let startX = 0;
	let startY = 0;
	let winStartX = 0;
	let winStartY = 0;
	let winStartW = 0;
	let winStartH = 0;

	function start(e: PointerEvent, d: ResizeDir) {
		const winId = getWinId();
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
		const winId = getWinId();
		const win = getWindow(winId);
		if (!win) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		let x = winStartX;
		let y = winStartY;
		let w = winStartW;
		let h = winStartH;
		if (dir.includes('e')) w += dx;
		if (dir.includes('w')) {
			w -= dx;
			x += dx;
		}
		if (dir.includes('s')) h += dy;
		if (dir.includes('n')) {
			h -= dy;
			y += dy;
		}
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
		get resizing() {
			return resizing;
		},
		start,
		move,
		up,
	};
}
