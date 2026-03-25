import type { OpfsEntry } from '../../scripts/opfs.ts';
import { isLinkFile } from '../../scripts/link.ts';

export interface FileEntry extends OpfsEntry {
	linkIcon?: string;
}

export function entryIcon(entry: FileEntry): string {
	if (entry.type === 'directory') return '/img/directory.svg';
	if (isLinkFile(entry.name)) return entry.linkIcon ?? '/img/shortcut.svg';
	return '/img/file.svg';
}

export function entryIconColor(entry: FileEntry): string {
	return entry.type === 'directory' ? '--color-accent' : '--color-text-dim';
}

export interface DiskInfo {
	name: string;
	path: string;
	icon: string;
	total: number;
	free: number;
}
