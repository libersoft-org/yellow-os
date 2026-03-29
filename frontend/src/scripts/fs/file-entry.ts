import type { OpfsEntry } from './opfs.ts';
import { readDirectory } from './opfs.ts';
import { isLinkFile, readLink } from './link.ts';
import { isYappFile, readYappManifest, resolveYappIcon } from '../../apps/AppPlayer/app-player.ts';
import { OS_NAME } from './opfs.ts';

export interface FileEntry extends OpfsEntry {
	linkIcon?: string;
	yappIcon?: string;
}

const SYSTEM_DIR_ICONS: Record<string, string> = {
	Trash: '/img/apps/trash.svg',
	[OS_NAME]: '/img/logo.svg',
};

export function entryIcon(entry: FileEntry): string {
	if (entry.type === 'directory') return SYSTEM_DIR_ICONS[entry.name] ?? '/img/directory.svg';
	if (isLinkFile(entry.name)) return entry.linkIcon ?? '/img/shortcut.svg';
	if (isYappFile(entry.name)) return entry.yappIcon ?? '/img/apps/app-player.svg';
	return '/img/file.svg';
}

export function entryIconColor(entry: FileEntry): string {
	if (entry.type === 'directory') return '--color-accent';
	if (isYappFile(entry.name)) return '--color-accent';
	return '--color-text-dim';
}

export async function loadDirectoryEntries(path: string): Promise<FileEntry[]> {
	const raw = await readDirectory(path);
	await Promise.all(
		raw.map(async entry => {
			if (entry.type === 'file' && isLinkFile(entry.name)) {
				const linkData = await readLink(path, entry.name);
				if (linkData?.icon) (entry as FileEntry).linkIcon = linkData.icon;
			} else if (entry.type === 'file' && isYappFile(entry.name)) {
				try {
					const manifest = await readYappManifest(path, entry.name);
					if (manifest?.icon) (entry as FileEntry).yappIcon = await resolveYappIcon(path, manifest.icon);
				} catch {
					/* use default icon */
				}
			}
		})
	);
	return raw as FileEntry[];
}
