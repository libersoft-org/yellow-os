<script lang="ts">
	import { getWindow } from '../../scripts/window/window-context.ts';
	import Icon from '../../components/Icon/Icon.svelte';
	import ListItem from '../../components/List/ListItem.svelte';
	import SettingsDesktop from './SettingsDesktop.svelte';
	import SettingsTaskbar from './SettingsTaskbar.svelte';
	import SettingsNotifications from './SettingsNotifications.svelte';
	import SettingsReset from './SettingsReset.svelte';

	const win = getWindow();
	win.title = 'Settings';
	win.icon = '/img/apps/settings.svg';
	win.width = 800;
	win.height = 600;
	win.minWidth = 512;
	win.minHeight = 384;
	type Section = 'desktop' | 'taskbar' | 'notifications' | 'reset';
	let activeSection = $state<Section>('desktop');
	const sections: { id: Section; label: string; icon: string }[] = [
		{ id: 'desktop', label: 'Desktop', icon: '/img/settings/desktop.svg' },
		{ id: 'taskbar', label: 'Taskbar', icon: '/img/settings/taskbar.svg' },
		{ id: 'notifications', label: 'Notifications', icon: '/img/settings/notification.svg' },
		{ id: 'reset', label: 'Factory reset', icon: '/img/settings/reset.svg' },
	];

	function selectSection(id: Section): void {
		activeSection = id;
	}
</script>

<style>
	.settings {
		display: flex;
		height: 100%;
		user-select: none;
	}

	.sidebar {
		flex-shrink: 0;
		width: 180px;
		overflow-y: auto;
		padding: 8px;
		border-right: 1px solid var(--color-border);
		background: var(--color-surface-2);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
	}
</style>

<div class="settings">
	<div class="sidebar">
		{#each sections as section}
			<ListItem onclick={() => selectSection(section.id)} active={activeSection === section.id}>
				<Icon img={section.icon} alt={section.label} size="18px" padding="0" colorVariable="--color-text" />
				<div>{section.label}</div>
			</ListItem>
		{/each}
	</div>
	<div class="content">
		{#if activeSection === 'desktop'}
			<SettingsDesktop />
		{:else if activeSection === 'taskbar'}
			<SettingsTaskbar />
		{:else if activeSection === 'notifications'}
			<SettingsNotifications />
		{:else if activeSection === 'reset'}
			<SettingsReset />
		{/if}
	</div>
</div>
