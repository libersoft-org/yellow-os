<script lang="ts">
	import { tick } from 'svelte';
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
	.thumb-strip {
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

	.thumb-strip::-webkit-scrollbar {
		display: none;
	}

	.thumb {
		flex-shrink: 0;
		width: 112px;
		height: 112px;
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		border: 2px solid transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #222;
	}

	.thumb.active {
		border-color: var(--color-accent);
	}

	.thumb:hover:not(.active) {
		border-color: var(--color-text-dim);
	}

	.thumb img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		pointer-events: none;
	}
</style>

<div class="thumb-strip" bind:this={stripEl}>
	{#each siblings as name}
		<div class="thumb" class:active={name === currentName} role="button" tabindex="-1" onclick={() => onselect(name)} onkeydown={() => {}}>
			{#if thumbnails.has(name)}
				<img src={thumbnails.get(name)} alt={name} />
			{/if}
		</div>
	{/each}
</div>
