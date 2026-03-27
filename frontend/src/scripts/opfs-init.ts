import { createDirectory, directoryExists, writeFile, readDirectory, exists } from './opfs.ts';
import type { LinkData } from './link.ts';
const OS_NAME = 'YellowOS';
export const OS_PATH = '/' + OS_NAME;
export const WALLPAPERS_PATH = OS_PATH + '/Wallpapers';
const ROOT_DIRS = [OS_NAME, 'Trash'];
const OS_SUBDIRS = ['Desktop', 'TaskbarMenu', 'Wallpapers'];
const defaultFileTypes: Record<string, string> = {
	txt: 'text-editor',
	md: 'text-editor',
	json: 'text-editor',
	csv: 'text-editor',
	log: 'text-editor',
	xml: 'text-editor',
	html: 'text-editor',
	css: 'text-editor',
	js: 'text-editor',
	ts: 'text-editor',
	yapp: 'app-player',
};
const defaultDesktopLinks: LinkData[] = [
	{ appId: 'file-browser', label: 'File Browser', icon: '/img/apps/file-browser.svg' },
	{ appId: 'file-browser', label: 'Trash', icon: '/img/apps/trash.svg', props: { path: '/Trash' } },
	{ appId: 'settings', label: 'Settings', icon: '/img/apps/settings.svg' },
];
const defaultTaskbarMenuStructure: Record<string, LinkData[]> = {
	Programs: [
		{ appId: 'file-browser', label: 'File Browser', icon: '/img/apps/file-browser.svg' },
		{ appId: 'app-player', label: 'App Player', icon: '/img/apps/app-player.svg' },
		{ appId: 'calculator', label: 'Calculator', icon: '/img/apps/calculator.svg' },
		{ appId: 'text-editor', label: 'Text Editor', icon: '/img/apps/text-editor.svg' },
	],
	Games: [
		{ appId: 'pong', label: 'Pong', icon: '/img/apps/pong.svg' },
		{ appId: 'snake', label: 'Snake', icon: '/img/apps/snake.svg' },
	],
};
const defaultWallpapers = ['waves-dark.webp', 'waves-light.webp', 'polygons-dark.webp', 'polygons-light.webp'];

async function writeLinkFile(path: string, data: LinkData): Promise<void> {
	const fileName = data.label + '.link';
	await writeFile(path, fileName, JSON.stringify(data, null, '\t'));
}

export async function initOpfs(): Promise<void> {
	if (navigator.storage.persist) {
		await navigator.storage.persist();
	}

	for (const dir of ROOT_DIRS) {
		if (!(await directoryExists('/' + dir))) await createDirectory('/', dir);
	}

	const freshDirs = new Set<string>();
	for (const dir of OS_SUBDIRS) {
		if (!(await directoryExists(OS_PATH + '/' + dir))) {
			await createDirectory(OS_PATH, dir);
			freshDirs.add(dir);
		}
	}

	if (freshDirs.has('Desktop')) {
		for (const link of defaultDesktopLinks) await writeLinkFile(OS_PATH + '/Desktop', link);
	}

	if (!(await exists(OS_PATH, 'file-types.json'))) {
		await writeFile(OS_PATH, 'file-types.json', JSON.stringify(defaultFileTypes, null, '\t'));
	}

	if (freshDirs.has('TaskbarMenu')) {
		for (const [directoryName, links] of Object.entries(defaultTaskbarMenuStructure)) {
			await createDirectory(OS_PATH + '/TaskbarMenu', directoryName);
			for (const link of links) await writeLinkFile(OS_PATH + '/TaskbarMenu/' + directoryName, link);
		}
		await writeLinkFile(OS_PATH + '/TaskbarMenu', { appId: 'settings', label: 'Settings', icon: '/img/apps/settings.svg' });
		await writeLinkFile(OS_PATH + '/TaskbarMenu', { appId: 'about', label: 'About ' + OS_NAME, icon: '/img/logo.svg' });
	}

	if (freshDirs.has('Wallpapers')) {
		for (const name of defaultWallpapers) {
			try {
				const response = await fetch('/img/wallpapers/' + name);
				const blob = await response.blob();
				await writeFile(WALLPAPERS_PATH, name, blob);
			} catch {
				/* skip failed downloads */
			}
		}
	}
}

let initPromise: Promise<void> | null = null;

export function ensureOpfsReady(): Promise<void> {
	if (!initPromise) initPromise = initOpfs();
	return initPromise;
}
