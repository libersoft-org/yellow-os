export interface ContextMenuAction {
	icon?: string | undefined;
	label: string;
	onclick: () => void;
}

export interface ContextMenuSeparator {
	separator: true;
}

export interface ContextMenuCategory {
	icon?: string | undefined;
	label: string;
	children: ContextMenuItem[];
}

export type ContextMenuItem = ContextMenuAction | ContextMenuSeparator | ContextMenuCategory;

export function isSeparator(item: ContextMenuItem): item is ContextMenuSeparator {
	return 'separator' in item;
}

export function isCategory(item: ContextMenuItem): item is ContextMenuCategory {
	return 'children' in item;
}
