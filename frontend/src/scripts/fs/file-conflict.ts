import type { Component } from 'svelte';
import { exists, copyEntryTo, copyEntryReplace, moveEntry, moveEntryReplace, writeFile, createDirectory, deleteEntry } from './opfs.ts';
import { notifyDirectoryChange } from './opfs-notify.ts';
import { openWindow, findWindow, onWindowClosed } from '../window/window-store.svelte.ts';
import { showErrorDialog } from '../ui/dialog.ts';
export type ConflictResolution = 'replace' | 'rename' | 'skip' | 'cancel';
interface ConflictEntry {
	sourcePath: string;
	name: string;
}
let _conflictDialogComponent: Component<any> | null = null;

export function registerConflictDialog(component: Component<any>): void {
	_conflictDialogComponent = component;
}

function showConflictDialog(fileName: string, remaining: number): Promise<{ resolution: ConflictResolution; applyToAll: boolean }> {
	return new Promise(resolve => {
		if (!_conflictDialogComponent) {
			resolve({ resolution: 'rename', applyToAll: true });
			return;
		}
		let resolved = false;
		const windowId = openWindow(_conflictDialogComponent!, {
			fileName,
			remaining,
			onresolution: (resolution: ConflictResolution, applyToAll: boolean) => {
				resolved = true;
				resolve({ resolution, applyToAll });
			},
		});
		const win = findWindow(windowId);
		if (win) {
			win.title = 'File Conflict';
			win.icon = '/img/dialog/question.svg';
			win.width = 480;
			win.height = 200;
			win.minWidth = 400;
			win.minHeight = 180;
			win.position = 'center';
			win.canMinimize = false;
			win.canMaximize = false;
			win.resizable = false;
			win.showInTaskbar = false;
		}
		onWindowClosed(windowId, () => {
			if (!resolved) resolve({ resolution: 'cancel', applyToAll: false });
		});
	});
}

export async function copyWithConflicts(entries: ConflictEntry[], destPath: string): Promise<Map<string, string>> {
	const nameMap = new Map<string, string>();
	let globalResolution: ConflictResolution | null = null;
	const conflicts: boolean[] = [];
	for (const entry of entries) conflicts.push(await exists(destPath, entry.name));
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]!;
		const hasConflict = conflicts[i]!;
		if (!hasConflict) {
			try {
				const finalName = await copyEntryTo(entry.sourcePath, entry.name, destPath);
				nameMap.set(entry.name, finalName);
			} catch (err) {
				showErrorDialog(err);
			}
			continue;
		}
		let resolution: ConflictResolution | null = globalResolution;
		if (!resolution) {
			const remaining = conflicts.slice(i + 1).filter(Boolean).length;
			const result = await showConflictDialog(entry.name, remaining);
			resolution = result.resolution;
			if (result.applyToAll) globalResolution = resolution;
		}
		if (resolution === 'cancel') break;
		if (resolution === 'skip') continue;
		try {
			if (resolution === 'replace') {
				await copyEntryReplace(entry.sourcePath, entry.name, destPath);
				nameMap.set(entry.name, entry.name);
			} else {
				const finalName = await copyEntryTo(entry.sourcePath, entry.name, destPath);
				nameMap.set(entry.name, finalName);
			}
		} catch (err) {
			showErrorDialog(err);
		}
	}
	return nameMap;
}

