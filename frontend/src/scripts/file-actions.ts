import type { Component } from 'svelte';
import { deleteEntry, renameEntry, moveToTrash, createFile, createDirectory, uniqueName, isSystemEntry } from './opfs.ts';
import { showDialog } from './dialog.ts';
import { openWindow, findWindow, onWindowClosed } from './window-store.svelte.ts';
import { notifyDirectoryChange } from './opfs-notify.ts';
import NewEntryDialog from '../apps/FileBrowser/NewEntryDialog.svelte';
import RenameDialog from '../apps/FileBrowser/RenameDialog.svelte';

export function confirmDelete(dirPath: string, entryName: string, entryType: 'file' | 'directory', permanent: boolean, onclosed?: () => void): void {
	if (isSystemEntry(dirPath, entryName)) {
		showDialog({ title: 'Error', message: `"${entryName}" is a system directory and cannot be deleted.`, type: 'warning', buttons: [{ label: 'OK' }], ...(onclosed ? { onclosed } : {}) });
		return;
	}
	const typeLabel = entryType === 'directory' ? 'directory' : 'file';
	if (permanent) {
		showDialog({
			title: 'Permanently Delete',
			message: `Are you sure you want to permanently delete ${typeLabel} "${entryName}"? This action cannot be undone.`,
			type: 'question',
			buttons: [
				{
					label: 'Delete',
					backgroundColorVariable: '--color-danger',
					colorVariable: '--color-accent-fg',
					onclick: async () => {
						await deleteEntry(dirPath, entryName);
						notifyDirectoryChange(dirPath);
					},
				},
				{ label: 'Cancel' },
			],
			...(onclosed ? { onclosed } : {}),
		});
	} else {
		showDialog({
			title: 'Delete',
			message: `Are you sure you want to move ${typeLabel} "${entryName}" to Trash?`,
			type: 'question',
			buttons: [
				{
					label: 'Move to Trash',
					backgroundColorVariable: '--color-danger',
					colorVariable: '--color-accent-fg',
					onclick: async () => {
						await moveToTrash(dirPath, entryName);
						notifyDirectoryChange(dirPath);
						notifyDirectoryChange('/Trash');
					},
				},
				{ label: 'Cancel' },
			],
			...(onclosed ? { onclosed } : {}),
		});
	}
}

export function openRenameDialog(dirPath: string, entryName: string, entryType: 'file' | 'directory', onrenamed?: (oldName: string, newName: string) => void, onclosed?: () => void): void {
	if (isSystemEntry(dirPath, entryName)) {
		showDialog({ title: 'Error', message: `"${entryName}" is a system directory and cannot be renamed.`, type: 'warning', buttons: [{ label: 'OK' }], ...(onclosed ? { onclosed } : {}) });
		return;
	}
	const windowId = openWindow(RenameDialog as Component, {
		entryType,
		currentName: entryName,
		onrename: async (newName: string) => {
			await renameEntry(dirPath, entryName, newName);
			onrenamed?.(entryName, newName);
			notifyDirectoryChange(dirPath);
		},
	});
	const dialogWin = findWindow(windowId);
	if (dialogWin) {
		dialogWin.title = 'Rename';
		dialogWin.icon = '/img/rename.svg';
		dialogWin.width = 400;
		dialogWin.height = 180;
		dialogWin.minWidth = 300;
		dialogWin.minHeight = 160;
		dialogWin.position = 'center';
		dialogWin.canMinimize = false;
		dialogWin.canMaximize = false;
		dialogWin.resizable = false;
		dialogWin.showInTaskbar = false;
	}
	if (onclosed) onWindowClosed(windowId, onclosed);
}

export function openNewEntryDialog(dirPath: string, entryType: 'file' | 'directory', oncreated?: (finalName: string) => void): void {
	const windowId = openWindow(NewEntryDialog as Component, {
		entryType,
		oncreate: async (name: string) => {
			const finalName = await uniqueName(dirPath, name);
			if (entryType === 'directory') await createDirectory(dirPath, finalName);
			else await createFile(dirPath, finalName);
			oncreated?.(finalName);
			notifyDirectoryChange(dirPath);
		},
	});
	const dialogWin = findWindow(windowId);
	if (dialogWin) {
		dialogWin.title = entryType === 'directory' ? 'New Directory' : 'New File';
		dialogWin.icon = entryType === 'directory' ? '/img/directory.svg' : '/img/file.svg';
		dialogWin.width = 400;
		dialogWin.height = 180;
		dialogWin.minWidth = 300;
		dialogWin.minHeight = 160;
		dialogWin.position = 'center';
		dialogWin.canMinimize = false;
		dialogWin.canMaximize = false;
		dialogWin.resizable = false;
		dialogWin.showInTaskbar = false;
	}
}
