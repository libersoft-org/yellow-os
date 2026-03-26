<script lang="ts">
	import Clickable from '../../../components/Clickable/Clickable.svelte';
	interface Props {
		src: string;
		label: string;
		active: boolean;
		onclick: () => void;
	}
	let { src, label, active, onclick }: Props = $props();
</script>

<style>
	.wallpaper-item {
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid transparent;
		transition: border-color 0.2s;
		cursor: pointer;
	}

	.wallpaper-item:hover {
		border-color: var(--color-text-dim);
	}

	.wallpaper-item.active {
		border-color: var(--color-accent);
	}

	.wallpaper-item .preview {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	.wallpaper-item .label {
		padding: 8px 6px;
		font-size: 14px;
		color: var(--color-text);
		background: var(--color-surface-2);
	}
</style>

<Clickable {onclick}>
	<div class="wallpaper-item" class:active>
		<img class="preview" {src} alt={label} />
		<div class="label">{label}</div>
	</div>
</Clickable>
