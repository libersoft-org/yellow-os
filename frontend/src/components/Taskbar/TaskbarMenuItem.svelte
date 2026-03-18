<script lang="ts">
	import Icon from '../Icon/Icon.svelte';
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
		padding: 8px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--color-text);
		font-size: 13px;
		cursor: pointer;
		text-align: left;
	}

	.menu-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>

<button class="menu-item" {onclick}>
	<Icon img={icon} alt={name} size="18px" padding="0" colorVariable="--color-text" />
	<span>{name}</span>
</button>
