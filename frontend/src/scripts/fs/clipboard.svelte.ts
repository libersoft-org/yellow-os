import { notifyDirectoryChange } from './opfs-notify.ts';
import { copyWithConflicts, moveWithConflicts } from './file-conflict.ts';
export type ClipboardMode = 'copy' | 'cut';
export type ClipboardOwner = 'files' | 'text';
interface ClipboardEntry {
	path: string;
	name: string;
	type: 'file' | 'directory';
}

class ClipboardState {
	entries: ClipboardEntry[] = $state([]);
	mode: ClipboardMode = $state('copy');
	owner: ClipboardOwner = $state('files');
}

const clipboard = new ClipboardState();

export function getClipboardOwner(): ClipboardOwner {
	return clipboard.owner;
}

export function setClipboardOwner(owner: ClipboardOwner): void {
	clipboard.owner = owner;
	if (owner === 'text') clipboard.entries = [];
}

export function getClipboard(): { entries: ClipboardEntry[]; mode: ClipboardMode } {
	return { entries: clipboard.entries, mode: clipboard.mode };
}

export function hasClipboard(): boolean {
	return clipboard.owner === 'files' && clipboard.entries.length > 0;
}

export function setClipboard(entries: ClipboardEntry[], mode: ClipboardMode): void {
	clipboard.entries = entries;
	clipboard.mode = mode;
	clipboard.owner = 'files';
}

export function clearClipboard(): void {
	clipboard.entries = [];
}

export async function pasteClipboard(destPath: string): Promise<Map<string, string>> {
	if (clipboard.entries.length === 0) return new Map();
	const mode = clipboard.mode;
	const entries = [...clipboard.entries];
	if (mode === 'cut') clearClipboard();
	const conflictEntries = entries.map(e => ({ sourcePath: e.path, name: e.name }));
	let nameMap: Map<string, string>;
	if (mode === 'cut') nameMap = await moveWithConflicts(conflictEntries, destPath);
	else nameMap = await copyWithConflicts(conflictEntries, destPath);
	const sourcePaths = new Set(entries.map(e => e.path));
	notifyDirectoryChange(destPath);
	if (mode === 'cut') {
		for (const p of sourcePaths) notifyDirectoryChange(p);
	}
	return nameMap;
}
