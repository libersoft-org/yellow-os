import type { Component } from 'svelte';
import { openWindow, findWindow, closeWindow, onWindowClosed } from '../window/window-store.svelte.ts';

export type OperationType = 'copy' | 'move' | 'delete' | 'upload';

export interface ProgressState {
	type: OperationType;
	currentFile: string;
	fileIndex: number;
	fileCount: number;
	bytesCopied: number;
	bytesTotal: number;
	cancelled: boolean;
	startTime: number;
}

let _progressComponent: Component<any> | null = null;

const _emptyState: ProgressState = {
	type: 'copy',
	currentFile: '',
	fileIndex: 0,
	fileCount: 0,
	bytesCopied: 0,
	bytesTotal: 0,
	cancelled: false,
	startTime: 0,
};

let _progress: ProgressState = $state({ ..._emptyState });

export function getProgress(): ProgressState {
	return _progress;
}

export function registerProgressDialog(component: Component<any>): void {
	_progressComponent = component;
}

export function showProgressDialog(type: OperationType, fileCount: number): { state: ProgressState; close: () => void } {
	_progress.type = type;
	_progress.currentFile = '';
	_progress.fileIndex = 0;
	_progress.fileCount = fileCount;
	_progress.bytesCopied = 0;
	_progress.bytesTotal = 0;
	_progress.cancelled = false;
	_progress.startTime = Date.now();

	if (!_progressComponent) return { state: _progress, close(): void {} };

	const windowId = openWindow(_progressComponent!, {
		oncancel(): void {
			_progress.cancelled = true;
		},
	});

	const win = findWindow(windowId);
	if (win) {
		const titles: Record<OperationType, string> = {
			copy: 'Copying...',
			move: 'Moving...',
			delete: 'Deleting...',
			upload: 'Uploading...',
		};
		win.title = titles[type];
		win.icon = '/img/dialog/info.svg';
		win.width = 450;
		win.height = 200;
		win.minWidth = 400;
		win.minHeight = 180;
		win.position = 'center';
		win.canMinimize = false;
		win.canMaximize = false;
		win.resizable = false;
		win.showInTaskbar = true;
	}

	let closed = false;
	onWindowClosed(windowId, () => {
		closed = true;
		_progress.cancelled = true;
	});

	return {
		state: _progress,
		close(): void {
			if (!closed) closeWindow(windowId);
		},
	};
}