export async function moveWithConflicts(entries: ConflictEntry[], destPath: string): Promise<Map<string, string>> {
	const nameMap = new Map<string, string>();
	let globalResolution: ConflictResolution | null = null;
	const conflicts: boolean[] = [];
	for (const entry of entries) {
		if (entry.sourcePath === destPath) conflicts.push(false);
		else conflicts.push(await exists(destPath, entry.name));
	}
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]!;
		const hasConflict = conflicts[i]!;
		if (entry.sourcePath === destPath) {
			nameMap.set(entry.name, entry.name);
			continue;
		}
		if (!hasConflict) {
			try {
				const finalName = await moveEntry(entry.sourcePath, entry.name, destPath);
				nameMap.set(entry.name, finalName);
			} catch (err) {
				showErrorDialog(err);
			}
			continue;
		}
		let resolution: ConflictResolution | null = globalResolution;
		if (!resolution) {
			const remaining = conflicts.slice(i + 1).filter(Boolean).length;
			const result = await showConflictDialog(entry.name, remaining);
			resolution = result.resolution;
			if (result.applyToAll) globalResolution = resolution;
		}
		if (resolution === 'cancel') break;
		if (resolution === 'skip') continue;
		try {
			if (resolution === 'replace') {
				await moveEntryReplace(entry.sourcePath, entry.name, destPath);
				nameMap.set(entry.name, entry.name);
			} else {
				const finalName = await moveEntry(entry.sourcePath, entry.name, destPath);
				nameMap.set(entry.name, finalName);
			}
		} catch (err) {
			showErrorDialog(err);
		}
	}
	return nameMap;
}

function readFileSystemEntry(entry: FileSystemFileEntry): Promise<File> {
	return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function readDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
	return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

async function getAllDirectoryEntries(dirEntry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
	const reader = dirEntry.createReader();
	const all: FileSystemEntry[] = [];
	let batch: FileSystemEntry[];
	do {
		batch = await readDirectoryEntries(reader);
		all.push(...batch);
	} while (batch.length > 0);
	return all;
}

async function uploadEntry(entry: FileSystemEntry, destPath: string, globalRes: { value: ConflictResolution | null }, cancelled: { value: boolean }): Promise<void> {
	if (cancelled.value) return;
	if (entry.isFile) {
		const file = await readFileSystemEntry(entry as FileSystemFileEntry);
		const hasConflict = await exists(destPath, entry.name);
		if (hasConflict) {
			let resolution = globalRes.value;
			if (!resolution) {
				const result = await showConflictDialog(entry.name, 0);
				resolution = result.resolution;
				if (result.applyToAll) globalRes.value = resolution;
			}
			if (resolution === 'cancel') {
				cancelled.value = true;
				return;
			}
			if (resolution === 'skip') return;
			if (resolution === 'replace') await deleteEntry(destPath, entry.name);
		}
		await writeFile(destPath, entry.name, file);
	} else if (entry.isDirectory) {
		const dirEntry = entry as FileSystemDirectoryEntry;
		const subPath = destPath + '/' + entry.name;
		if (!(await exists(destPath, entry.name))) await createDirectory(destPath, entry.name);
		const children = await getAllDirectoryEntries(dirEntry);
		for (const child of children) {
			await uploadEntry(child, subPath, globalRes, cancelled);
			if (cancelled.value) return;
		}
	}
}

export async function uploadNativeFiles(dataTransfer: DataTransfer, destPath: string): Promise<void> {
	const globalRes = { value: null as ConflictResolution | null };
	const cancelled = { value: false };
	const fsEntries: FileSystemEntry[] = [];
	for (let i = 0; i < dataTransfer.items.length; i++) {
		const item = dataTransfer.items[i]!;
		const entry = item.webkitGetAsEntry?.();
		if (entry) fsEntries.push(entry);
	}
	if (fsEntries.length > 0) {
		for (const entry of fsEntries) {
			await uploadEntry(entry, destPath, globalRes, cancelled);
			if (cancelled.value) break;
		}
	} else {
		const files = dataTransfer.files;
		for (let i = 0; i < files.length; i++) {
			const file = files[i]!;
			const hasConflict = await exists(destPath, file.name);
			if (hasConflict) {
				let resolution = globalRes.value;
				if (!resolution) {
					const result = await showConflictDialog(file.name, 0);
					resolution = result.resolution;
					if (result.applyToAll) globalRes.value = resolution;
				}
				if (resolution === 'cancel') break;
				if (resolution === 'skip') continue;
				if (resolution === 'replace') await deleteEntry(destPath, file.name);
			}
			await writeFile(destPath, file.name, file);
		}
	}
	notifyDirectoryChange(destPath);
}
