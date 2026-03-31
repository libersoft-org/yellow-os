<script lang="ts">
	interface Props {
		percentage: number;
		animated?: boolean;
	}

	const { percentage, animated = false }: Props = $props();
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
		height: 100%;
		background: var(--color-accent);
		border-radius: 9px;
		transition: width 0.15s ease;
	}

	.progress-bar-fill.animated {
		background-image: linear-gradient(-45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
		background-size: 18px 18px;
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
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text);
	}
</style>

<div class="progress-bar-container">
	<div class="progress-bar-fill" class:animated style:width="{percentage}%"></div>
	<div class="progress-bar-text">{percentage}%</div>
</div>
