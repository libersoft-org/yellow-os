import { createSelection } from './selection.svelte.ts';
import { startGlobalDrag, endGlobalDrag, cancelGlobalDrag, updateGlobalGhost, type DragGhostItem, type DropResult } from './drag-state.svelte.ts';

export interface SelectableItem {
	id: string;
	droppable?: boolean | undefined;
}

export interface GhostConfig {
	items: DragGhostItem[];
	x: number;
	y: number;
	cellWidth: number;
	cellHeight: number;
	iconSize: string;
}

export interface SelectableItemsConfig {
	getItems(): SelectableItem[];
	getContainerEl(): HTMLElement | undefined;
	getDirPath(): string | undefined;
	getItemIdAt(screenX: number, screenY: number): string | null;
	toLocalCoords(e: PointerEvent): { x: number; y: number };
	buildGhostConfig(e: PointerEvent, selectedIds: Set<string>): GhostConfig | null;
	getItemIdsInRect(x1: number, y1: number, x2: number, y2: number): string[];
	onPressItem?: ((id: string, e: PointerEvent) => void) | undefined;
	onMoveDragEnd?: ((dropResult: DropResult | null, draggedIds: string[], dragOverId: string | null, e: PointerEvent) => boolean) | undefined;
	onselectionchange?: ((selectedIds: Set<string>) => void) | undefined;
	ondblclick?: ((id: string) => void) | undefined;
	ondrop?: ((draggedIds: string[], targetId: string | null, e: PointerEvent) => void) | undefined;
	onkeyaction?: ((e: KeyboardEvent) => void) | undefined;
}

export interface SelectableItems {
	readonly selected: Set<string>;
	readonly dragMode: 'none' | 'select' | 'move';
	readonly dragOverId: string | null;
	readonly dragSelectStart: { x: number; y: number };
	readonly dragSelectEnd: { x: number; y: number };
	readonly lastClickedItemId: string | null;
	isSelected(id: string): boolean;
	clearSelection(): void;
	selectSingle(id: string): void;
	setSelection(ids: Set<string>): void;
	handlePress(e: PointerEvent): boolean | void;
	handleClick(): void;
	handleDblClick(): void;
	handleDragStart(): void;
	handleDragMove(e: PointerEvent): void;
	handleDragEnd(e: PointerEvent): void;
	handleKeydown(e: KeyboardEvent): void;
}

