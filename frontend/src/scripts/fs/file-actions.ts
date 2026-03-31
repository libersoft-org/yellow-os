import type { Component } from 'svelte';
import { deleteEntry, renameEntry, moveToTrash, createFile, createDirectory, uniqueName, isSystemEntry } from './opfs.ts';
import { showDialog, showErrorDialog } from '../ui/dialog.ts';
import { openWindow, findWindow, onWindowClosed } from '../window/window-store.svelte.ts';
import { notifyDirectoryChange } from './opfs-notify.ts';
import { showProgressDialog } from './file-progress.svelte.ts';
import NewEntryDialog from '../../apps/FileBrowser/NewEntryDialog.svelte';
import RenameDialog from '../../apps/FileBrowser/RenameDialog.svelte';

async function deleteMultiple(entries: { name: string; type: 'file' | 'directory' }[], action: (e: { name: string; type: 'file' | 'directory' }) => Promise<void>): Promise<string[]> {
	const { state: progress, close: closeProgress } = showProgressDialog('delete', entries.length);
	const failed: string[] = [];
	for (let i = 0; i < entries.length; i++) {
		if (progress.cancelled) break;
		const e = entries[i]!;
		progress.currentFile = e.name;
		progress.fileIndex = i;
		try {
			await action(e);
		} catch {
			failed.push(e.name);
		}
	}
	progress.fileIndex = entries.length;
	closeProgress();
	return failed;
}

function showDeleteErrors(action: string, failed: string[]): void {
	showErrorDialog(new Error(`Failed to ${action} ${failed.length} item${failed.length > 1 ? 's' : ''}: ${failed.join(', ')}`));
}

export function warnSystemMove(dirPath: string, names: string[]): string[] {
	const blocked = names.filter(n => isSystemEntry(dirPath, n));
	if (blocked.length > 0) showDialog({ title: 'Error', message: `"${blocked.join('", "')}" cannot be moved because it is a system directory.`, type: 'warning', buttons: [{ label: 'OK' }] });
	return names.filter(n => !isSystemEntry(dirPath, n));
}

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
						try {
							await deleteEntry(dirPath, entryName);
							notifyDirectoryChange(dirPath);
						} catch (err) {
							showErrorDialog(err);
						}
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
						try {
							await moveToTrash(dirPath, entryName);
							notifyDirectoryChange(dirPath);
							notifyDirectoryChange('/Trash');
						} catch (err) {
							showErrorDialog(err);
						}
					},
				},
				{ label: 'Cancel' },
			],
			...(onclosed ? { onclosed } : {}),
		});
	}
}

export function confirmDeleteMultiple(dirPath: string, entries: { name: string; type: 'file' | 'directory' }[], permanent: boolean, onclosed?: () => void): void {
	const deletable = entries.filter(e => !isSystemEntry(dirPath, e.name));
	const blocked = entries.filter(e => isSystemEntry(dirPath, e.name));
	if (blocked.length > 0) {
		showDialog({ title: 'Error', message: `"${blocked.map(e => e.name).join('", "')}" cannot be deleted because ${blocked.length === 1 ? 'it is a system directory' : 'they are system directories'}.`, type: 'warning', buttons: [{ label: 'OK' }] });
	}
	if (deletable.length === 0) {
		if (onclosed) onclosed();
		return;
	}
	if (deletable.length === 1) {
		confirmDelete(dirPath, deletable[0]!.name, deletable[0]!.type, permanent, onclosed);
		return;
	}
	const count = deletable.length;
	if (permanent) {
		showDialog({
			title: 'Permanently Delete',
			message: `Are you sure you want to permanently delete ${count} items? This action cannot be undone.`,
			type: 'question',
			buttons: [
				{
					label: 'Delete',
					backgroundColorVariable: '--color-danger',
					colorVariable: '--color-accent-fg',
					onclick: async () => {
						const failed = await deleteMultiple(deletable, e => deleteEntry(dirPath, e.name));
						notifyDirectoryChange(dirPath);
						if (failed.length > 0) showDeleteErrors('delete', failed);
					},
				},
				{ label: 'Cancel' },
			],
			...(onclosed ? { onclosed } : {}),
		});
	} else {
		showDialog({
			title: 'Delete',
			message: `Are you sure you want to move ${count} items to Trash?`,
			type: 'question',
			buttons: [
				{
					label: 'Move to Trash',
					backgroundColorVariable: '--color-danger',
					colorVariable: '--color-accent-fg',
					onclick: async () => {
						const failed = await deleteMultiple(deletable, e => moveToTrash(dirPath, e.name));
						notifyDirectoryChange(dirPath);
						notifyDirectoryChange('/Trash');
						if (failed.length > 0) showDeleteErrors('move to Trash', failed);
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
			try {
				await renameEntry(dirPath, entryName, newName);
				onrenamed?.(entryName, newName);
				notifyDirectoryChange(dirPath);
			} catch (err) {
				showErrorDialog(err);
			}
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
			try {
				const finalName = await uniqueName(dirPath, name);
				if (entryType === 'directory') await createDirectory(dirPath, finalName);
				else await createFile(dirPath, finalName);
				oncreated?.(finalName);
				notifyDirectoryChange(dirPath);
			} catch (err) {
				showErrorDialog(err);
			}
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
