import type { OpfsEntry } from '../../scripts/opfs.ts';
import { isLinkFile } from '../../scripts/link.ts';
import { isYappFile } from '../AppPlayer/app-player.ts';

export interface FileEntry extends OpfsEntry {
	linkIcon?: string;
}

export function entryIcon(entry: FileEntry): string {
	if (entry.type === 'directory') return '/img/directory.svg';
	if (isLinkFile(entry.name)) return entry.linkIcon ?? '/img/shortcut.svg';
	if (isYappFile(entry.name)) return '/img/apps/app-player.svg';
	return '/img/file.svg';
}

export function entryIconColor(entry: FileEntry): string {
	if (entry.type === 'directory') return '--color-accent';
	if (isYappFile(entry.name)) return '--color-accent';
	return '--color-text-dim';
}

export interface DiskInfo {
	name: string;
	path: string;
	icon: string;
	total: number;
	free: number;
}
