type DropHandler = (sourcePath: string, fileNames: string[], button: number, x: number, y: number, offsets: Map<string, { dx: number; dy: number }>) => void;

export type DropResult = 'handled' | 'same-source' | 'blocked';

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
let _canDrop = $state(true);

export const globalGhost = {
	get items(): DragGhostItem[] {
		return _ghostItems;
	},
	get x(): number {
		return _ghostX;
	},
	get y(): number {
		return _ghostY;
	},
	get active(): boolean {
		return _ghostActive;
	},
	get cellWidth(): number {
		return _ghostCellWidth;
	},
	get cellHeight(): number {
		return _ghostCellHeight;
	},
	get iconSize(): string {
		return _ghostIconSize;
	},
	get canDrop(): boolean {
		return _canDrop;
	},
};

type ZoneSearchResult = { type: 'target'; zone: DropZone } | { type: 'source' } | { type: 'blocked' };

/** Find the topmost drop zone at (x, y) using visual stacking order.
 *  Windows without a drop zone above them block drops to zones beneath. */
function findTargetZone(x: number, y: number, src: HTMLElement | null): ZoneSearchResult {
	const elements = document.elementsFromPoint(x, y);
	for (const el of elements) {
		for (const zone of zones) {
			if (zone.el === el || zone.el.contains(el)) {
				if (src && zone.el.contains(src)) return { type: 'source' };
				return { type: 'target', zone };
			}
		}
		// A window that has no matching drop zone at this point blocks
		// zones beneath it — even if the drag source lives in this window.
		// (If the cursor were over the zone inside the window, the zone
		// check above would have matched before we reached here.)
		if (el.classList.contains('window')) {
			return { type: 'blocked' };
		}
	}
	return { type: 'blocked' };
}

export function startGlobalDrag(srcEl: HTMLElement): void {
	sourceEl = srcEl;
}

export function isGlobalDragActive(): boolean {
	return sourceEl !== null;
}

export function updateGlobalGhost(items: DragGhostItem[], x: number, y: number, cellWidth: number, cellHeight: number, iconSize: string, cursorX: number, cursorY: number): void {
	_ghostItems = items;
	_ghostX = x;
	_ghostY = y;
	_ghostCellWidth = cellWidth;
	_ghostCellHeight = cellHeight;
	_ghostIconSize = iconSize;
	_ghostActive = true;
	_canDrop = findTargetZone(cursorX, cursorY, sourceEl).type !== 'blocked';
}

export function clearGlobalGhost(): void {
	_ghostActive = false;
	_ghostItems = [];
	_canDrop = true;
}

export function endGlobalDrag(sourcePath: string, fileNames: string[], button: number, x: number, y: number): DropResult {
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

	const result = findTargetZone(x, y, src);
	if (result.type === 'target') {
		result.zone.handler(sourcePath, fileNames, button, x, y, offsets);
		return 'handled';
	}
	return result.type === 'source' ? 'same-source' : 'blocked';
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
