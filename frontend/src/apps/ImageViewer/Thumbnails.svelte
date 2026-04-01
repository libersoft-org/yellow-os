<script lang="ts">
	import { tick } from 'svelte';
	import ThumbnailsItem from './ThumbnailsItem.svelte';
	interface Props {
		siblings: string[];
		thumbnails: Map<string, string>;
		currentName: string;
		onselect: (name: string) => void;
	}
	const { siblings, thumbnails, currentName, onselect }: Props = $props();
	let stripEl = $state<HTMLDivElement>();

	export async function scrollToActive(): Promise<void> {
		await tick();
		requestAnimationFrame(() => {
			if (!stripEl) return;
			const active = stripEl.querySelector('.thumb.active') as HTMLElement | null;
			if (!active) return;
			const stripW = stripEl.clientWidth;
			const thumbCenter = active.offsetLeft + active.offsetWidth / 2;
			stripEl.scrollTo({ left: thumbCenter - stripW / 2, behavior: 'smooth' });
		});
	}
</script>

<style>
	.thumbnails {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px calc(50% - 60px);
		background: var(--color-surface-2);
		border-top: 1px solid var(--color-border);
		overflow-x: auto;
		overflow-y: hidden;
		flex-shrink: 0;
		height: 128px;
		scrollbar-width: none;
	}

	.thumbnails::-webkit-scrollbar {
		display: none;
	}
</style>

<div class="thumbnails" bind:this={stripEl}>
	{#each siblings as name}
		<ThumbnailsItem {name} src={thumbnails.get(name)} active={name === currentName} {onselect} />
	{/each}
</div>
