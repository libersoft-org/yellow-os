export interface GestureCallbacks {
	/** Fires on every pointerdown. Return false to ignore this interaction. */
	onpress?: (e: PointerEvent) => boolean | void;
	/** Fires on pointerup without drag (single click/tap). */
	onclick?: (e: PointerEvent) => void;
	/** Fires on second click/tap within doubleTapMs (on pointerup). */
	ondblclick?: (e: PointerEvent) => void;
	/** Fires when drag threshold is exceeded. */
	ondragstart?: (e: PointerEvent, startX: number, startY: number) => void;
	/** Fires during active drag. */
	ondragmove?: (e: PointerEvent, dx: number, dy: number) => void;
	/** Fires on pointerup after drag. */
	ondragend?: (e: PointerEvent) => void;
}

export interface GestureOptions extends GestureCallbacks {
	/** Minimum pixel movement to start drag. Default: 4 */
	dragThreshold?: number;
	/** Max ms between taps for double-tap. Default: 300 */
	doubleTapMs?: number;
}

interface GestureAction {
	update(opts: GestureOptions): void;
	destroy(): void;
}

export function pointerGestures(node: HTMLElement, options: GestureOptions): GestureAction {
	let opts = options;
	let active = false;
	let dragging = false;
	let startX = 0;
	let startY = 0;
	let trackedPointerId = -1;
	let lastTapTime = 0;

	function hasDragCallbacks(): boolean {
		return !!(opts.ondragstart || opts.ondragmove || opts.ondragend);
	}

	if (hasDragCallbacks()) node.style.touchAction = 'none';

	function onPointerDown(e: PointerEvent): void {
		if (active) return;
		if (opts.onpress && opts.onpress(e) === false) return;
		active = true;
		dragging = false;
		trackedPointerId = e.pointerId;
		startX = e.clientX;
		startY = e.clientY;
		if (hasDragCallbacks()) node.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent): void {
		if (!active || e.pointerId !== trackedPointerId) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (!dragging) {
			const t = opts.dragThreshold ?? 4;
			if (Math.abs(dx) < t && Math.abs(dy) < t) return;
			dragging = true;
			lastTapTime = 0;
			opts.ondragstart?.(e, startX, startY);
		}
		opts.ondragmove?.(e, dx, dy);
	}

	function onPointerUp(e: PointerEvent): void {
		if (!active || e.pointerId !== trackedPointerId) return;
		active = false;
		trackedPointerId = -1;
		if (dragging) {
			dragging = false;
			opts.ondragend?.(e);
			return;
		}
		if (opts.ondblclick) {
			const now = Date.now();
			if (now - lastTapTime < (opts.doubleTapMs ?? 300)) {
				lastTapTime = 0;
				opts.ondblclick(e);
				return;
			}
			lastTapTime = now;
		}
		opts.onclick?.(e);
	}

	function onPointerCancel(e: PointerEvent): void {
		if (e.pointerId !== trackedPointerId) return;
		active = false;
		dragging = false;
		trackedPointerId = -1;
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointermove', onPointerMove);
	node.addEventListener('pointerup', onPointerUp);
	node.addEventListener('pointercancel', onPointerCancel);

	return {
		update(newOpts: GestureOptions) {
			opts = newOpts;
			if (hasDragCallbacks()) node.style.touchAction = 'none';
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerCancel);
		},
	};
}
