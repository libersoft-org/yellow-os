import { saveSetting } from '../../scripts/system/settings.svelte.ts';
import { readDirectory, readFileBlob } from '../../scripts/fs/opfs.ts';
import { WALLPAPERS_PATH } from '../../scripts/fs/opfs-init.ts';

export interface WallpaperItem {
	filename: string;
	label: string;
	blobUrl: string;
}

export async function loadWallpapers(): Promise<WallpaperItem[]> {
	const entries = await readDirectory(WALLPAPERS_PATH);
	const items: WallpaperItem[] = [];
	for (const entry of entries) {
		if (entry.type !== 'file') continue;
		try {
			const file = await readFileBlob(WALLPAPERS_PATH, entry.name);
			items.push({
				filename: entry.name,
				label: entry.name,
				blobUrl: URL.createObjectURL(file),
			});
		} catch {
			/* skip unreadable */
		}
	}
	return items;
}

export function selectWallpaper(filename: string): void {
	saveSetting('wallpaper', filename);
}

export function setDesktopTrash(enabled: boolean): void {
	saveSetting('desktopTrash', enabled);
}
