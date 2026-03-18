<script lang="ts">
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		icon: string;
		title: string;
		active: boolean;
		dragging: boolean;
		translateX: number;
		onpointerdown: (e: PointerEvent) => void;
	}

	let { icon, title, active, dragging, translateX, onpointerdown }: Props = $props();
</script>

<style>
	.window-btn {
		height: calc(var(--taskbar-height) - 16px);
		padding: 0 12px;
		/*border: 1px solid var(--color-border);*/
		border-radius: 8px;
		background-color: var(--color-bg);
		color: var(--color-text);
		font-size: 12px;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 180px;
		display: flex;
		align-items: center;
		gap: 6px;
		transition:
			background 0.15s,
			color 0.15s;
		user-select: none;
		touch-action: none;
	}

	.window-title {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.window-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
	}

	.window-btn.active {
		background: rgba(255, 255, 255, 0.14);
		color: var(--color-text);
		border-bottom: 2px solid var(--color-accent);
		font-weight: bold;
	}

	.window-btn.dragging {
		z-index: 1;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		background: rgba(255, 255, 255, 0.14);
	}
</style>

<div class="window-btn" class:active class:dragging style:transform={dragging ? `translateX(${translateX}px)` : ''} {onpointerdown} role="tab" tabindex="-1">
	<Icon img={icon} alt={title} size="16px" padding="0" colorVariable={active ? '--color-text' : '--color-text-dim'} />
	<span class="window-title">{title}</span>
</div>
