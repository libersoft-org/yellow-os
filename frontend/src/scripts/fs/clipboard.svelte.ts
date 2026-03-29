import { copyEntryTo, moveEntry } from './opfs.ts';
import { notifyDirectoryChange } from './opfs-notify.ts';
export type ClipboardMode = 'copy' | 'cut';
interface ClipboardEntry {
	path: string;
	name: string;
	type: 'file' | 'directory';
}
let clipboardEntries: ClipboardEntry[] = $state([]);
let clipboardMode: ClipboardMode = $state('copy');

export function getClipboard(): { entries: ClipboardEntry[]; mode: ClipboardMode } {
	return { entries: clipboardEntries, mode: clipboardMode };
}

export function hasClipboard(): boolean {
	return clipboardEntries.length > 0;
}

export function setClipboard(entries: ClipboardEntry[], mode: ClipboardMode): void {
	clipboardEntries = entries;
	clipboardMode = mode;
}

export function clearClipboard(): void {
	clipboardEntries = [];
}

export async function pasteClipboard(destPath: string): Promise<void> {
	if (clipboardEntries.length === 0) return;
	const mode = clipboardMode;
	const entries = [...clipboardEntries];
	if (mode === 'cut') clearClipboard();
	const sourcePaths = new Set<string>();
	for (const entry of entries) {
		sourcePaths.add(entry.path);
		if (mode === 'cut') await moveEntry(entry.path, entry.name, destPath);
		else await copyEntryTo(entry.path, entry.name, destPath);
	}
	notifyDirectoryChange(destPath);
	if (mode === 'cut') {
		for (const p of sourcePaths) notifyDirectoryChange(p);
	}
}
