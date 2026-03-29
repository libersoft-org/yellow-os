import { zipSync, type Zippable } from 'fflate';
import { readDirectory, readFileBlob, joinPath } from './opfs.ts';
import { addNotification } from '../ui/notifications.svelte.ts';

function triggerDownload(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}

async function collectDirectory(path: string, name: string): Promise<Zippable> {
	const dirPath = joinPath(path, name);
	const entries = await readDirectory(dirPath);
	const result: Zippable = {};
	for (const entry of entries) {
		if (entry.type === 'directory') {
			result[entry.name] = await collectDirectory(dirPath, entry.name);
		} else {
			const file = await readFileBlob(dirPath, entry.name);
			result[entry.name] = new Uint8Array(await file.arrayBuffer());
		}
	}
	return result;
}

async function downloadSingleFile(path: string, name: string): Promise<void> {
	const file = await readFileBlob(path, name);
	triggerDownload(file, name);
}

async function downloadAsZip(path: string, items: { name: string; type: 'file' | 'directory' }[]): Promise<void> {
	const zipData: Zippable = {};
	for (const item of items) {
		if (item.type === 'directory') zipData[item.name] = await collectDirectory(path, item.name);
		else {
			const file = await readFileBlob(path, item.name);
			zipData[item.name] = new Uint8Array(await file.arrayBuffer());
		}
	}
	const zipped = zipSync(zipData);
	const blob = new Blob([zipped], { type: 'application/zip' });
	const zipName = items.length === 1 ? items[0]!.name + '.zip' : 'download.zip';
	triggerDownload(blob, zipName);
}

export async function downloadEntries(path: string, items: { name: string; type: 'file' | 'directory' }[]): Promise<void> {
	if (items.length === 0) return;
	if (items.length === 1 && items[0]!.type === 'file') {
		await downloadSingleFile(path, items[0]!.name);
		return;
	}
	addNotification({
		title: 'Preparing download',
		description: 'Creating ZIP archive…',
		image: '/img/download.svg',
		imageColor: 'var(--color-accent)',
	});
	try {
		await downloadAsZip(path, items);
		addNotification({
			title: 'Download ready',
			description: items.length === 1 ? items[0]!.name + '.zip' : items.length + ' items archived',
			image: '/img/download.svg',
			imageColor: 'var(--color-accent)',
		});
	} catch (err) {
		addNotification({
			title: 'Download failed',
			description: String(err),
			image: '/img/download.svg',
			imageColor: 'var(--color-accent)',
			titleColor: 'var(--color-danger)',
		});
	}
}
