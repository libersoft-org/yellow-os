<script lang="ts">
	import Icon from '../../components/Icon/Icon.svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	export interface BreadcrumbSegment {
		name: string;
		path: string;
	}
	interface Props {
		segments: BreadcrumbSegment[];
		onnavigate: (path: string) => void;
	}
	const { segments, onnavigate }: Props = $props();
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);
	let itemsEl: HTMLDivElement | undefined = $state();

	function updateOverflow(): void {
		if (!itemsEl) return;
		canScrollLeft = itemsEl.scrollLeft > 0;
		canScrollRight = itemsEl.scrollLeft + itemsEl.clientWidth < itemsEl.scrollWidth - 1;
	}

	function scrollToEnd(): void {
		if (!itemsEl) return;
		itemsEl.scrollLeft = itemsEl.scrollWidth;
		updateOverflow();
	}

	function handleScrollLeft(): void {
		if (!itemsEl) return;
		itemsEl.scrollBy({ left: -itemsEl.clientWidth * 0.6, behavior: 'smooth' });
	}

	function handleScrollRight(): void {
		if (!itemsEl) return;
		itemsEl.scrollBy({ left: itemsEl.clientWidth * 0.6, behavior: 'smooth' });
	}

	function trackOverflow(node: HTMLDivElement): { destroy: () => void } {
		itemsEl = node;
		const resizeObserver = new ResizeObserver(updateOverflow);
		resizeObserver.observe(node);
		const mutationObserver = new MutationObserver(scrollToEnd);
		mutationObserver.observe(node, { childList: true, subtree: true });
		scrollToEnd();
		return {
			destroy(): void {
				resizeObserver.disconnect();
				mutationObserver.disconnect();
			},
		};
	}
</script>

<style>
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0;

		margin-left: 8px;
		flex: 1;
		min-width: 0;
	}

	.scroll-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 24px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.scroll-arrow:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.scroll-arrow:active {
		background: rgba(255, 255, 255, 0.15);
	}

	.items {
		display: flex;
		align-items: center;
		gap: 2px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.breadcrumb-item {
		color: var(--color-text-dim);
		font-size: 13px;
		padding: 4px 6px;
		border-radius: 4px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.breadcrumb-item:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--color-text);
	}

	.breadcrumb-item.current {
		color: var(--color-text);
		font-weight: bold;
		cursor: default;
	}

	.breadcrumb-item.current:hover {
		background: none;
	}

	.separator {
		flex-shrink: 0;
	}
</style>

<div class="breadcrumb">
	{#if canScrollLeft}
		<Clickable onclick={handleScrollLeft} title="Scroll left">
			<div class="scroll-arrow">
				<Icon img="/img/caret-left.svg" size="10px" padding="0" colorVariable="--color-text-dim" />
			</div>
		</Clickable>
	{/if}
	<div class="items" use:trackOverflow onscroll={updateOverflow}>
		{#each segments as segment, i}
			{#if i > 0}
				<div class="separator">
					<Icon img="/img/caret-right.svg" size="10px" padding="0" colorVariable="--color-text-dim" />
				</div>
			{/if}
			{#if i === segments.length - 1}
				<span class="breadcrumb-item current">{segment.name}</span>
			{:else}
				<Clickable onclick={() => onnavigate(segment.path)}>
					<div class="breadcrumb-item">{segment.name}</div>
				</Clickable>
			{/if}
		{/each}
	</div>
	{#if canScrollRight}
		<Clickable onclick={handleScrollRight} title="Scroll right">
			<div class="scroll-arrow">
				<Icon img="/img/caret-right.svg" size="10px" padding="0" colorVariable="--color-text-dim" />
			</div>
		</Clickable>
	{/if}
</div>
