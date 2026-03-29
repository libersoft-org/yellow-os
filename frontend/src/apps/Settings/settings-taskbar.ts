import { saveSetting } from '../../scripts/system/settings.svelte.ts';
import { clampDesktop } from '../../scripts/system/desktop.svelte.ts';

export function setDesktopCount(count: number): void {
	saveSetting('desktopCount', count);
	clampDesktop();
}

export function setTaskbarShowText(show: boolean): void {
	saveSetting('taskbarShowText', show);
}
