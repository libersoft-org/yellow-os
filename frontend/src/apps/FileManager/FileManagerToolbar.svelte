<script lang="ts">
	import Breadcrumb, { type BreadcrumbSegment } from '../../components/Breadcrumb/Breadcrumb.svelte';
	import Toolbar from '../../components/Toolbar/Toolbar.svelte';
	import ToolbarButton from '../../components/Toolbar/ToolbarButton.svelte';
	interface Props {
		canGoBack: boolean;
		canGoForward: boolean;
		canGoUp: boolean;
		breadcrumbSegments: BreadcrumbSegment[];
		viewMode: 'grid' | 'list';
		onback: () => void;
		onforward: () => void;
		onup: () => void;
		onnavigate: (path: string) => void;
		onviewmode: (mode: 'grid' | 'list') => void;
	}
	const { canGoBack, canGoForward, canGoUp, breadcrumbSegments, viewMode, onback, onforward, onup, onnavigate, onviewmode }: Props = $props();
</script>

<style>
	.spacer {
		flex: 1;
	}
</style>

<Toolbar>
	<ToolbarButton enabled={canGoBack} onclick={onback} title="Back" img="/img/arrow-left.svg" alt="Back" />
	<ToolbarButton enabled={canGoForward} onclick={onforward} title="Forward" img="/img/arrow-right.svg" alt="Forward" />
	<ToolbarButton enabled={canGoUp} onclick={onup} title="Up" img="/img/arrow-up.svg" alt="Up" />
	<Breadcrumb segments={breadcrumbSegments} {onnavigate} />
	<div class="spacer"></div>
	<ToolbarButton onclick={() => onviewmode('grid')} title="Grid view" img="/img/view-grid.svg" alt="Grid view" active={viewMode === 'grid'} />
	<ToolbarButton onclick={() => onviewmode('list')} title="List view" img="/img/view-list.svg" alt="List view" active={viewMode === 'list'} />
</Toolbar>
