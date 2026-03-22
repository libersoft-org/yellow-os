export const DESKTOP_COUNT = 4;

export const desktop: { active: number; previous: number | null; slideDirection: 'left' | 'right' | null } = $state({
	active: 0,
	previous: null,
	slideDirection: null,
});

export function switchDesktop(index: number): void {
	if (index >= 0 && index < DESKTOP_COUNT && index !== desktop.active) {
		desktop.slideDirection = index > desktop.active ? 'left' : 'right';
		desktop.previous = desktop.active;
		desktop.active = index;
	}
}

export function clearSlide(): void {
	desktop.slideDirection = null;
	desktop.previous = null;
}
