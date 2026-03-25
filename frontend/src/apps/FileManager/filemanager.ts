export interface FileEntry {
	name: string;
	type: 'directory' | 'file';
	size?: string;
	modified?: string;
}

export interface DiskInfo {
	name: string;
	path: string;
	icon: string;
	total: string;
	free: string;
}

export const mockDisks: DiskInfo[] = [
	{ name: 'OPFS drive', path: '/', icon: '/img/apps/file-manager.svg', total: '256 GB', free: '82 GB' },
	{ name: 'NAS network drive', path: '/aaa', icon: '/img/apps/file-manager.svg', total: '22.18 TB', free: '2.53 TB' },
	{ name: 'RAM drive', path: '/bbb', icon: '/img/apps/file-manager.svg', total: '1 TB', free: '643 GB' },
];

export const mockFs: Record<string, FileEntry[]> = {
	'/': [
		{ name: 'Documents', type: 'directory', modified: '2026-03-18' },
		{ name: 'Pictures', type: 'directory', modified: '2026-03-14' },
		{ name: 'Music', type: 'directory', modified: '2026-03-01' },
		{ name: 'Downloads', type: 'directory', modified: '2026-03-17' },
		{ name: 'readme.txt', type: 'file', size: '2 KB', modified: '2026-03-15' },
		{ name: 'notes.md', type: 'file', size: '1 KB', modified: '2026-03-18' },
	],
	'/Documents': [
		{ name: 'Work', type: 'directory', modified: '2026-03-12' },
		{ name: 'Personal', type: 'directory', modified: '2026-03-16' },
		{ name: 'report.pdf', type: 'file', size: '340 KB', modified: '2026-03-10' },
		{ name: 'todo.txt', type: 'file', size: '1 KB', modified: '2026-03-17' },
	],
	'/Documents/Work': [
		{ name: 'project-plan.md', type: 'file', size: '5 KB', modified: '2026-03-12' },
		{ name: 'budget.xlsx', type: 'file', size: '28 KB', modified: '2026-02-20' },
	],
	'/Documents/Personal': [{ name: 'diary.txt', type: 'file', size: '12 KB', modified: '2026-03-16' }],
	'/Pictures': [
		{ name: 'Vacation', type: 'directory', modified: '2025-08-11' },
		{ name: 'wallpaper.png', type: 'file', size: '2.1 MB', modified: '2026-01-05' },
		{ name: 'screenshot.png', type: 'file', size: '450 KB', modified: '2026-03-14' },
	],
	'/Pictures/Vacation': [
		{ name: 'beach.jpg', type: 'file', size: '3.2 MB', modified: '2025-08-10' },
		{ name: 'sunset.jpg', type: 'file', size: '2.8 MB', modified: '2025-08-11' },
	],
	'/Music': [{ name: 'playlist.m3u', type: 'file', size: '1 KB', modified: '2026-03-01' }],
	'/Downloads': [
		{ name: 'installer.exe', type: 'file', size: '45 MB', modified: '2026-03-17' },
		{ name: 'archive.zip', type: 'file', size: '12 MB', modified: '2026-03-16' },
	],
};
