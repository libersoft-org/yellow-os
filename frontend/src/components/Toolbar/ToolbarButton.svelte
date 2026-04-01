<script lang="ts">
	import Clickable from '../Clickable/Clickable.svelte';
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		img: string;
		alt: string;
		title: string;
		onclick: (e: MouseEvent) => void;
		enabled?: boolean | undefined;
		active?: boolean | undefined;
	}
	const { img, alt, title, onclick, enabled = true, active = false }: Props = $props();
</script>

<style>
	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.toolbar-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.toolbar-btn:active {
		background: rgba(255, 255, 255, 0.15);
	}

	.toolbar-btn.active {
		background: rgba(255, 255, 255, 0.15);
	}
</style>

<Clickable {onclick} {enabled} {title}>
	<div class="toolbar-btn" class:active>
		<Icon {img} {alt} size="20px" padding="0" colorVariable={enabled ? '--color-text' : '--color-text-dim'} />
	</div>
</Clickable>
