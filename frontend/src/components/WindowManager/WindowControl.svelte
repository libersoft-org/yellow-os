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
		width: 26px;
		height: 22px;
		border-radius: 4px;
		background: transparent;
		color: var(--color-text);
		font-size: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
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

<Clickable {onclick}>
	<div class="control" class:focused class:close={variant === 'close'}>
		<Icon {img} {alt} size="14px" padding="0" colorVariable={focused ? '--color-accent-fg' : '--color-text'} />
	</div>
</Clickable>
