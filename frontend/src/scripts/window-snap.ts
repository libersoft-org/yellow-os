export type SnapZone = 'left' | 'right' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
const SNAP_RATIO = 0.05;

function getTaskbarHeight(): number {
	return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 50;
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
