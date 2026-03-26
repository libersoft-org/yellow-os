import type { Component } from 'svelte';
import { openWindow, findWindow } from './window-store.svelte.ts';
export type DialogType = 'info' | 'warning' | 'error' | 'question';
export interface DialogButton {
	label: string;
	onclick?: () => void;
	colorVariable?: string;
	backgroundColorVariable?: string;
}
export interface DialogOptions {
	title?: string;
	message: string;
	type?: DialogType;
	buttons?: DialogButton[];
}
const DEFAULT_BUTTONS: DialogButton[] = [{ label: 'OK', backgroundColorVariable: '--color-accent', colorVariable: '--color-accent-fg' }];
const TYPE_ICONS: Record<DialogType, string> = {
	info: '/img/dialog/info.svg',
	warning: '/img/dialog/warning.svg',
	error: '/img/dialog/error.svg',
	question: '/img/dialog/question.svg',
};
const TYPE_COLOR_VARIABLES: Record<DialogType, string> = {
	info: '--color-accent',
	warning: '--color-warning',
	error: '--color-danger',
	question: '--color-accent',
};
let _dialogComponent: Component<any> | null = null;

export function registerDialogComponent(component: Component<any>): void {
	_dialogComponent = component;
}

export function getTypeIcon(type: DialogType): string {
	return TYPE_ICONS[type];
}

export function getTypeColorVariable(type: DialogType): string {
	return TYPE_COLOR_VARIABLES[type];
}

export function showDialog(options: DialogOptions): void {
	if (!_dialogComponent) throw new Error('Dialog component not registered');
	const type = options.type ?? 'info';
	const buttons = options.buttons ?? DEFAULT_BUTTONS;

	const windowId = openWindow(_dialogComponent!, {
		message: options.message,
		type,
		buttons,
		windowId: null as string | null,
	});

	const win = findWindow(windowId);
	if (win) {
		win.title = options.title ?? (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'question' ? 'Question' : 'Information');
		win.icon = TYPE_ICONS[type];
		win.width = 400;
		win.height = 160;
		win.minWidth = 300;
		win.minHeight = 130;
		win.position = 'center';
		win.canMinimize = false;
		win.canMaximize = false;
		win.resizable = false;
		win.showInTaskbar = false;
	}
}
