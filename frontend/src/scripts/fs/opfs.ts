export interface OpfsEntry {
	name: string;
	type: 'directory' | 'file';
	size: number;
	modified: number;
}

export interface OpfsStorageInfo {
	total: number;
	used: number;
}

export const OS_NAME = 'YellowOS';

const SYSTEM_ENTRIES: Record<string, Set<string>> = {
	'/': new Set(['Trash', OS_NAME]),
};

export function isSystemEntry(dirPath: string, name: string): boolean {
	return SYSTEM_ENTRIES[dirPath]?.has(name) ?? false;
}

export function joinPath(dir: string, name: string): string {
	return dir === '/' ? '/' + name : dir + '/' + name;
}

async function resolveDirectory(path: string): Promise<FileSystemDirectoryHandle> {
	const root = await navigator.storage.getDirectory();
	if (path === '/') return root;
	const parts = path.split('/').filter(Boolean);
	let handle = root;
	for (const part of parts) handle = await handle.getDirectoryHandle(part);
	return handle;
}

export async function readDirectory(path: string): Promise<OpfsEntry[]> {
	const dir = await resolveDirectory(path);
	const entries: OpfsEntry[] = [];
	for await (const [name, handle] of (dir as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		if (handle.kind === 'directory') entries.push({ name, type: 'directory', size: 0, modified: 0 });
		else {
			const file = await (handle as FileSystemFileHandle).getFile();
			entries.push({ name, type: 'file', size: file.size, modified: file.lastModified });
		}
	}
	return entries;
}

export async function getStorageEstimate(): Promise<OpfsStorageInfo> {
	const estimate = await navigator.storage.estimate();
	return { total: estimate.quota ?? 0, used: estimate.usage ?? 0 };
}

export async function createDirectory(path: string, name: string): Promise<void> {
	const dir = await resolveDirectory(path);
	await dir.getDirectoryHandle(name, { create: true });
}

export async function createFile(path: string, name: string, content: string = ''): Promise<void> {
	const dir = await resolveDirectory(path);
	const fileHandle = await dir.getFileHandle(name, { create: true });
	const writable = await fileHandle.createWritable();
	await writable.write(content);
	await writable.close();
}

import { notifyDirectoryChange } from './opfs-notify.ts';

const CHUNK_SIZE = 256 * 1024;

async function writeChunked(writable: FileSystemWritableFileStream, blob: Blob, onprogress?: (bytes: number) => void, cancelled?: () => boolean): Promise<boolean> {
	if (!onprogress || blob.size === 0) {
		await writable.write(blob);
		return false;
	}
	let offset = 0;
	while (offset < blob.size) {
		if (cancelled?.()) {
			await writable.abort();
			return true;
		}
		const end = Math.min(offset + CHUNK_SIZE, blob.size);
		const chunk = blob.slice(offset, end);
		await writable.write(chunk);
		onprogress(end - offset);
		offset = end;
	}
	return false;
}

export async function writeFile(path: string, name: string, content: Blob | string, onprogress?: (bytes: number) => void, cancelled?: () => boolean): Promise<void> {
	const dir = await resolveDirectory(path);
	const fileHandle = await dir.getFileHandle(name, { create: true });
	const writable = await fileHandle.createWritable();
	if (onprogress && content instanceof Blob) {
		const wasCancelled = await writeChunked(writable, content, onprogress, cancelled);
		if (wasCancelled) {
			try {
				await dir.removeEntry(name);
			} catch {
				/* ignore */
			}
			return;
		}
	} else {
		await writable.write(content);
	}
	await writable.close();
	notifyDirectoryChange(path);
}

export async function readFileText(path: string, name: string): Promise<string> {
	const dir = await resolveDirectory(path);
	const fileHandle = await dir.getFileHandle(name);
	const file = await fileHandle.getFile();
	return file.text();
}

export async function readFileBlob(path: string, name: string): Promise<File> {
	const dir = await resolveDirectory(path);
	const fileHandle = await dir.getFileHandle(name);
	return fileHandle.getFile();
}

export async function deleteEntry(path: string, name: string): Promise<void> {
	if (isSystemEntry(path, name)) return;
	const dir = await resolveDirectory(path);
	await dir.removeEntry(name, { recursive: true });
}

export async function renameEntry(path: string, oldName: string, newName: string): Promise<void> {
	if (isSystemEntry(path, oldName)) return;
	const dir = await resolveDirectory(path);
	const handle = await dir.getDirectoryHandle(oldName).catch(() => dir.getFileHandle(oldName));
	await (handle as any).move(newName);
}

async function copyDirectory(source: FileSystemDirectoryHandle, parentDir: FileSystemDirectoryHandle, newName: string, onprogress?: (bytes: number) => void, cancelled?: () => boolean): Promise<void> {
	const newDir = await parentDir.getDirectoryHandle(newName, { create: true });
	for await (const [name, handle] of (source as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		if (cancelled?.()) return;
		if (handle.kind === 'directory') {
			await copyDirectory(handle as FileSystemDirectoryHandle, newDir, name, onprogress, cancelled);
		} else {
			const file = await (handle as FileSystemFileHandle).getFile();
			const newFile = await newDir.getFileHandle(name, { create: true });
			const writable = await newFile.createWritable();
			const wasCancelled = await writeChunked(writable, file, onprogress, cancelled);
			if (wasCancelled) {
				try {
					await newDir.removeEntry(name);
				} catch {
					/* ignore */
				}
				return;
			}
			await writable.close();
		}
	}
}

async function findUniqueName(dir: FileSystemDirectoryHandle, name: string): Promise<string> {
	const hasEntry = async (n: string): Promise<boolean> => {
		try {
			await dir.getDirectoryHandle(n);
			return true;
		} catch {
			try {
				await dir.getFileHandle(n);
				return true;
			} catch {
				return false;
			}
		}
	};
	if (!(await hasEntry(name))) return name;
	let counter = 2;
	const dot = name.lastIndexOf('.');
	while (true) {
		const candidate = dot > 0 ? name.slice(0, dot) + ` (${counter})` + name.slice(dot) : name + ` (${counter})`;
		if (!(await hasEntry(candidate))) return candidate;
		counter++;
	}
}

export async function uniqueName(path: string, name: string): Promise<string> {
	const dir = await resolveDirectory(path);
	return findUniqueName(dir, name);
}

export async function copyEntryTo(sourcePath: string, name: string, destPath: string, onprogress?: (bytes: number) => void, cancelled?: () => boolean): Promise<string> {
	const fullSourcePath = joinPath(sourcePath, name);
	if (destPath === fullSourcePath || destPath.startsWith(fullSourcePath + '/')) {
		throw new Error(`Cannot copy "${name}" into itself.`);
	}
	const sourceDir = await resolveDirectory(sourcePath);
	const destDir = await resolveDirectory(destPath);
	const targetName = await findUniqueName(destDir, name);
	const dirHandle = await sourceDir.getDirectoryHandle(name).catch(() => null);
	if (dirHandle) {
		await copyDirectory(dirHandle, destDir, targetName, onprogress, cancelled);
		if (cancelled?.()) {
			try {
				await destDir.removeEntry(targetName, { recursive: true });
			} catch {
				/* ignore */
			}
		}
	} else {
		const fileHandle = await sourceDir.getFileHandle(name);
		const file = await fileHandle.getFile();
		const newFile = await destDir.getFileHandle(targetName, { create: true });
		const writable = await newFile.createWritable();
		const wasCancelled = await writeChunked(writable, file, onprogress, cancelled);
		if (wasCancelled) {
			try {
				await destDir.removeEntry(targetName);
			} catch {
				/* ignore */
			}
			return targetName;
		}
		await writable.close();
	}
	return targetName;
}

export async function copyEntryReplace(sourcePath: string, name: string, destPath: string, onprogress?: (bytes: number) => void, cancelled?: () => boolean): Promise<void> {
	const fullSourcePath = joinPath(sourcePath, name);
	if (destPath === fullSourcePath || destPath.startsWith(fullSourcePath + '/')) throw new Error(`Cannot copy "${name}" into itself.`);
	const sourceDir = await resolveDirectory(sourcePath);
	const destDir = await resolveDirectory(destPath);
	try {
		await destDir.removeEntry(name, { recursive: true });
	} catch {
		/* does not exist */
	}
	const dirHandle = await sourceDir.getDirectoryHandle(name).catch(() => null);
	if (dirHandle) {
		await copyDirectory(dirHandle, destDir, name, onprogress, cancelled);
		if (cancelled?.()) {
			try {
				await destDir.removeEntry(name, { recursive: true });
			} catch {
				/* ignore */
			}
		}
	} else {
		const fileHandle = await sourceDir.getFileHandle(name);
		const file = await fileHandle.getFile();
		const newFile = await destDir.getFileHandle(name, { create: true });
		const writable = await newFile.createWritable();
		const wasCancelled = await writeChunked(writable, file, onprogress, cancelled);
		if (wasCancelled) {
			try {
				await destDir.removeEntry(name);
			} catch {
				/* ignore */
			}
			return;
		}
		await writable.close();
	}
}

export async function copyEntryAutoRename(sourcePath: string, name: string, destPath: string): Promise<string> {
	return copyEntryTo(sourcePath, name, destPath);
}

export async function moveEntry(sourcePath: string, name: string, destPath: string, _onprogress?: (bytes: number) => void): Promise<string> {
	if (isSystemEntry(sourcePath, name)) return name;
	const fullSourcePath = joinPath(sourcePath, name);
	if (destPath === fullSourcePath || destPath.startsWith(fullSourcePath + '/')) {
		throw new Error(`Cannot move "${name}" into itself.`);
	}
	const sourceDir = await resolveDirectory(sourcePath);
	const destDir = await resolveDirectory(destPath);
	const targetName = await findUniqueName(destDir, name);
	const handle = await sourceDir.getDirectoryHandle(name).catch(() => sourceDir.getFileHandle(name));
	await (handle as any).move(destDir, targetName);
	return targetName;
}

export async function moveEntryReplace(sourcePath: string, name: string, destPath: string, _onprogress?: (bytes: number) => void): Promise<void> {
	if (isSystemEntry(sourcePath, name)) return;
	const fullSourcePath = joinPath(sourcePath, name);
	if (destPath === fullSourcePath || destPath.startsWith(fullSourcePath + '/')) throw new Error(`Cannot move "${name}" into itself.`);
	const sourceDir = await resolveDirectory(sourcePath);
	const destDir = await resolveDirectory(destPath);
	try {
		await destDir.removeEntry(name, { recursive: true });
	} catch {
		/* does not exist */
	}
	const handle = await sourceDir.getDirectoryHandle(name).catch(() => sourceDir.getFileHandle(name));
	await (handle as any).move(destDir, name);
}

export async function exists(path: string, name: string): Promise<boolean> {
	try {
		const dir = await resolveDirectory(path);
		await dir.getDirectoryHandle(name).catch(async () => await dir.getFileHandle(name));
		return true;
	} catch {
		return false;
	}
}

export async function directoryExists(path: string): Promise<boolean> {
	try {
		await resolveDirectory(path);
		return true;
	} catch {
		return false;
	}
}

export async function moveToTrash(path: string, name: string): Promise<void> {
	if (isSystemEntry(path, name)) return;
	if (path === '/Trash' || path.startsWith('/Trash/')) {
		const dir = await resolveDirectory(path);
		await dir.removeEntry(name, { recursive: true });
		return;
	}
	await moveEntry(path, name, '/Trash');
}

export async function emptyTrash(): Promise<void> {
	const dir = await resolveDirectory('/Trash');
	for await (const [name] of (dir as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		await dir.removeEntry(name, { recursive: true });
	}
}

async function directorySize(handle: FileSystemDirectoryHandle): Promise<number> {
	let total = 0;
	for await (const [, child] of (handle as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		if (child.kind === 'directory') total += await directorySize(child as FileSystemDirectoryHandle);
		else total += (await (child as FileSystemFileHandle).getFile()).size;
	}
	return total;
}

export async function entrySize(path: string, name: string): Promise<number> {
	const dir = await resolveDirectory(path);
	const dirHandle = await dir.getDirectoryHandle(name).catch(() => null);
	if (dirHandle) return directorySize(dirHandle);
	const fileHandle = await dir.getFileHandle(name);
	const file = await fileHandle.getFile();
	return file.size;
}

export interface EntriesStats {
	files: number;
	directories: number;
	totalSize: number;
}

async function directoryStats(handle: FileSystemDirectoryHandle): Promise<EntriesStats> {
	let files = 0,
		directories = 0,
		totalSize = 0;
	for await (const [, child] of (handle as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		if (child.kind === 'directory') {
			directories++;
			const sub = await directoryStats(child as FileSystemDirectoryHandle);
			files += sub.files;
			directories += sub.directories;
			totalSize += sub.totalSize;
		} else {
			files++;
			totalSize += (await (child as FileSystemFileHandle).getFile()).size;
		}
	}
	return { files, directories, totalSize };
}

export async function entriesStats(path: string, entries: OpfsEntry[]): Promise<EntriesStats> {
	let files = 0,
		directories = 0,
		totalSize = 0;
	const dir = await resolveDirectory(path);
	for (const entry of entries) {
		if (entry.type === 'directory') {
			directories++;
			const dirHandle = await dir.getDirectoryHandle(entry.name);
			const sub = await directoryStats(dirHandle);
			files += sub.files;
			directories += sub.directories;
			totalSize += sub.totalSize;
		} else {
			files++;
			totalSize += entry.size;
		}
	}
	return { files, directories, totalSize };
}
