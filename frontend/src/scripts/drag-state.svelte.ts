type DropHandler = (sourcePath: string, fileNames: string[], button: number, x: number, y: number, offsets: Map<string, { dx: number; dy: number }>) => void;

interface DropZone {
	el: HTMLElement;
	handler: DropHandler;
}

export interface DragGhostItem {
	id: string;
	icon: string;
	label: string;
	iconColor?: string | undefined;
	offsetX: number;
	offsetY: number;
}

let sourceEl: HTMLElement | null = null;
const zones: DropZone[] = [];

let _ghostItems = $state<DragGhostItem[]>([]);
let _ghostX = $state(0);
let _ghostY = $state(0);
let _ghostActive = $state(false);
let _ghostCellWidth = $state(90);
let _ghostCellHeight = $state(90);
let _ghostIconSize = $state('40px');

export const globalGhost = {
	get items(): DragGhostItem[] { return _ghostItems; },
	get x(): number { return _ghostX; },
	get y(): number { return _ghostY; },
	get active(): boolean { return _ghostActive; },
	get cellWidth(): number { return _ghostCellWidth; },
	get cellHeight(): number { return _ghostCellHeight; },
	get iconSize(): string { return _ghostIconSize; },
};

export function startGlobalDrag(srcEl: HTMLElement): void {
	sourceEl = srcEl;
}

export function isGlobalDragActive(): boolean {
	return sourceEl !== null;
}

export function updateGlobalGhost(items: DragGhostItem[], x: number, y: number, cellWidth: number, cellHeight: number, iconSize: string): void {
	_ghostItems = items;
	_ghostX = x;
	_ghostY = y;
	_ghostCellWidth = cellWidth;
	_ghostCellHeight = cellHeight;
	_ghostIconSize = iconSize;
	_ghostActive = true;
}

export function clearGlobalGhost(): void {
	_ghostActive = false;
	_ghostItems = [];
}

export function endGlobalDrag(sourcePath: string, fileNames: string[], button: number, x: number, y: number): boolean {
	const src = sourceEl;
	sourceEl = null;

	// Capture relative grid offsets from ghost before clearing.
	const offsets = new Map<string, { dx: number; dy: number }>();
	if (_ghostItems.length > 0 && _ghostCellWidth > 0 && _ghostCellHeight > 0) {
		for (const ghost of _ghostItems) {
			offsets.set(ghost.id, {
				dx: Math.round(ghost.offsetX / _ghostCellWidth),
				dy: Math.round(ghost.offsetY / _ghostCellHeight),
			});
		}
	}
	clearGlobalGhost();

	// Use elementsFromPoint to find the topmost zone in visual stacking order.
	// This correctly handles overlapping zones (e.g. FileBrowser window over Desktop)
	// regardless of zone registration order.
	const elements = document.elementsFromPoint(x, y);
	for (const el of elements) {
		for (const zone of zones) {
			if (zone.el === el || zone.el.contains(el)) {
				if (src && zone.el.contains(src)) {
					return false;
				}
				zone.handler(sourcePath, fileNames, button, x, y, offsets);
				return true;
			}
		}
	}
	return false;
}

export function cancelGlobalDrag(): void {
	sourceEl = null;
	clearGlobalGhost();
}

export function registerDropZone(el: HTMLElement, handler: DropHandler): () => void {
	const zone: DropZone = { el, handler };
	zones.push(zone);
	return (): void => {
		const idx = zones.indexOf(zone);
		if (idx >= 0) zones.splice(idx, 1);
	};
}
