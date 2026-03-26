<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';
	import Clickable from '../Clickable/Clickable.svelte';

	interface Props {
		img?: string | undefined;
		alt?: string | undefined;
		size?: string | undefined;
		padding?: string | undefined;
		colorVariable?: string | undefined;
		badgeIcon?: string | undefined;
		badgeColorVariable?: string | undefined;
		onclick?: MouseEventHandler<HTMLDivElement>;
		oncontextmenu?: MouseEventHandler<HTMLDivElement>;
		enabled?: boolean | undefined;
		class?: string | undefined;
		title?: string | undefined;
		tabindex?: number | undefined;
	}
	let { img, alt = '', size = '24px', padding = '10px', colorVariable, badgeIcon, badgeColorVariable = '--color-success', onclick, oncontextmenu, enabled, class: className, title, tabindex }: Props = $props();
	const clickable = $derived(!!onclick || !!oncontextmenu);
</script>

<style>
	.icon {
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.icon-img {
		display: flex;
		user-select: none;
		mask-size: contain;
		mask-repeat: no-repeat;
		mask-position: center;
		-webkit-mask-size: contain;
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
	}

	.icon-img-plain {
		display: flex;
		user-select: none;
	}

	.badge {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.badge-img {
		display: flex;
		user-select: none;
		mask-size: contain;
		mask-repeat: no-repeat;
		mask-position: center;
		-webkit-mask-size: contain;
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
		filter: drop-shadow(0 0 0.4vh rgba(0, 0, 0, 1)) drop-shadow(0 0 0.4vh rgba(0, 0, 0, 1)) drop-shadow(0 0 0.4vh rgba(0, 0, 0, 1));
	}
</style>

{#snippet iconContent()}
	<div class="icon" style:padding>
		{#if colorVariable}
			<div class="icon-img" role="img" aria-label={alt} style:min-width={size} style:min-height={size} style:max-width={size} style:max-height={size} style:background-color="var({colorVariable})" style:mask-image="url('{img}')" style:-webkit-mask-image="url('{img}')"></div>
		{:else}
			<img class="icon-img-plain" style:min-width={size} style:min-height={size} style:max-width={size} style:max-height={size} src={img} draggable={false} {alt} />
		{/if}
		{#if badgeIcon}
			<div class="badge">
				<div class="badge-img" role="presentation" style:width="calc({size} * 0.5)" style:height="calc({size} * 0.5)" style:background-color="var({badgeColorVariable})" style:mask-image="url('{badgeIcon}')" style:-webkit-mask-image="url('{badgeIcon}')"></div>
			</div>
		{/if}
	</div>
{/snippet}

{#if img}
	{#if clickable}
		<Clickable class={className} {onclick} {oncontextmenu} {enabled} {title} {tabindex}>
			{@render iconContent()}
		</Clickable>
	{:else}
		{@render iconContent()}
	{/if}
{/if}
