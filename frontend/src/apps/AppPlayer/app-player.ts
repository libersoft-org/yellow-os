import { readFileText, readFileBlob } from '../../scripts/opfs.ts';
export interface YappManifest {
	name?: string;
	entry: string;
	icon?: string;
	window?: {
		width?: number;
		height?: number;
		minWidth?: number;
		minHeight?: number;
		maxWidth?: number | null;
		maxHeight?: number | null;
		resizable?: boolean;
		canMinimize?: boolean;
		canMaximize?: boolean;
		showInTaskbar?: boolean;
		position?: 'default' | 'center';
		state?: 'normal' | 'maximized' | 'minimized';
	};
}

export async function readYappManifest(dirPath: string, fileName: string): Promise<YappManifest | null> {
	try {
		const text = await readFileText(dirPath, fileName);
		const data = JSON.parse(text) as Partial<YappManifest>;
		if (typeof data.entry !== 'string') return null;
		return data as YappManifest;
	} catch {
		return null;
	}
}

function resolveFilePath(yappDir: string, filePath: string): { dir: string; name: string } {
	if (filePath.startsWith('/')) {
		const lastSlash = filePath.lastIndexOf('/');
		return { dir: filePath.substring(0, lastSlash) || '/', name: filePath.substring(lastSlash + 1) };
	}
	const fullPath = yappDir === '/' ? '/' + filePath : yappDir + '/' + filePath;
	const lastSlash = fullPath.lastIndexOf('/');
	return { dir: fullPath.substring(0, lastSlash) || '/', name: fullPath.substring(lastSlash + 1) };
}

export async function buildBlobUrl(yappDir: string, entryPath: string): Promise<string> {
	const { dir, name } = resolveFilePath(yappDir, entryPath);
	const file = await readFileBlob(dir, name);
	const text = await file.text();
	const rewritten = await rewriteReferences(text, yappDir, entryPath);
	const blob = new Blob([rewritten], { type: 'text/html' });
	return URL.createObjectURL(blob);
}

async function rewriteReferences(html: string, yappDir: string, entryPath: string): Promise<string> {
	const baseDir = resolveBaseDir(yappDir, entryPath);
	const refPattern = /(src|href)="([^"]+)"/g;
	const replacements: { match: string; replacement: string }[] = [];
	let m: RegExpExecArray | null;
	while ((m = refPattern.exec(html)) !== null) {
		const attr = m[1]!;
		const ref = m[2]!;
		if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('data:') || ref.startsWith('blob:')) continue;
		try {
			const { dir, name } = resolveFilePath(baseDir, ref);
			const file = await readFileBlob(dir, name);
			const blobUrl = URL.createObjectURL(file);
			replacements.push({ match: m[0], replacement: `${attr}="${blobUrl}"` });
		} catch {
			// referenced file not found, keep original
		}
	}

	let result = html;
	for (const r of replacements) result = result.replace(r.match, r.replacement);
	return result;
}

function resolveBaseDir(yappDir: string, entryPath: string): string {
	if (entryPath.startsWith('/')) {
		const lastSlash = entryPath.lastIndexOf('/');
		return lastSlash > 0 ? entryPath.substring(0, lastSlash) : '/';
	}
	const lastSlash = entryPath.lastIndexOf('/');
	if (lastSlash < 0) return yappDir;
	const subdir = entryPath.substring(0, lastSlash);
	return yappDir === '/' ? '/' + subdir : yappDir + '/' + subdir;
}

export function isYappFile(name: string): boolean {
	return name.endsWith('.yapp');
}

export async function resolveYappIcon(yappDir: string, iconPath: string): Promise<string> {
	const { dir, name } = resolveFilePath(yappDir, iconPath);
	const blob = await readFileBlob(dir, name);
	return URL.createObjectURL(blob);
}
