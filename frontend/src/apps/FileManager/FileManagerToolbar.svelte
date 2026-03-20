<script lang="ts">
	import Icon from '../../components/Icon/Icon.svelte';
	import Breadcrumb, { type BreadcrumbSegment } from '../../components/Breadcrumb/Breadcrumb.svelte';
	interface Props {
		canGoBack: boolean;
		canGoForward: boolean;
		canGoUp: boolean;
		breadcrumbSegments: BreadcrumbSegment[];
		onback: () => void;
		onforward: () => void;
		onup: () => void;
		onnavigate: (path: string) => void;
	}
	const { canGoBack, canGoForward, canGoUp, breadcrumbSegments, onback, onforward, onup, onnavigate }: Props = $props();
</script>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 6px 8px;
		background: var(--color-surface-2);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.toolbar-btn {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.toolbar-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}

	.toolbar-btn:active:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.toolbar-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}
</style>

<div class="toolbar">
	<button class="toolbar-btn" disabled={!canGoBack} onclick={onback} title="Back">
		<Icon img="/img/arrow-left.svg" alt="Back" size="16px" padding="0" colorVariable="--color-text" />
	</button>
	<button class="toolbar-btn" disabled={!canGoForward} onclick={onforward} title="Forward">
		<Icon img="/img/arrow-right.svg" alt="Forward" size="16px" padding="0" colorVariable="--color-text" />
	</button>
	<button class="toolbar-btn" disabled={!canGoUp} onclick={onup} title="Up">
		<Icon img="/img/arrow-up.svg" alt="Up" size="16px" padding="0" colorVariable="--color-text" />
	</button>
	<Breadcrumb segments={breadcrumbSegments} {onnavigate} />
</div>
