<script lang="ts">
	import Clickable from '../Clickable/Clickable.svelte';
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		img: string;
		alt: string;
		onclick: () => void;
		focused?: boolean | undefined;
		variant?: 'default' | 'close' | undefined;
	}
	const { img, alt, onclick, focused = false, variant = 'default' }: Props = $props();
</script>

<style>
	.control {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background-color: transparent;
		color: var(--color-text);
	}

	.control:hover {
		background: var(--color-hover);
	}

	.control.focused {
		color: var(--color-accent-fg);
	}

	.control.focused:hover {
		background: var(--color-hover-on-accent);
	}

	.control.close:hover {
		background: var(--color-danger);
		color: var(--color-text);
	}
</style>

<Clickable {onclick} tabindex={-1} onpointerdown={(e: PointerEvent) => e.preventDefault()}>
	<div class="control" class:focused class:close={variant === 'close'}>
		<Icon {img} {alt} size="14px" padding="0" colorVariable={focused ? '--color-accent-fg' : '--color-text'} />
	</div>
</Clickable>
