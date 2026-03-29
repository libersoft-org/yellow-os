/**
 * Reusable selection logic for icon grids, lists etc.
 * Handles single select, Ctrl+toggle, Shift+range, click-outside deselect, Ctrl+A.
 */

/** Compute next selection after clicking an item. */
export function computeClickSelection(current: Set<string>, id: string, index: number, allIds: string[], lastClickedIndex: number, e: MouseEvent | KeyboardEvent): { selected: Set<string>; lastClickedIndex: number } {
	if (e.shiftKey && lastClickedIndex >= 0) {
		const from = Math.min(lastClickedIndex, index);
		const to = Math.max(lastClickedIndex, index);
		const range = allIds.slice(from, to + 1);
		if (e.ctrlKey || e.metaKey) {
			const next = new Set(current);
			for (const r of range) next.add(r);
			return { selected: next, lastClickedIndex };
		}
		return { selected: new Set(range), lastClickedIndex };
	}
	if (e.ctrlKey || e.metaKey) {
		const next = new Set(current);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		return { selected: next, lastClickedIndex: index };
	}
	return {
		selected: current.size === 1 && current.has(id) ? new Set() : new Set([id]),
		lastClickedIndex: index,
	};
}

export interface Selection {
	readonly selected: Set<string>;
	select(id: string, index: number, allIds: string[], e: MouseEvent | KeyboardEvent): void;
	selectAll(allIds: string[]): void;
	clear(): void;
	isSelected(id: string): boolean;
	set(newSelected: Set<string>): void;
}

/** Self-contained selection state — for components that own their selection. */
export function createSelection(): Selection {
	let selected = $state(new Set<string>());
	let lastClickedIndex = -1;

	return {
		get selected() {
			return selected;
		},
		select(id: string, index: number, allIds: string[], e: MouseEvent | KeyboardEvent) {
			const result = computeClickSelection(selected, id, index, allIds, lastClickedIndex, e);
			selected = result.selected;
			lastClickedIndex = result.lastClickedIndex;
		},
		selectAll(allIds: string[]) {
			selected = new Set(allIds);
		},
		clear() {
			selected = new Set();
			lastClickedIndex = -1;
		},
		isSelected(id: string): boolean {
			return selected.has(id);
		},
		set(newSelected: Set<string>) {
			selected = newSelected;
		},
	};
}
