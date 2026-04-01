import { getStorageEstimate } from '../../scripts/fs/opfs.ts';

export interface DiskInfo {
	name: string;
	path: string;
	icon: string;
	total: number;
	free: number;
}

export interface BreadcrumbSegment {
	name: string;
	path: string;
}

export interface StorageNavigation {
	readonly currentPath: string;
	readonly history: string[];
	readonly historyIndex: number;
	readonly canGoBack: boolean;
	readonly canGoForward: boolean;
	readonly canGoUp: boolean;
	readonly breadcrumbSegments: BreadcrumbSegment[];
	navigateTo: (path: string) => void;
	goBack: () => void;
	goForward: () => void;
	goUp: () => void;
}

export function createStorageNavigation(getStartPath: () => string = () => '/'): StorageNavigation {
	let currentPath = $state(getStartPath());
	let history = $state<string[]>([getStartPath()]);
	let historyIndex = $state(0);
	const canGoBack = $derived(historyIndex > 0);
	const canGoForward = $derived(historyIndex < history.length - 1);
	const canGoUp = $derived(currentPath !== '/');
	const breadcrumbSegments = $derived.by((): BreadcrumbSegment[] => {
		if (currentPath === '/') return [{ name: 'Root', path: '/' }];
		const parts = currentPath.split('/').filter(Boolean);
		const segments: BreadcrumbSegment[] = [{ name: 'Root', path: '/' }];
		for (let i = 0; i < parts.length; i++) segments.push({ name: parts[i]!, path: '/' + parts.slice(0, i + 1).join('/') });
		return segments;
	});

	function navigateTo(navPath: string): void {
		if (navPath === currentPath) return;
		history = history.slice(0, historyIndex + 1);
		history.push(navPath);
		historyIndex = history.length - 1;
		currentPath = navPath;
	}

	function goBack(): void {
		if (!canGoBack) return;
		historyIndex--;
		currentPath = history[historyIndex]!;
	}

	function goForward(): void {
		if (!canGoForward) return;
		historyIndex++;
		currentPath = history[historyIndex]!;
	}

	function goUp(): void {
		if (!canGoUp) return;
		const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
		navigateTo(parent);
	}

	return {
		get currentPath(): string {
			return currentPath;
		},
		get history(): string[] {
			return history;
		},
		get historyIndex(): number {
			return historyIndex;
		},
		get canGoBack(): boolean {
			return canGoBack;
		},
		get canGoForward(): boolean {
			return canGoForward;
		},
		get canGoUp(): boolean {
			return canGoUp;
		},
		get breadcrumbSegments(): BreadcrumbSegment[] {
			return breadcrumbSegments;
		},
		navigateTo,
		goBack,
		goForward,
		goUp,
	};
}

export async function loadDisks(): Promise<DiskInfo[]> {
	const estimate = await getStorageEstimate();
	return [{ name: 'OPFS drive', path: '/', icon: '/img/apps/file-browser.svg', total: estimate.total, free: estimate.total - estimate.used }];
}
