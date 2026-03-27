import type { OpfsEntry } from './opfs.ts';
import { readDirectory } from './opfs.ts';
import { isLinkFile, readLink } from './link.ts';
import { isYappFile } from '../apps/AppPlayer/app-player.ts';

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

export async function loadDirectoryEntries(path: string): Promise<FileEntry[]> {
	const raw = await readDirectory(path);
	for (const entry of raw) {
		if (entry.type === 'file' && isLinkFile(entry.name)) {
			const linkData = await readLink(path, entry.name);
			if (linkData?.icon) (entry as FileEntry).linkIcon = linkData.icon;
		}
	}
	return raw as FileEntry[];
}
