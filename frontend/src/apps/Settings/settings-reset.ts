export async function factoryReset(): Promise<void> {
	const root = await navigator.storage.getDirectory();
	for await (const [name] of (root as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
		await root.removeEntry(name, { recursive: true });
	}
	localStorage.clear();
	const dbs = await indexedDB.databases();
	for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
	location.reload();
}
