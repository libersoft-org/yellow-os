import { getContext } from 'svelte';
import type { WindowState } from './window-store.svelte.ts';

export const WINDOW_KEY = Symbol('window');

export function getWindow(): WindowState {
	return getContext<() => WindowState>(WINDOW_KEY)();
}
