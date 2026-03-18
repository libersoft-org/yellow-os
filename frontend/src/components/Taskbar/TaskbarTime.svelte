<script lang="ts">
	import { onMount } from 'svelte';
	let time = $state(new Date());

	onMount(() => {
		const id = setInterval(() => (time = new Date()), 1000);
		return () => clearInterval(id);
	});

	function formatTime(d: Date): string {
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<style>
	.system-tray {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-left: 12px;
	}

	.clock {
		font-size: 16px;
		font-weight: bold;
		color: var(--color-text-dim);
		font-variant-numeric: tabular-nums;

		padding: 10px;
	}
</style>

<div class="system-tray">
	<span class="clock">{formatTime(time)}</span>
</div>
