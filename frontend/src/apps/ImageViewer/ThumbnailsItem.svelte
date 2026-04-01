<script lang="ts">
	interface Props {
		name: string;
		src: string | undefined;
		active: boolean;
		onselect: (name: string) => void;
	}
	const { name, src, active, onselect }: Props = $props();
</script>

<style>
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

<div class="thumb" class:active role="button" tabindex="-1" onclick={() => onselect(name)} onkeydown={() => {}}>
	{#if src}
		<img {src} alt={name} />
	{/if}
</div>
