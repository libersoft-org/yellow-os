import type { Component } from 'svelte';
import { readFileText } from './opfs.ts';
import { getAppComponent } from './app-registry.ts';
import { OS_PATH } from './opfs-init.ts';

export interface FileTypeHandler {
	component: Component;
	props: Record<string, unknown>;
}

let cachedAssociations: Record<string, string> | null = null;

async function loadAssociations(): Promise<Record<string, string>> {
	if (cachedAssociations) return cachedAssociations;
	try {
		const text = await readFileText(OS_PATH, 'file-types.json');
		cachedAssociations = JSON.parse(text) as Record<string, string>;
	} catch {
		cachedAssociations = {};
	}
	return cachedAssociations;
}

function getExtension(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot > 0 ? name.substring(dot + 1).toLowerCase() : '';
}

export async function getFileHandler(filePath: string, fileName: string): Promise<FileTypeHandler | null> {
	const ext = getExtension(fileName);
	if (!ext) return null;
	const associations = await loadAssociations();
	const appId = associations[ext];
	if (!appId) return null;
	const component = getAppComponent(appId);
	if (!component) return null;
	return { component, props: { filePath, fileName } };
}

export function getEditHandler(filePath: string, fileName: string): FileTypeHandler {
	const component = getAppComponent('text-editor')!;
	return { component, props: { filePath, fileName } };
}

export function invalidateFileTypeCache(): void {
	cachedAssociations = null;
}
