<script lang="ts">
	import Icon from '../Icon/Icon.svelte';
	import Clickable from '../Clickable/Clickable.svelte';
	interface Props {
		icon: string;
		name: string;
		onclick: () => void;
	}
	let { icon, name, onclick }: Props = $props();
</script>

<style>
	.menu-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		border-radius: 10px;
		font-size: 14px;
		color: var(--color-text);
		background: transparent;
		transition: background 0.3s linear;
	}

	.menu-item:hover {
		background: var(--color-hover);
	}
</style>

<Clickable {onclick}>
	<div class="menu-item">
		<Icon img={icon} alt={name} size="18px" padding="0" colorVariable="--color-text" />
		<div>{name}</div>
	</div>
</Clickable>
