import { readFileText, writeFile, exists, readFileBlob } from '../fs/opfs.ts';
import { OS_PATH, WALLPAPERS_PATH, ensureOpfsReady } from '../fs/opfs-init.ts';
import { browser } from '$app/environment';
export type WallpaperMode = 'image' | 'color';
export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type NotificationAnimation = 'slide' | 'fade' | 'none';

export interface SystemSettings {
	wallpaper: string;
	wallpaperPath: string;
	wallpaperMode: WallpaperMode;
	wallpaperColor: string;
	desktopCount: number;
	desktopTrash: boolean;
	taskbarShowText: boolean;
	notificationPosition: NotificationPosition;
	notificationDuration: number;
	notificationAnimation: NotificationAnimation;
}
const SETTINGS_FILE = 'settings.json';
const defaults: SystemSettings = {
	wallpaper: 'waves-dark.webp',
	wallpaperPath: '',
	wallpaperMode: 'image',
	wallpaperColor: '#1a1a2e',
	desktopCount: 4,
	desktopTrash: true,
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
		const dir = settings.wallpaperPath || WALLPAPERS_PATH;
		const file = await readFileBlob(dir, settings.wallpaper);
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
			if (parsed.wallpaperPath !== undefined) settings.wallpaperPath = parsed.wallpaperPath;
			if (parsed.wallpaperMode !== undefined) settings.wallpaperMode = parsed.wallpaperMode;
			if (parsed.wallpaperColor !== undefined) settings.wallpaperColor = parsed.wallpaperColor;
			if (parsed.desktopCount !== undefined) settings.desktopCount = parsed.desktopCount;
			if (parsed.desktopTrash !== undefined) settings.desktopTrash = parsed.desktopTrash;
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
	if (key === 'wallpaper' || key === 'wallpaperPath' || key === 'wallpaperMode') await updateWallpaperUrl();
	await writeFile(OS_PATH, SETTINGS_FILE, JSON.stringify(settings, null, '\t'));
}

if (browser) loadSettings();
