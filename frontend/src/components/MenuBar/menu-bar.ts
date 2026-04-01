export interface MenuBarAction {
	label: string;
	shortcut?: string;
	disabled?: boolean;
	checked?: boolean;
	onclick: () => void;
}
export interface MenuBarSeparator {
	separator: true;
}
export type MenuBarSubmenuEntry = MenuBarAction | MenuBarSeparator;
export interface MenuBarMenu {
	label: string;
	items: MenuBarSubmenuEntry[];
}
