<script lang="ts">
	import { notifications, onNotificationAdded, setPaused } from '../../scripts/ui/notifications.svelte.ts';
	import { settings } from '../../scripts/system/settings.svelte.ts';
	import { onMount, onDestroy, tick } from 'svelte';
	import Notification from './Notification.svelte';
	const position = $derived(settings.notificationPosition);
	const isTop = $derived(position.startsWith('top'));
	const isRight = $derived(position.endsWith('right'));
	const ordered = $derived(isTop ? [...notifications].reverse() : notifications);
	let container: HTMLDivElement | undefined = $state();

	async function scrollToNewest(): Promise<void> {
		await tick();
		if (!container) return;
		if (isTop) {
			container.scrollTop = 0;
		} else {
			container.scrollTop = container.scrollHeight;
		}
	}

	function onPointerEnter(): void {
		setPaused(true);
	}

	function onPointerLeave(): void {
		setPaused(false);
	}

	onMount(() => {
		onNotificationAdded.add(scrollToNewest);
	});

	onDestroy(() => {
		onNotificationAdded.delete(scrollToNewest);
	});
</script>

<style>
	.notification-container {
		position: fixed;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px;
		max-height: 50vh;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
	}

	.notification-container > :global(*) {
		flex-shrink: 0;
	}
</style>

{#if notifications.length > 0}
	<div class="notification-container" bind:this={container} role="log" onpointerenter={onPointerEnter} onpointerleave={onPointerLeave} style:top={isTop ? '0' : 'auto'} style:bottom={isTop ? 'auto' : 'var(--taskbar-height)'} style:left={isRight ? 'auto' : '0'} style:right={isRight ? '0' : 'auto'} style:padding-bottom="10px" style:padding-top="10px">
		{#each ordered as notif (notif.id)}
			<Notification id={notif.id} title={notif.title} description={notif.description} image={notif.image} imageColor={notif.imageColor} onclick={notif.onclick} titleColor={notif.titleColor} descriptionColor={notif.descriptionColor} backgroundColor={notif.backgroundColor} borderColor={notif.borderColor} />
		{/each}
	</div>
{/if}
