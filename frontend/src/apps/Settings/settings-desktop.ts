import { saveSetting } from '../../scripts/system/settings.svelte.ts';
import type { WallpaperMode } from '../../scripts/system/settings.svelte.ts';
import { readDirectory, readFileBlob } from '../../scripts/fs/opfs.ts';
import { WALLPAPERS_PATH } from '../../scripts/fs/opfs-init.ts';
import { showOpenDialog } from '../../components/Storage/storage.svelte.ts';
import { showDialog } from '../../scripts/ui/dialog.ts';
import { isImageFile } from '../ImageViewer/image-viewer.ts';
export interface WallpaperItem {
	filename: string;
	label: string;
	blobUrl: string;
	path: string;
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
				path: '',
			});
		} catch {
			/* skip unreadable */
		}
	}
	return items;
}

export function selectWallpaper(filename: string, path: string = ''): void {
	saveSetting('wallpaperPath', path);
	saveSetting('wallpaper', filename);
	saveSetting('wallpaperMode', 'image');
}

export function setWallpaperMode(mode: WallpaperMode): void {
	saveSetting('wallpaperMode', mode);
}

export function setWallpaperColor(color: string): void {
	saveSetting('wallpaperColor', color);
}

export function setDesktopTrash(enabled: boolean): void {
	saveSetting('desktopTrash', enabled);
}

export async function importWallpaperFromDialog(): Promise<WallpaperItem | null> {
	const result = await showOpenDialog({ title: 'Select Wallpaper Image' });
	if (!result) return null;
	if (!isImageFile(result.name)) {
		showDialog({ title: 'Invalid file', message: `"${result.name}" is not a supported image file.`, type: 'error', buttons: [{ label: 'OK' }] });
		return null;
	}
	const blob = await readFileBlob(result.path, result.name);
	saveSetting('wallpaperPath', result.path);
	saveSetting('wallpaper', result.name);
	saveSetting('wallpaperMode', 'image');
	return {
		filename: result.name,
		label: result.name,
		blobUrl: URL.createObjectURL(blob),
		path: result.path,
	};
}
