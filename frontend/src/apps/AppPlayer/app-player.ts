import { readFileText, readFileBlob, readDirectory } from '../../scripts/fs/opfs.ts';
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
	const baseDir = resolveBaseDir(yappDir, entryPath);
	const assetMap = await buildAssetBase64Map(baseDir, name);
	const fetchInterceptScript = buildFetchInterceptScript(assetMap);
	const rewritten = await rewriteReferences(text, yappDir, entryPath);
	const injected = injectScriptAfterHead(rewritten, fetchInterceptScript);
	const blob = new Blob([injected], { type: 'text/html' });
	return URL.createObjectURL(blob);
}

interface AssetEntry {
	base64: string;
	type: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}

function guessMimeType(name: string): string {
	const ext = name.split('.').pop()?.toLowerCase() ?? '';
	const types: Record<string, string> = {
		wasm: 'application/wasm',
		js: 'text/javascript',
		css: 'text/css',
		json: 'application/json',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		webp: 'image/webp',
	};
	return types[ext] ?? 'application/octet-stream';
}

async function buildAssetBase64Map(baseDir: string, excludeFileName: string): Promise<Map<string, AssetEntry>> {
	const map = new Map<string, AssetEntry>();
	try {
		const entries = await readDirectory(baseDir);
		for (const entry of entries) {
			if (entry.type !== 'file' || entry.name === excludeFileName) continue;
			try {
				const blob = await readFileBlob(baseDir, entry.name);
				const buffer = await blob.arrayBuffer();
				const base64 = arrayBufferToBase64(buffer);
				const type = blob.type || guessMimeType(entry.name);
				map.set(entry.name, { base64, type });
			} catch {
				/* skip unreadable files */
			}
		}
	} catch {
		/* directory not readable */
	}
	return map;
}

function buildFetchInterceptScript(assetMap: Map<string, AssetEntry>): string {
	const entries = Array.from(assetMap.entries())
		.map(([name, { base64, type }]) => `${JSON.stringify(name)}:[${JSON.stringify(base64)},${JSON.stringify(type)}]`)
		.join(',');
	return `<script>(function(){var m={${entries}};var _f=window.fetch;window.fetch=function(r,o){if(typeof r==='string'){var n=r.split('/').pop();var d=m[n]||m[r];if(d){var b=atob(d[0]);var a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return Promise.resolve(new Response(a.buffer,{headers:{'content-type':d[1]}}));}}return _f(r,o);};})()${'<'}/script>`;
}

function injectScriptAfterHead(html: string, script: string): string {
	const headMatch = html.match(/<head[^>]*>/i);
	if (headMatch) {
		const idx = html.indexOf(headMatch[0]) + headMatch[0].length;
		return html.substring(0, idx) + script + html.substring(idx);
	}
	return script + html;
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
	return name.toLowerCase().endsWith('.yapp');
}

export async function resolveYappIcon(yappDir: string, iconPath: string): Promise<string> {
	const { dir, name } = resolveFilePath(yappDir, iconPath);
	const blob = await readFileBlob(dir, name);
	return URL.createObjectURL(blob);
}
