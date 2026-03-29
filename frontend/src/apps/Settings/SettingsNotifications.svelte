<script lang="ts">
	import { settings } from '../../scripts/settings.svelte.ts';
	import type { NotificationPosition, NotificationAnimation } from '../../scripts/settings.svelte.ts';
	import { setNotificationPosition, setNotificationDuration, setNotificationAnimation, sendTestNotification } from './settings-notifications.ts';
	import SettingsTitle from './components/SettingsTitle.svelte';
	import SettingsOptionRow from './components/SettingsOptionRow.svelte';
	import SettingsOption from './components/SettingsOption.svelte';
	import SettingsDescription from './components/SettingsDescription.svelte';
	import Button from '../../components/Button/Button.svelte';
	import Input from '../../components/Input/Input.svelte';
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
	let durationValue = $state(String(settings.notificationDuration));

	function onDurationInput(value: string): void {
		const num = parseInt(value, 10);
		if (!isNaN(num) && num >= 0) setNotificationDuration(num);
	}
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

	.duration-input {
		width: 120px;
	}

	.duration-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.duration-unit {
		font-size: 14px;
		color: var(--color-text-dim);
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
	<div class="duration-row">
		<div class="duration-input">
			<Input type="number" bind:value={durationValue} oninput={onDurationInput} placeholder="10" min={0} />
		</div>
		<span class="duration-unit">seconds</span>
	</div>
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
