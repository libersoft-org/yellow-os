<script lang="ts">
	import { settings } from '../../scripts/settings.svelte.ts';
	import type { NotificationPosition, NotificationAnimation } from '../../scripts/settings.svelte.ts';
	import { setNotificationPosition, setNotificationDuration, setNotificationAnimation, sendTestNotification } from './settings-notifications.ts';
	import SettingsTitle from './components/SettingsTitle.svelte';
	import SettingsOptionRow from './components/SettingsOptionRow.svelte';
	import SettingsOption from './components/SettingsOption.svelte';
	import SettingsDescription from './components/SettingsDescription.svelte';
	import Button from '../../components/Button/Button.svelte';
	import Clickable from '../../components/Clickable/Clickable.svelte';

	const positions: { id: NotificationPosition; label: string }[] = [
		{ id: 'top-left', label: 'Top left' },
		{ id: 'top-right', label: 'Top right' },
		{ id: 'bottom-left', label: 'Bottom left' },
		{ id: 'bottom-right', label: 'Bottom right' },
	];

	const animations: { id: NotificationAnimation; label: string }[] = [
		{ id: 'slide', label: 'Slide' },
		{ id: 'fade', label: 'Fade' },
		{ id: 'none', label: 'None' },
	];

	const durations: { value: number; label: string }[] = [
		{ value: 3, label: '3s' },
		{ value: 5, label: '5s' },
		{ value: 10, label: '10s' },
		{ value: 15, label: '15s' },
		{ value: 30, label: '30s' },
		{ value: 0, label: '∞' },
	];
</script>

<style>
	.settings-notifications {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.position-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		width: 200px;
	}

	.position-btn {
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 13px;
		color: var(--color-text);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		text-align: center;
		transition: all 0.15s;
	}

	.position-btn:hover {
		background: var(--color-hover);
	}

	.position-btn.active {
		background: var(--color-accent-subtle);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.test-row {
		padding-top: 10px;
	}
</style>

<div class="settings-notifications">
	<SettingsTitle label="Position" />
	<div class="position-grid">
		{#each positions as pos}
			<Clickable onclick={() => setNotificationPosition(pos.id)}>
				<div class="position-btn" class:active={settings.notificationPosition === pos.id}>{pos.label}</div>
			</Clickable>
		{/each}
	</div>

	<SettingsTitle label="Duration" />
	<SettingsDescription text="How long notifications stay visible. 0 means they stay until manually closed." />
	<SettingsOptionRow>
		{#each durations as d}
			<SettingsOption active={settings.notificationDuration === d.value} onclick={() => setNotificationDuration(d.value)}>{d.label}</SettingsOption>
		{/each}
	</SettingsOptionRow>

	<SettingsTitle label="Animation" />
	<SettingsOptionRow>
		{#each animations as anim}
			<SettingsOption active={settings.notificationAnimation === anim.id} onclick={() => setNotificationAnimation(anim.id)}>{anim.label}</SettingsOption>
		{/each}
	</SettingsOptionRow>

	<div class="test-row">
		<Button onclick={sendTestNotification}>Test notification</Button>
	</div>
</div>
