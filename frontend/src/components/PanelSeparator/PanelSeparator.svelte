<script lang="ts">
	interface Props {
		direction?: 'vertical' | 'horizontal';
		onresize: (delta: number) => void;
	}
	const { direction = 'vertical', onresize }: Props = $props();
	let dragging = $state(false);
	const isHorizontal = $derived(direction === 'horizontal');

	function onpointerdown(e: PointerEvent): void {
		e.preventDefault();
		dragging = true;
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
	}

	function onpointermove(e: PointerEvent): void {
		if (!dragging) return;
		onresize(isHorizontal ? e.movementY : e.movementX);
	}

	function onpointerup(): void {
		dragging = false;
	}
</script>

<style>
	.separator {
		flex-shrink: 0;
		display: flex;
		justify-content: center;
	}

	.separator.vertical {
		width: 5px;
		cursor: col-resize;
	}

	.separator.horizontal {
		height: 5px;
		cursor: row-resize;
		align-items: center;
	}

	.separator .line {
		background: var(--color-border);
	}

	.separator.vertical .line {
		width: 1px;
		height: 100%;
	}

	.separator.horizontal .line {
		height: 1px;
		width: 100%;
	}

	.separator.dragging .line {
		background: var(--color-accent);
	}
</style>

<div class="separator" class:vertical={!isHorizontal} class:horizontal={isHorizontal} class:dragging role="separator" aria-valuenow={0} {onpointerdown} {onpointermove} {onpointerup}>
	<div class="line"></div>
</div>
