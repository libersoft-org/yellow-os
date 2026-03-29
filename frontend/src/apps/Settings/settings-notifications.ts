import { saveSetting } from '../../scripts/settings.svelte.ts';
import type { NotificationPosition, NotificationAnimation } from '../../scripts/settings.svelte.ts';
import { addNotification } from '../../scripts/notifications.svelte.ts';

export function setNotificationPosition(position: NotificationPosition): void {
	saveSetting('notificationPosition', position);
}

export function setNotificationDuration(duration: number): void {
	saveSetting('notificationDuration', duration);
}

export function setNotificationAnimation(animation: NotificationAnimation): void {
	saveSetting('notificationAnimation', animation);
}

let testCounter = 0;

export function sendTestNotification(): void {
	testCounter = (testCounter % 10) + 1;
	addNotification({
		title: 'Test notification ' + testCounter,
		description: 'This is a test notification to preview how notifications look and behave.',
		image: '/img/logo.svg',
		imageColor: 'var(--color-accent)',
		titleColor: 'var(--color-accent)',
	});
}
