<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { removeNotification, onPauseChanged } from '../../scripts/notifications.svelte.ts';
	import { settings } from '../../scripts/settings.svelte.ts';
	import Clickable from '../Clickable/Clickable.svelte';
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		id: number;
		title?: string | undefined;
		description?: string | undefined;
		image?: string | undefined;
		imageColor?: string | undefined;
		onclick?: (() => void) | undefined;
		titleColor?: string | undefined;
		descriptionColor?: string | undefined;
		backgroundColor?: string | undefined;
		borderColor?: string | undefined;
	}
	let { id, title, description, image, imageColor, onclick, titleColor, descriptionColor, backgroundColor, borderColor }: Props = $props();
	let timerHandle: ReturnType<typeof setTimeout> | null = null;
	let remaining = $state(0);
	let timerStart = 0;
	let animClass = $state('');
	let closing = $state(false);
	const duration = $derived(settings.notificationDuration);
	const animation = $derived(settings.notificationAnimation);
	const position = $derived(settings.notificationPosition);

	function startTimer(): void {
		clearTimer();
		if (remaining <= 0 && duration > 0) remaining = duration * 1000;
		if (remaining > 0) {
			timerStart = Date.now();
			timerHandle = setTimeout(() => close(), remaining);
		}
	}

	function pauseTimer(): void {
		if (timerHandle !== null) {
			clearTimeout(timerHandle);
			timerHandle = null;
			remaining = Math.max(0, remaining - (Date.now() - timerStart));
		}
	}

	function clearTimer(): void {
		if (timerHandle !== null) {
			clearTimeout(timerHandle);
			timerHandle = null;
		}
	}

	function close(): void {
		if (closing) return;
		closing = true;
		clearTimer();
		if (animation === 'none') {
			removeNotification(id);
		} else if (animation === 'fade') {
			animClass = 'fade-out';
		} else {
			animClass = position.endsWith('right') ? 'slide-out-right' : 'slide-out-left';
		}
	}

	function onAnimationEnd(): void {
		if (closing) {
			removeNotification(id);
		} else {
			animClass = '';
			if (!paused) startTimer();
		}
	}

	function onCloseClick(e: MouseEvent): void {
		e.stopPropagation();
		close();
	}

	function onBodyClick(): void {
		if (onclick) onclick();
	}

	function onBodyKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') onBodyClick();
	}

	let paused = false;

	function onPauseChange(p: boolean): void {
		paused = p;
		if (closing) return;
		if (p) {
			pauseTimer();
		} else {
			startTimer();
		}
	}

	onMount(() => {
		onPauseChanged.add(onPauseChange);
		if (animation === 'none') {
			if (!paused) startTimer();
		} else if (animation === 'fade') {
			animClass = 'fade-in';
		} else {
			animClass = position.endsWith('right') ? 'slide-in-right' : 'slide-in-left';
		}
	});

	onDestroy(() => {
		onPauseChanged.delete(onPauseChange);
		clearTimer();
	});
</script>

<style>
	.notification {
		width: 320px;
		max-width: calc(100vw - 20px);
		border-radius: 10px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: 0 4px 16px var(--color-shadow);
		overflow: hidden;
		position: relative;
		cursor: default;
		animation-fill-mode: forwards;
	}

	.notification.clickable {
		cursor: pointer;
	}

	.notification.clickable:hover .body {
		background: var(--color-hover);
	}

	.body {
		display: flex;
		gap: 12px;
		padding: 12px;
		padding-right: 32px;
		transition: background 0.15s;
	}

	.image {
		width: 48px;
		height: 48px;
		border-radius: 8px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.image-colored {
		mask-size: contain;
		mask-repeat: no-repeat;
		mask-position: center;
		-webkit-mask-size: contain;
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
	}

	.text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		justify-content: center;
	}

	.title {
		font-size: 14px;
		font-weight: bold;
		color: var(--color-text);
		word-wrap: break-word;
	}

	.description {
		font-size: 13px;
		color: var(--color-text-dim);
		word-wrap: break-word;
	}

	.close {
		position: absolute;
		top: 4px;
		right: 4px;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.notification:hover .close {
		opacity: 1;
	}

	/* Slide animations */
	.slide-in-right {
		animation: slideInRight 0.3s ease forwards;
	}
	.slide-out-right {
		animation: slideOutRight 0.3s ease forwards;
	}
	.slide-in-left {
		animation: slideInLeft 0.3s ease forwards;
	}
	.slide-out-left {
		animation: slideOutLeft 0.3s ease forwards;
	}

	@keyframes slideInRight {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	@keyframes slideOutRight {
		from {
			transform: translateX(0);
			opacity: 1;
		}
		to {
			transform: translateX(100%);
			opacity: 0;
		}
	}
	@keyframes slideInLeft {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	@keyframes slideOutLeft {
		from {
			transform: translateX(0);
			opacity: 1;
		}
		to {
			transform: translateX(-100%);
			opacity: 0;
		}
	}

	/* Fade animations */
	.fade-in {
		animation: fadeIn 0.3s ease forwards;
	}
	.fade-out {
		animation: fadeOut 0.3s ease forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
</style>

{#snippet content()}
	<div class="body">
		{#if image}
			{#if imageColor}
				<div class="image image-colored" style:background-color={imageColor} style:-webkit-mask-image="url('{image}')" style:mask-image="url('{image}')"></div>
			{:else}
				<img class="image" src={image} alt="" />
			{/if}
		{/if}
		<div class="text">
			{#if title}
				<div class="title" style:color={titleColor}>{title}</div>
			{/if}
			{#if description}
				<div class="description" style:color={descriptionColor}>{description}</div>
			{/if}
		</div>
	</div>
	<div class="close">
		<Clickable onclick={onCloseClick}>
			<Icon img="/img/cross.svg" alt="Close" size="20px" padding="2px" colorVariable="--color-text-dim" />
		</Clickable>
	</div>
{/snippet}

{#if onclick}
	<div class="notification {animClass} clickable" role="button" tabindex="0" style:background={backgroundColor} style:border-color={borderColor} onanimationend={onAnimationEnd} onclick={onBodyClick} onkeydown={onBodyKeydown}>
		{@render content()}
	</div>
{:else}
	<div class="notification {animClass}" role="alert" style:background={backgroundColor} style:border-color={borderColor} onanimationend={onAnimationEnd}>
		{@render content()}
	</div>
{/if}
