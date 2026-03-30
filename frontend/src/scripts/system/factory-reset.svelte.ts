let active = $state(false);
let lines = $state<string[]>([]);
let error = $state('');
let success = $state('');

function addLine(text: string): void {
	lines = [...lines, text];
}

export function getResetState(): { active: boolean; lines: string[]; error: string; success: string } {
	return {
		get active() {
			return active;
		},
		get lines() {
			return lines;
		},
		get error() {
			return error;
		},
		get success() {
			return success;
		},
	};
}

async function wipeOpfs(): Promise<boolean> {
	const root = await navigator.storage.getDirectory();
	const names: string[] = [];
	for await (const name of (root as any).keys() as AsyncIterable<string>) {
		names.push(name);
	}
	addLine(`Found ${names.length} entries.`);
	let allOk = true;
	for (const name of names) {
		addLine(`Deleting /${name} ...`);
		try {
			await root.removeEntry(name, { recursive: true });
		} catch {
			addLine(`  ✗ /${name} could not be deleted`);
			allOk = false;
		}
	}
	return allOk;
}

function wipeIndexedDB(): void {
	indexedDB.databases().then(dbs => {
		for (const db of dbs) {
			if (db.name) indexedDB.deleteDatabase(db.name);
		}
	});
}

const MANUAL_INSTRUCTIONS = 'Some files could not be deleted automatically.\nPlease clear site data manually:\n\nFirefox:\n  Click the shield icon (left of address bar) → Clear cookies and site data -> Reload the website\n\nChrome / Edge:\n  F12 → Application → Storage → Clear site data';

export async function startFactoryReset(): Promise<void> {
	active = true;
	error = '';
	success = '';
	try {
		addLine('Clearing local storage ...');
		localStorage.clear();
		sessionStorage.clear();
		addLine('Wiping OPFS ...');
		const opfsOk = await wipeOpfs();
		addLine('Clearing IndexedDB ...');
		wipeIndexedDB();
		if (opfsOk) {
			addLine('');
			success = 'Factory reset complete.';
			await new Promise(resolve => setTimeout(resolve, 1000));
			location.reload();
		} else {
			error = MANUAL_INSTRUCTIONS;
		}
	} catch {
		error = MANUAL_INSTRUCTIONS;
	}
}
