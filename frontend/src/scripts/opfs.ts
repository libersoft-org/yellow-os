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

export async function writeFile(path: string, name: string, content: Blob | string): Promise<void> {
	const dir = await resolveDirectory(path);
	const fileHandle = await dir.getFileHandle(name, { create: true });
	const writable = await fileHandle.createWritable();
	await writable.write(content);
	await writable.close();
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
	const dir = await resolveDirectory(path);
	await dir.removeEntry(name, { recursive: true });
}

export async function renameEntry(path: string, oldName: string, newName: string): Promise<void> {
	const dir = await resolveDirectory(path);
	const oldHandle = await dir.getDirectoryHandle(oldName).catch(() => null);
	if (oldHandle) {
		await copyDirectory(oldHandle, dir, newName);
		await dir.removeEntry(oldName, { recursive: true });
	} else {
		const fileHandle = await dir.getFileHandle(oldName);
		const file = await fileHandle.getFile();
		const newHandle = await dir.getFileHandle(newName, { create: true });
		const writable = await newHandle.createWritable();
		await writable.write(file);
		await writable.close();
		await dir.removeEntry(oldName);
	}
}

async function copyDirectory(source: FileSystemDirectoryHandle, parentDir: FileSystemDirectoryHandle, newName: string): Promise<void> {
	const newDir = await parentDir.getDirectoryHandle(newName, { create: true });
	for await (const [name, handle] of (source as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		if (handle.kind === 'directory') {
			await copyDirectory(handle as FileSystemDirectoryHandle, newDir, name);
		} else {
			const file = await (handle as FileSystemFileHandle).getFile();
			const newFile = await newDir.getFileHandle(name, { create: true });
			const writable = await newFile.createWritable();
			await writable.write(file);
			await writable.close();
		}
	}
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
	const trashDir = await resolveDirectory('/Trash');
	let targetName = name;
	let counter = 1;
	const hasEntry = async (n: string): Promise<boolean> => {
		try {
			await trashDir.getDirectoryHandle(n);
			return true;
		} catch {
			try {
				await trashDir.getFileHandle(n);
				return true;
			} catch {
				return false;
			}
		}
	};
	while (await hasEntry(targetName)) {
		const dot = name.lastIndexOf('.');
		if (dot > 0) targetName = name.slice(0, dot) + ` (${counter})` + name.slice(dot);
		else targetName = name + ` (${counter})`;
		counter++;
	}
	const sourceDir = await resolveDirectory(path);
	const sourceHandle = await sourceDir.getDirectoryHandle(name).catch(() => null);
	if (sourceHandle) {
		await copyDirectory(sourceHandle, trashDir, targetName);
	} else {
		const fileHandle = await sourceDir.getFileHandle(name);
		const file = await fileHandle.getFile();
		const newFile = await trashDir.getFileHandle(targetName, { create: true });
		const writable = await newFile.createWritable();
		await writable.write(file);
		await writable.close();
	}
	await sourceDir.removeEntry(name, { recursive: true });
}
