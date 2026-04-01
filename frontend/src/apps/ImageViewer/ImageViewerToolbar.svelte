<script lang="ts">
	import Toolbar from '../../components/Toolbar/Toolbar.svelte';
	import ToolbarButton from '../../components/Toolbar/ToolbarButton.svelte';
	import ToolbarSeparator from '../../components/Toolbar/ToolbarSeparator.svelte';
	interface Props {
		hasPrev: boolean;
		hasNext: boolean;
		zoomMode: 'fit' | 'actual' | 'custom';
		flipH: boolean;
		flipV: boolean;
		cropping: boolean;
		modified: boolean;
		onnavprev: () => void;
		onnavnext: () => void;
		onzoomin: () => void;
		onzoomout: () => void;
		onzoomfit: () => void;
		onzoomactual: () => void;
		onrotateleft: () => void;
		onrotateright: () => void;
		onfliph: () => void;
		onflipv: () => void;
		oncrop: () => void;
		onsave: () => void;
		ondelete: () => void;
	}
	const { hasPrev, hasNext, zoomMode, flipH, flipV, cropping, modified, onnavprev, onnavnext, onzoomin, onzoomout, onzoomfit, onzoomactual, onrotateleft, onrotateright, onfliph, onflipv, oncrop, onsave, ondelete }: Props = $props();
</script>

<Toolbar>
	<ToolbarButton enabled={hasPrev} onclick={onnavprev} title="Previous image (←)" img="/img/arrow-left.svg" alt="Previous" />
	<ToolbarButton enabled={hasNext} onclick={onnavnext} title="Next image (→)" img="/img/arrow-right.svg" alt="Next" />
	<ToolbarSeparator />
	<ToolbarButton onclick={onzoomout} title="Zoom out (−)" img="/img/apps/ImageViewer/zoom-out.svg" alt="Zoom out" />
	<ToolbarButton onclick={onzoomin} title="Zoom in (+)" img="/img/apps/ImageViewer/zoom-in.svg" alt="Zoom in" />
	<ToolbarButton onclick={onzoomfit} title="Fit to window (0)" img="/img/apps/ImageViewer/zoom-fit.svg" alt="Fit" active={zoomMode === 'fit'} />
	<ToolbarButton onclick={onzoomactual} title="Actual size (1)" img="/img/apps/ImageViewer/zoom-actual.svg" alt="1:1" active={zoomMode === 'actual'} />
	<ToolbarSeparator />
	<ToolbarButton onclick={onrotateleft} title="Rotate left (,)" img="/img/apps/ImageViewer/rotate-left.svg" alt="Rotate left" />
	<ToolbarButton onclick={onrotateright} title="Rotate right (.)" img="/img/apps/ImageViewer/rotate-right.svg" alt="Rotate right" />
	<ToolbarButton onclick={onfliph} title="Flip horizontal (H)" img="/img/apps/ImageViewer/flip-h.svg" alt="Flip H" active={flipH} />
	<ToolbarButton onclick={onflipv} title="Flip vertical (V)" img="/img/apps/ImageViewer/flip-v.svg" alt="Flip V" active={flipV} />
	<ToolbarButton onclick={oncrop} title="Crop (C)" img="/img/apps/ImageViewer/crop.svg" alt="Crop" active={cropping} />
	<ToolbarSeparator />
	<ToolbarButton enabled={modified} onclick={onsave} title="Save (Ctrl+S)" img="/img/apps/ImageViewer/save.svg" alt="Save" />
	<ToolbarButton onclick={ondelete} title="Delete (Del)" img="/img/apps/trash.svg" alt="Delete" />
</Toolbar>
