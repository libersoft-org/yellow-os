import { readFileText, writeFile } from './opfs.ts';
import { getAppComponent } from './app-registry.ts';
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
