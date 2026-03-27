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

async function factoryReset(): Promise<void> {
	const root = await navigator.storage.getDirectory();
	for await (const [name] of (root as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		try {
			await root.removeEntry(name, { recursive: true });
		} catch {
			/* skip entries that fail to delete */
		}
	}
	localStorage.clear();
	const dbs = await indexedDB.databases();
	for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
	location.reload();
}
