<script lang="ts">
	import Icon from '../../components/Icon/Icon.svelte';
	export interface BreadcrumbSegment {
		name: string;
		path: string;
	}
	interface Props {
		segments: BreadcrumbSegment[];
		onnavigate: (path: string) => void;
	}
	const { segments, onnavigate }: Props = $props();
</script>

<style>
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 0 8px;
		margin-left: 8px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.breadcrumb-item {
		all: unset;
		color: var(--color-text-dim);
		font-size: 13px;
		padding: 4px 6px;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.breadcrumb-item:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--color-text);
	}

	.breadcrumb-item.current {
		color: var(--color-text);
		font-weight: 600;
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
	{#each segments as segment, i}
		{#if i > 0}
			<div class="separator">
				<Icon img="/img/caret-right.svg" size="10px" padding="0" colorVariable="--color-text-dim" />
			</div>
		{/if}
		{#if i === segments.length - 1}
			<span class="breadcrumb-item current">{segment.name}</span>
		{:else}
			<button class="breadcrumb-item" onclick={() => onnavigate(segment.path)}>{segment.name}</button>
		{/if}
	{/each}
</div>
