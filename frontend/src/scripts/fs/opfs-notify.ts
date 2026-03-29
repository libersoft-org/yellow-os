type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export function onDirectoryChange(path: string, listener: Listener): () => void {
	if (!listeners.has(path)) listeners.set(path, new Set());
	listeners.get(path)!.add(listener);
	return (): void => {
		listeners.get(path)?.delete(listener);
	};
}

export function notifyDirectoryChange(path: string): void {
	listeners.get(path)?.forEach(fn => fn());
}
