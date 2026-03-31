<script lang="ts">
	interface Props {
		percentage: number;
		animated?: boolean;
	}

	const { percentage, animated = false }: Props = $props();

	let barWidth: number = $state(0);
</script>

<style>
	.progress-bar-container {
		width: 100%;
		height: 18px;
		background: var(--color-surface-2);
		border-radius: 9px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--color-accent);
		border-radius: 9px;
		transition: width 0.15s ease;
		background-image: linear-gradient(-45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
		background-size: 18px 18px;
	}

	.progress-bar-fill.animated {
		animation: stripes 0.6s linear infinite;
	}

	@keyframes stripes {
		0% {
			background-position: 18px 0;
		}
		100% {
			background-position: 0 0;
		}
	}

	.progress-bar-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 11px;
		font-weight: 600;
		color: var(--color-accent);
	}

	.progress-bar-clip {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		overflow: hidden;
	}

	.progress-bar-clip .progress-bar-text {
		left: 0;
		width: var(--bar-width);
		transform: translateY(-50%);
		text-align: center;
		color: var(--color-accent-fg);
	}
</style>

<div class="progress-bar-container" bind:clientWidth={barWidth}>
	<div class="progress-bar-fill" class:animated style:width="{percentage}%"></div>
	<span class="progress-bar-text">{percentage}%</span>
	<div class="progress-bar-clip" style:width="{percentage}%" style="--bar-width: {barWidth}px">
		<span class="progress-bar-text">{percentage}%</span>
	</div>
</div>