export function createSelectableItems(config: SelectableItemsConfig): SelectableItems {
	const selection = createSelection();

	let _dragMode = $state<'none' | 'select' | 'move'>('none');
	let _dragOverId = $state<string | null>(null);
	let _dragSelectStart = $state({ x: 0, y: 0 });
	let _dragSelectEnd = $state({ x: 0, y: 0 });
	let _lastClickedItemId = $state<string | null>(null);
	let _pendingDeselect = $state<string | null>(null);

	let pressedOnItem = false;
	let dragButton = 0;
	let dragPreSelected = new Set<string>();

	function emitSelectionChange(): void {
		config.onselectionchange?.(selection.selected);
	}

	function handlePress(e: PointerEvent): boolean | void {
		e.preventDefault();
		config.getContainerEl()?.focus();
		_pendingDeselect = null;

		const cell = (e.target as HTMLElement).closest('[data-icon-id]') as HTMLElement | null;
		if (cell) {
			const id = cell.dataset['iconId']!;
			_lastClickedItemId = id;
			const items = config.getItems();

			if (selection.isSelected(id)) {
				if (e.ctrlKey || e.metaKey) {
					const idx = items.findIndex(i => i.id === id);
					selection.select(
						id,
						idx,
						items.map(i => i.id),
						e
					);
					emitSelectionChange();
					return false;
				}
				_pendingDeselect = id;
			} else {
				const idx = items.findIndex(i => i.id === id);
				selection.select(
					id,
					idx,
					items.map(i => i.id),
					e
				);
			}

			pressedOnItem = true;
			dragButton = e.button;
			config.onPressItem?.(id, e);
		} else {
			_lastClickedItemId = null;
			if (e.button !== 0) return false;
			if (!(e.ctrlKey || e.metaKey)) selection.clear();
			pressedOnItem = false;
			const coords = config.toLocalCoords(e);
			_dragSelectStart = coords;
			_dragSelectEnd = coords;
			dragPreSelected = e.ctrlKey || e.metaKey ? new Set(selection.selected) : new Set();
		}
		emitSelectionChange();
	}

	function handleClick(): void {
		if (_pendingDeselect) {
			selection.set(new Set([_pendingDeselect]));
			_pendingDeselect = null;
		}
		emitSelectionChange();
	}

	function handleDblClick(): void {
		if (_lastClickedItemId) {
			config.ondblclick?.(_lastClickedItemId);
		}
	}

	function handleDragStart(): void {
		_dragMode = pressedOnItem ? 'move' : 'select';
		_pendingDeselect = null;
		if (pressedOnItem) {
			const el = config.getContainerEl();
			const dirPath = config.getDirPath();
			if (dirPath && el) startGlobalDrag(el);
		}
	}

	function handleDragMove(e: PointerEvent): void {
		if (_dragMode === 'move') {
			const ghost = config.buildGhostConfig(e, selection.selected);
			if (ghost) {
				updateGlobalGhost(ghost.items, ghost.x, ghost.y, ghost.cellWidth, ghost.cellHeight, ghost.iconSize, e.clientX, e.clientY);
			}

			const hitId = config.getItemIdAt(e.clientX, e.clientY);
			if (hitId && !selection.isSelected(hitId)) {
				const item = config.getItems().find(i => i.id === hitId);
				_dragOverId = item?.droppable ? hitId : null;
			} else {
				_dragOverId = null;
			}
			return;
		}

		if (_dragMode === 'select') {
			_dragSelectEnd = config.toLocalCoords(e);
			const x1 = Math.min(_dragSelectStart.x, _dragSelectEnd.x);
			const y1 = Math.min(_dragSelectStart.y, _dragSelectEnd.y);
			const x2 = Math.max(_dragSelectStart.x, _dragSelectEnd.x);
			const y2 = Math.max(_dragSelectStart.y, _dragSelectEnd.y);

			const hitIds = config.getItemIdsInRect(x1, y1, x2, y2);
			const next = new Set(dragPreSelected);
			for (const id of hitIds) next.add(id);
			selection.set(next);
			emitSelectionChange();
		}
	}

	function handleDragEnd(e: PointerEvent): void {
		if (_dragMode === 'move') {
			const draggedIds = [...selection.selected];
			const dirPath = config.getDirPath();
			let dropResult: DropResult | null = null;
			if (dirPath) {
				dropResult = endGlobalDrag(dirPath, draggedIds, dragButton, e.clientX, e.clientY);
			}

			const handled = config.onMoveDragEnd?.(dropResult, draggedIds, _dragOverId, e) ?? false;
			if (!handled && dropResult !== 'handled' && dropResult !== 'blocked') {
				config.ondrop?.(draggedIds, _dragOverId, e);
			}

			cancelGlobalDrag();
			_dragMode = 'none';
			_pendingDeselect = null;
			_dragOverId = null;
			return;
		}

		_dragMode = 'none';
		_pendingDeselect = null;
	}

	function handleKeydown(e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			const items = config.getItems();
			selection.selectAll(items.map(i => i.id));
			emitSelectionChange();
			return;
		}
		config.onkeyaction?.(e);
	}

	return {
		get selected(): Set<string> {
			return selection.selected;
		},
		get dragMode(): 'none' | 'select' | 'move' {
			return _dragMode;
		},
		get dragOverId(): string | null {
			return _dragOverId;
		},
		get dragSelectStart(): { x: number; y: number } {
			return _dragSelectStart;
		},
		get dragSelectEnd(): { x: number; y: number } {
			return _dragSelectEnd;
		},
		get lastClickedItemId(): string | null {
			return _lastClickedItemId;
		},
		isSelected(id: string): boolean {
			return selection.isSelected(id);
		},
		clearSelection(): void {
			selection.clear();
			emitSelectionChange();
		},
		selectSingle(id: string): void {
			selection.set(new Set([id]));
			emitSelectionChange();
		},
		setSelection(ids: Set<string>): void {
			selection.set(ids);
		},
		handlePress,
		handleClick,
		handleDblClick,
		handleDragStart,
		handleDragMove,
		handleDragEnd,
		handleKeydown,
	};
}
