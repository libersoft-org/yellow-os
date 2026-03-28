import { showDialog } from '../../scripts/dialog.ts';

export function confirmFactoryReset(): void {
	showDialog({
		title: 'Factory reset',
		message: 'Are you sure you want to reset the system? All data including files, settings and cache will be permanently erased.',
		type: 'warning',
		buttons: [
			{
				label: 'Yes',
				onclick: factoryReset,
				backgroundColorVariable: '--color-accent',
				colorVariable: '--color-accent-fg',
			},
			{
				label: 'No',
			},
		],
	});
}

async function wipeOpfs(): Promise<void> {
	const root = await navigator.storage.getDirectory();
	const names: string[] = [];
	for await (const name of (root as any).keys() as AsyncIterable<string>) {
		names.push(name);
	}
	for (const name of names) {
		try {
			await root.removeEntry(name, { recursive: true });
		} catch (e) {
			console.warn('[factory-reset] removeEntry failed:', name, e);
		}
	}
}

async function wipeIndexedDB(): Promise<void> {
	const databases = await indexedDB.databases();
	for (const db of databases) {
		if (db.name) indexedDB.deleteDatabase(db.name);
	}
}

async function factoryReset(): Promise<void> {
	localStorage.clear();
	sessionStorage.clear();
	await wipeOpfs();
	await wipeIndexedDB();
	location.reload();
}
