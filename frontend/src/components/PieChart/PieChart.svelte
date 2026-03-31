<script lang="ts">
	export interface PieChartSegment {
		value: number;
		colorVariable: string;
		label?: string;
	}
	interface Props {
		segments: PieChartSegment[];
		size?: number;
		strokeWidth?: number;
	}
	const { segments, size = 120, strokeWidth = 24 }: Props = $props();
	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const center = $derived(size / 2);
	const total = $derived(segments.reduce((sum, s) => sum + s.value, 0));
	const arcs = $derived.by(() => {
		if (total <= 0) return [];
		const result: { offset: number; length: number; colorVariable: string }[] = [];
		let cumulative = 0;
		for (const seg of segments) {
			const fraction = seg.value / total;
			const length = fraction * circumference;
			const offset = circumference - cumulative * circumference + circumference * 0.25;
			result.push({ offset, length, colorVariable: seg.colorVariable });
			cumulative += fraction;
		}
		return result;
	});
</script>

<style>
	.pie-chart {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	circle {
		fill: none;
		transition: stroke-dasharray 0.3s ease;
	}
</style>

<div class="pie-chart">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<circle cx={center} cy={center} r={radius} stroke="var(--color-surface-2)" stroke-width={strokeWidth} />
		{#each arcs as arc}
			<circle cx={center} cy={center} r={radius} stroke="var({arc.colorVariable})" stroke-width={strokeWidth} stroke-dasharray="{arc.length} {circumference - arc.length}" stroke-dashoffset={arc.offset} />
		{/each}
	</svg>
</div>
