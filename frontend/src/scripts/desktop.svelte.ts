export const DESKTOP_COUNT = 4;

export const desktop: { active: number; previous: number | null; slideDirection: 'left' | 'right' | null; slideId: number } = $state({
	active: 0,
	previous: null,
	slideDirection: null,
	slideId: 0,
});

export function switchDesktop(index: number): void {
	if (index >= 0 && index < DESKTOP_COUNT && index !== desktop.active) {
		desktop.slideDirection = index > desktop.active ? 'left' : 'right';
		desktop.previous = desktop.active;
		desktop.active = index;
		desktop.slideId++;
	}
}

export function clearSlide(): void {
	desktop.slideDirection = null;
	desktop.previous = null;
}
