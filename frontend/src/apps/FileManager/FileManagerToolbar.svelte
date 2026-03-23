<script lang="ts">
	import Breadcrumb, { type BreadcrumbSegment } from '../../components/Breadcrumb/Breadcrumb.svelte';
	import Toolbar from '../../components/Toolbar/Toolbar.svelte';
	import ToolbarButton from '../../components/Toolbar/ToolbarButton.svelte';
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

<Toolbar>
	<ToolbarButton enabled={canGoBack} onclick={onback} title="Back" img="/img/arrow-left.svg" alt="Back" />
	<ToolbarButton enabled={canGoForward} onclick={onforward} title="Forward" img="/img/arrow-right.svg" alt="Forward" />
	<ToolbarButton enabled={canGoUp} onclick={onup} title="Up" img="/img/arrow-up.svg" alt="Up" />
	<Breadcrumb segments={breadcrumbSegments} {onnavigate} />
</Toolbar>
