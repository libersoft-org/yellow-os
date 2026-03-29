import { settings } from './settings.svelte.ts';

export const desktop: { active: number; previous: number | null; slideDirection: 'left' | 'right' | null; slideId: number } = $state({
	active: 0,
	previous: null,
	slideDirection: null,
	slideId: 0,
});

export function switchDesktop(index: number): void {
	if (index >= 0 && index < settings.desktopCount && index !== desktop.active) {
		desktop.slideDirection = index > desktop.active ? 'left' : 'right';
		desktop.previous = desktop.active;
		desktop.active = index;
		desktop.slideId++;
	}
}

// Clamp active desktop when desktopCount changes
export function clampDesktop(): void {
	if (desktop.active >= settings.desktopCount) desktop.active = settings.desktopCount - 1;
}

export function clearSlide(): void {
	desktop.slideDirection = null;
	desktop.previous = null;
}
