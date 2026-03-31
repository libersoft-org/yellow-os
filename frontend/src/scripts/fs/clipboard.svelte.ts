import { notifyDirectoryChange } from './opfs-notify.ts';
import { copyWithConflicts, moveWithConflicts } from './file-conflict.ts';
export type ClipboardMode = 'copy' | 'cut';
export type ClipboardOwner = 'files' | 'text';
interface ClipboardEntry {
	path: string;
	name: string;
	type: 'file' | 'directory';
}
let clipboardEntries: ClipboardEntry[] = $state([]);
let clipboardMode: ClipboardMode = $state('copy');
let clipboardOwner: ClipboardOwner = $state('files');

export function getClipboardOwner(): ClipboardOwner {
	return clipboardOwner;
}

export function setClipboardOwner(owner: ClipboardOwner): void {
	clipboardOwner = owner;
	if (owner === 'text') clipboardEntries = [];
}

export function getClipboard(): { entries: ClipboardEntry[]; mode: ClipboardMode } {
	return { entries: clipboardEntries, mode: clipboardMode };
}

export function hasClipboard(): boolean {
	return clipboardOwner === 'files' && clipboardEntries.length > 0;
}

export function setClipboard(entries: ClipboardEntry[], mode: ClipboardMode): void {
	clipboardEntries = entries;
	clipboardMode = mode;
	clipboardOwner = 'files';
}

export function clearClipboard(): void {
	clipboardEntries = [];
}

export async function pasteClipboard(destPath: string): Promise<Map<string, string>> {
	if (clipboardEntries.length === 0) return new Map();
	const mode = clipboardMode;
	const entries = [...clipboardEntries];
	if (mode === 'cut') clearClipboard();
	const conflictEntries = entries.map(e => ({ sourcePath: e.path, name: e.name }));
	let nameMap: Map<string, string>;
	if (mode === 'cut') {
		nameMap = await moveWithConflicts(conflictEntries, destPath);
	} else {
		nameMap = await copyWithConflicts(conflictEntries, destPath);
	}
	const sourcePaths = new Set(entries.map(e => e.path));
	notifyDirectoryChange(destPath);
	if (mode === 'cut') {
		for (const p of sourcePaths) notifyDirectoryChange(p);
	}
	return nameMap;
}
