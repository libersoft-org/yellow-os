export interface NotificationData {
	title?: string;
	description?: string;
	image?: string;
	imageColor?: string;
	onclick?: () => void;
	titleColor?: string;
	descriptionColor?: string;
	backgroundColor?: string;
	borderColor?: string;
}
export interface NotificationItem extends NotificationData {
	id: number;
}
let nextId = 1;
export const notifications: NotificationItem[] = $state([]);
export const onNotificationAdded = new Set<() => void>();
export const onPauseChanged = new Set<(paused: boolean) => void>();

export function setPaused(paused: boolean): void {
	for (const cb of onPauseChanged) cb(paused);
}

export function addNotification(data: NotificationData): number {
	const id = nextId++;
	notifications.push({ ...data, id });
	for (const cb of onNotificationAdded) cb();
	return id;
}

export function removeNotification(id: number): void {
	const index = notifications.findIndex(n => n.id === id);
	if (index >= 0) notifications.splice(index, 1);
}
