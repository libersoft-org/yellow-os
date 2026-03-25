<script lang="ts">
	import Icon from '../Icon/Icon.svelte';
	import ListItem from '../ListItem/ListItem.svelte';
	interface ContextMenuItem {
		icon: string;
		label: string;
		onclick: () => void;
	}
	interface Props {
		items: ContextMenuItem[];
		x: number;
		y: number;
		onclose: () => void;
	}
	const { items, x, y, onclose }: Props = $props();

	function adjustPosition(node: HTMLDivElement): void {
		const rect = node.getBoundingClientRect();
		const taskbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 0;
		const maxY = globalThis.innerHeight - taskbarHeight;
		node.style.left = `${x + rect.width > globalThis.innerWidth ? x - rect.width : x}px`;
		node.style.top = `${y + rect.height > maxY ? y - rect.height : y}px`;
	}

	function handlePointerDown(e: PointerEvent): void {
		if (!(e.target as HTMLElement).closest('.context-menu')) onclose();
	}

	function handleContextMenu(e: MouseEvent): void {
		e.preventDefault();
		onclose();
	}
</script>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
	}

	.context-menu {
		position: fixed;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 6px;
		min-width: 180px;
		box-shadow: 0 4px 20px var(--color-shadow);
	}
</style>

<div class="backdrop" role="none" onpointerdown={handlePointerDown} oncontextmenu={handleContextMenu}>
	<div class="context-menu" use:adjustPosition style:left="{x}px" style:top="{y}px">
		{#each items as item}
			<ListItem
				onclick={() => {
					item.onclick();
					onclose();
				}}
			>
				<Icon img={item.icon} alt={item.label} size="16px" padding="0" colorVariable="--color-text" />
				<div>{item.label}</div>
			</ListItem>
		{/each}
	</div>
</div>
