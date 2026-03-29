import { saveSetting } from '../../scripts/system/settings.svelte.ts';
import type { NotificationPosition, NotificationAnimation } from '../../scripts/system/settings.svelte.ts';
import { addNotification } from '../../scripts/ui/notifications.svelte.ts';

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
		description: 'This is a test notification to preview how notifications look and behave. It contains a much longer text to demonstrate how the notification component handles overflow, wrapping, and scrolling when the content exceeds the expected size. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
		image: '/img/logo.svg',
		imageColor: 'var(--color-accent)',
	});
}
