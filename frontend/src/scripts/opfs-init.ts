import { createDirectory, directoryExists, writeFile, readDirectory, exists } from './opfs.ts';
import type { LinkData } from './link.ts';

const OS_NAME = 'YellowOS';
export const OS_PATH = '/' + OS_NAME;

const ROOT_DIRS = [OS_NAME, 'Trash'];
const OS_SUBDIRS = ['Desktop', 'TaskbarMenu'];

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
};

const defaultDesktopLinks: LinkData[] = [
	{ appId: 'file-browser', label: 'File Browser', icon: '/img/apps/file-browser.svg' },
	{ appId: 'file-browser', label: 'Trash', icon: '/img/apps/trash.svg', props: { path: '/Trash' } },
];

const defaultTaskbarMenuStructure: Record<string, LinkData[]> = {
	Programs: [
		{ appId: 'file-browser', label: 'File Browser', icon: '/img/apps/file-browser.svg' },
		{ appId: 'calculator', label: 'Calculator', icon: '/img/apps/calculator.svg' },
		{ appId: 'text-editor', label: 'Text Editor', icon: '/img/apps/text-editor.svg' },
	],
	Games: [
		{ appId: 'pong', label: 'Pong', icon: '/img/apps/pong.svg' },
		{ appId: 'snake', label: 'Snake', icon: '/img/apps/snake.svg' },
	],
};

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
	for (const dir of OS_SUBDIRS) {
		if (!(await directoryExists(OS_PATH + '/' + dir))) await createDirectory(OS_PATH, dir);
	}

	const desktopEntries = await readDirectory(OS_PATH + '/Desktop');
	if (desktopEntries.length === 0) {
		for (const link of defaultDesktopLinks) await writeLinkFile(OS_PATH + '/Desktop', link);
	}

	if (!(await exists(OS_PATH, 'file-types.json'))) {
		await writeFile(OS_PATH, 'file-types.json', JSON.stringify(defaultFileTypes, null, '\t'));
	}

	const taskbarEntries = await readDirectory(OS_PATH + '/TaskbarMenu');
	if (taskbarEntries.length === 0) {
		for (const [folderName, links] of Object.entries(defaultTaskbarMenuStructure)) {
			await createDirectory(OS_PATH + '/TaskbarMenu', folderName);
			for (const link of links) await writeLinkFile(OS_PATH + '/TaskbarMenu/' + folderName, link);
		}
		await writeLinkFile(OS_PATH + '/TaskbarMenu', { appId: 'about', label: 'About ' + OS_NAME, icon: '/img/logo.svg' });
	}
}

let initPromise: Promise<void> | null = null;

export function ensureOpfsReady(): Promise<void> {
	if (!initPromise) initPromise = initOpfs();
	return initPromise;
}
