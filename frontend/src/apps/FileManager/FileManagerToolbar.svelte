<script lang="ts">
	import Breadcrumb, { type BreadcrumbSegment } from '../../components/Breadcrumb/Breadcrumb.svelte';
	import Toolbar from '../../components/Toolbar/Toolbar.svelte';
	import ToolbarButton from '../../components/Toolbar/ToolbarButton.svelte';
	import ToolbarSeparator from '../../components/Toolbar/ToolbarSeparator.svelte';
	interface Props {
		canGoBack: boolean;
		canGoForward: boolean;
		canGoUp: boolean;
		breadcrumbSegments: BreadcrumbSegment[];
		viewMode: 'grid' | 'list';
		showInfo: boolean;
		onback: () => void;
		onforward: () => void;
		onup: () => void;
		onnavigate: (path: string) => void;
		onviewmode: (mode: 'grid' | 'list') => void;
		ontoggleinfo: () => void;
	}
	const { canGoBack, canGoForward, canGoUp, breadcrumbSegments, viewMode, showInfo, onback, onforward, onup, onnavigate, onviewmode, ontoggleinfo }: Props = $props();
</script>

<Toolbar>
	<ToolbarButton enabled={canGoBack} onclick={onback} title="Back" img="/img/arrow-left.svg" alt="Back" />
	<ToolbarButton enabled={canGoForward} onclick={onforward} title="Forward" img="/img/arrow-right.svg" alt="Forward" />
	<ToolbarButton enabled={canGoUp} onclick={onup} title="Up" img="/img/arrow-up.svg" alt="Up" />
	<Breadcrumb segments={breadcrumbSegments} {onnavigate} />
	<ToolbarButton onclick={() => onviewmode('grid')} title="Grid view" img="/img/view-grid.svg" alt="Grid view" active={viewMode === 'grid'} />
	<ToolbarButton onclick={() => onviewmode('list')} title="List view" img="/img/view-list.svg" alt="List view" active={viewMode === 'list'} />
	<ToolbarSeparator />
	<ToolbarButton onclick={ontoggleinfo} title="Toggle info panel" img="/img/info-panel.svg" alt="Info panel" active={showInfo} />
</Toolbar>
