<script lang="ts">
	interface Props {
		onresize: (dx: number) => void;
	}
	const { onresize }: Props = $props();
	let dragging = $state(false);

	function onpointerdown(e: PointerEvent): void {
		e.preventDefault();
		dragging = true;
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
	}

	function onpointermove(e: PointerEvent): void {
		if (!dragging) return;
		onresize(e.movementX);
	}

	function onpointerup(): void {
		dragging = false;
	}
</script>

<style>
	.separator {
		width: 5px;
		cursor: col-resize;
		flex-shrink: 0;
		display: flex;
		justify-content: center;
	}

	.separator .line {
		width: 1px;
		background: var(--color-border);
	}

	.separator.dragging .line {
		background: var(--color-accent);
	}
</style>

<div class="separator" class:dragging role="separator" aria-valuenow={0} {onpointerdown} {onpointermove} {onpointerup}>
	<div class="line"></div>
</div>
