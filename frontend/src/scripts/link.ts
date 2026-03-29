import { readFileText, writeFile, exists, copyEntryTo, joinPath } from './opfs.ts';
import { getAppComponent } from './app-registry.ts';
import { getFileAppId } from './file-types.ts';
import type { Component } from 'svelte';

export interface LinkData {
	appId: string;
	label: string;
	icon: string;
	props?: Record<string, unknown>;
}

export function isLinkFile(name: string): boolean {
	return name.endsWith('.link');
}

export function getLinkLabel(name: string): string {
	return name.replace(/\.link$/, '');
}

export async function readLink(dirPath: string, fileName: string): Promise<LinkData | null> {
	try {
		const text = await readFileText(dirPath, fileName);
		const data = JSON.parse(text) as Partial<LinkData>;
		if (typeof data.appId !== 'string' || typeof data.label !== 'string' || typeof data.icon !== 'string') return null;
		return data as LinkData;
	} catch {
		return null;
	}
}

export async function writeLink(dirPath: string, fileName: string, data: LinkData): Promise<void> {
	await writeFile(dirPath, fileName, JSON.stringify(data, null, '\t'));
}

export interface ResolvedLink {
	component: Component;
	props: Record<string, unknown>;
}

export function resolveLink(data: LinkData): ResolvedLink | undefined {
	const component = getAppComponent(data.appId);
	if (!component) return undefined;
	return { component, props: data.props ?? {} };
}

export interface EntryInfo {
	name: string;
	type: 'file' | 'directory';
}

async function uniqueLinkName(destPath: string, baseName: string): Promise<string> {
	let candidate = baseName + '.link';
	if (!(await exists(destPath, candidate))) return candidate;
	for (let i = 2; i < 1000; i++) {
		candidate = baseName + ' (' + i + ').link';
		if (!(await exists(destPath, candidate))) return candidate;
	}
	return candidate;
}

export async function createLinksForEntries(sourcePath: string, entries: EntryInfo[], destPath: string): Promise<Map<string, string>> {
	const nameMap = new Map<string, string>();
	for (const entry of entries) {
		if (entry.type === 'file' && isLinkFile(entry.name)) {
			const finalName = await copyEntryTo(sourcePath, entry.name, destPath);
			nameMap.set(entry.name, finalName);
			continue;
		}
		const fullPath = joinPath(sourcePath, entry.name);
		let linkData: LinkData;
		if (entry.type === 'directory') {
			linkData = { appId: 'file-browser', label: entry.name, icon: '/img/directory.svg', props: { path: fullPath } };
		} else {
			const appId = await getFileAppId(entry.name);
			linkData = { appId: appId ?? 'text-editor', label: entry.name, icon: '/img/file.svg', props: { filePath: sourcePath, fileName: entry.name } };
		}
		const fileName = await uniqueLinkName(destPath, entry.name);
		await writeLink(destPath, fileName, linkData);
		nameMap.set(entry.name, fileName);
	}
	return nameMap;
}
