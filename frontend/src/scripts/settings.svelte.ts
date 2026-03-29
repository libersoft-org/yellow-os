import { readFileText, writeFile, exists, readFileBlob } from './opfs.ts';
import { OS_PATH, WALLPAPERS_PATH, ensureOpfsReady } from './opfs-init.ts';
import { browser } from '$app/environment';
export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type NotificationAnimation = 'slide' | 'fade' | 'none';

export interface SystemSettings {
	wallpaper: string;
	desktopCount: number;
	taskbarShowText: boolean;
	notificationPosition: NotificationPosition;
	notificationDuration: number;
	notificationAnimation: NotificationAnimation;
}
const SETTINGS_FILE = 'settings.json';
const defaults: SystemSettings = {
	wallpaper: 'waves-dark.webp',
	desktopCount: 4,
	taskbarShowText: true,
	notificationPosition: 'bottom-right',
	notificationDuration: 10,
	notificationAnimation: 'slide',
};
export const settings: SystemSettings = $state({ ...defaults });
const _ready: { value: boolean } = $state({ value: false });
export const settingsReady: { readonly value: boolean } = _ready;
const _wallpaperUrl: { value: string } = $state({ value: '' });
export const wallpaperUrl: { readonly value: string } = _wallpaperUrl;
let currentBlobUrl: string | null = null;

async function updateWallpaperUrl(): Promise<void> {
	if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
	try {
		const file = await readFileBlob(WALLPAPERS_PATH, settings.wallpaper);
		currentBlobUrl = URL.createObjectURL(file);
		_wallpaperUrl.value = currentBlobUrl;
	} catch {
		currentBlobUrl = null;
		_wallpaperUrl.value = '';
	}
}

export async function loadSettings(): Promise<void> {
	if (_ready.value) return;
	await ensureOpfsReady();
	try {
		if (await exists(OS_PATH, SETTINGS_FILE)) {
			const text = await readFileText(OS_PATH, SETTINGS_FILE);
			const parsed = JSON.parse(text) as Partial<SystemSettings>;
			if (parsed.wallpaper !== undefined) settings.wallpaper = parsed.wallpaper;
			if (parsed.desktopCount !== undefined) settings.desktopCount = parsed.desktopCount;
			if (parsed.taskbarShowText !== undefined) settings.taskbarShowText = parsed.taskbarShowText;
			if (parsed.notificationPosition !== undefined) settings.notificationPosition = parsed.notificationPosition;
			if (parsed.notificationDuration !== undefined) settings.notificationDuration = parsed.notificationDuration;
			if (parsed.notificationAnimation !== undefined) settings.notificationAnimation = parsed.notificationAnimation;
		}
	} catch {
		// use defaults
	}
	await updateWallpaperUrl();
	_ready.value = true;
}

export async function saveSetting<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]): Promise<void> {
	settings[key] = value;
	if (key === 'wallpaper') await updateWallpaperUrl();
	await writeFile(OS_PATH, SETTINGS_FILE, JSON.stringify(settings, null, '\t'));
}

if (browser) loadSettings();
