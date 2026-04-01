<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { closeWindow } from '../../scripts/window/window-store.svelte.ts';
	import { readFileBlob, readDirectory, writeFile, moveToTrash, deleteEntry } from '../../scripts/fs/opfs.ts';
	import { notifyDirectoryChange } from '../../scripts/fs/opfs-notify.ts';
	import { showDialog } from '../../scripts/ui/dialog.ts';
	import { formatBytes } from '../../scripts/system/format.ts';
	import StatusBar from '../../components/StatusBar/StatusBar.svelte';
	import MenuBar from '../../components/MenuBar/MenuBar.svelte';
	import type { MenuBarMenu } from '../../components/MenuBar/menu-bar.ts';
	import ImageViewerToolbar from './ImageViewerToolbar.svelte';
	import ImageViewerCanvas from './ImageViewerCanvas.svelte';
	import Thumbnails from './Thumbnails.svelte';
	import { isImageFile, getMimeType, renderCroppedImage, renderTransformedImage, type CropRect } from './image-viewer.ts';
	import { WALLPAPERS_PATH } from '../../scripts/fs/opfs-init.ts';
	interface Props {
		filePath?: string;
		fileName?: string;
	}
	const { filePath: initDir, fileName: initName }: Props = $props();
	const win = getWindow();
	win.title = 'Image Viewer';
	win.icon = '/img/apps/image-viewer.svg';
	win.width = 800;
	win.height = 600;
	win.minWidth = 400;
	win.minHeight = 300;
	win.position = 'center';
	let currentDir = $state('/');
	let currentName = $state('');
	let imageSrc = $state('');
	let imageWidth = $state(0);
	let imageHeight = $state(0);
	let fileSize = $state(0);
	let zoom = $state(1);
	let zoomMode = $state<'fit' | 'actual' | 'custom'>('fit');
	let rotation = $state(0);
	let flipH = $state(false);
	let flipV = $state(false);
	let modified = $state(false);
	let siblings = $state<string[]>([]);
	let thumbnails = $state<Map<string, string>>(new Map());
	let panX = $state(0);
	let panY = $state(0);
	let cropping = $state(false);
	let cropRect = $state<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
	let thumbnailsEl = $state<Thumbnails>();
	let canvas = $state<ImageViewerCanvas>();
	const currentIndex = $derived(siblings.indexOf(currentName));
	const canNavigate = $derived(siblings.length > 1);
	const isSwapped = $derived(rotation === 90 || rotation === 270);
	const displayWidth = $derived(isSwapped ? imageHeight : imageWidth);
	const displayHeight = $derived(isSwapped ? imageWidth : imageHeight);
	const zoomLabel = $derived(Math.round(zoom * 100) + '%');
	const dimensionsLabel = $derived(imageWidth > 0 ? `${imageWidth} × ${imageHeight}` : '');
	const sizeLabel = $derived(fileSize > 0 ? formatBytes(fileSize) : '');
	const menus = $derived<MenuBarMenu[]>([
		{
			label: 'File',
			items: [{ label: 'Save', shortcut: 'Ctrl+S', disabled: !modified, onclick: saveImage }, { separator: true }, { label: 'Delete', shortcut: 'Del', disabled: !currentName, onclick: () => doDelete(false) }, { label: 'Permanently Delete', shortcut: 'Shift+Del', disabled: !currentName, onclick: () => doDelete(true) }, { separator: true }, { label: 'Exit', onclick: () => closeWindow(win.id) }],
		},
		{
			label: 'View',
			items: [
				{ label: 'Zoom In', shortcut: '+', onclick: zoomIn },
				{ label: 'Zoom Out', shortcut: '−', onclick: zoomOut },
				{ label: 'Fit to Window', shortcut: '0', checked: zoomMode === 'fit', onclick: fitToWindow },
				{ label: 'Actual Size', shortcut: '1', checked: zoomMode === 'actual', onclick: zoomActual },
			],
		},
		{
			label: 'Image',
			items: [{ label: 'Rotate Left', shortcut: ',', onclick: rotateLeft }, { label: 'Rotate Right', shortcut: '.', onclick: rotateRight }, { label: 'Flip Horizontal', shortcut: 'H', checked: flipH, onclick: toggleFlipH }, { label: 'Flip Vertical', shortcut: 'V', checked: flipV, onclick: toggleFlipV }, { separator: true }, { label: 'Crop', shortcut: 'C', checked: cropping, onclick: startCrop }],
		},
		{
			label: 'Navigate',
			items: [
				{ label: 'Previous Image', shortcut: '←', disabled: !canNavigate, onclick: navigatePrev },
				{ label: 'Next Image', shortcut: '→', disabled: !canNavigate, onclick: navigateNext },
			],
		},
	]);

	async function loadSiblings(): Promise<void> {
		try {
			const entries = await readDirectory(currentDir);
			siblings = entries
				.filter(e => e.type === 'file' && isImageFile(e.name))
				.map(e => e.name)
				.sort((a, b) => a.localeCompare(b));
		} catch {
			siblings = currentName ? [currentName] : [];
		}
	}

	async function loadImage(dir: string, name: string): Promise<void> {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		imageSrc = '';
		imageWidth = 0;
		imageHeight = 0;
		fileSize = 0;
		rotation = 0;
		flipH = false;
		flipV = false;
		modified = false;
		panX = 0;
		panY = 0;
		cropping = false;
		currentDir = dir;
		currentName = name;
		win.title = 'Image Viewer - ' + name;
		try {
			const blob = await readFileBlob(dir, name);
			fileSize = blob.size;
			const url = URL.createObjectURL(blob);
			imageSrc = url;
			const img = new Image();
			img.onload = (): void => {
				imageWidth = img.naturalWidth;
				imageHeight = img.naturalHeight;
				fitToWindow();
			};
			img.src = url;
		} catch {
			imageSrc = '';
		}
		thumbnailsEl?.scrollToActive();
	}

	function revokeAllThumbnails(): void {
		for (const [, url] of thumbnails) URL.revokeObjectURL(url);
	}

	function setThumbnail(name: string, blob: Blob): void {
		const old = thumbnails.get(name);
		if (old) URL.revokeObjectURL(old);
		const thumbMap = new Map(thumbnails);
		thumbMap.set(name, URL.createObjectURL(blob));
		thumbnails = thumbMap;
	}

	function removeThumbnail(name: string): void {
		const old = thumbnails.get(name);
		if (old) URL.revokeObjectURL(old);
		const thumbMap = new Map(thumbnails);
		thumbMap.delete(name);
		thumbnails = thumbMap;
	}

	async function loadThumbnails(): Promise<void> {
		const newThumbs = new Map<string, string>();
		for (const name of siblings) {
			try {
				const blob = await readFileBlob(currentDir, name);
				newThumbs.set(name, URL.createObjectURL(blob));
			} catch {
				/* skip */
			}
		}
		revokeAllThumbnails();
		thumbnails = newThumbs;
	}

	function fitToWindow(): void {
		const container = canvas?.getContainer();
		if (!container || displayWidth === 0 || displayHeight === 0) return;
		const cw = container.clientWidth;
		const ch = container.clientHeight;
		zoom = Math.min(cw / displayWidth, ch / displayHeight, 1);
		zoomMode = 'fit';
		panX = 0;
		panY = 0;
	}

	function zoomActual(): void {
		zoom = 1;
		zoomMode = 'actual';
		panX = 0;
		panY = 0;
	}
	function zoomIn(): void {
		zoom = Math.min(zoom * 1.25, 20);
		zoomMode = 'custom';
	}
	function zoomOut(): void {
		zoom = Math.max(zoom / 1.25, 0.05);
		zoomMode = 'custom';
	}

	function rotateLeft(): void {
		rotation = (rotation + 270) % 360;
		modified = true;
		if (zoomMode === 'fit') requestAnimationFrame(fitToWindow);
	}
	function rotateRight(): void {
		rotation = (rotation + 90) % 360;
		modified = true;
		if (zoomMode === 'fit') requestAnimationFrame(fitToWindow);
	}
	function toggleFlipH(): void {
		flipH = !flipH;
		modified = true;
	}
	function toggleFlipV(): void {
		flipV = !flipV;
		modified = true;
	}

	function startCrop(): void {
		if (cropping) {
			cropping = false;
			return;
		}
		cropping = true;
		const margin = 0.1;
		cropRect = {
			x: Math.round(imageWidth * margin),
			y: Math.round(imageHeight * margin),
			w: Math.round(imageWidth * (1 - 2 * margin)),
			h: Math.round(imageHeight * (1 - 2 * margin)),
		};
	}

	async function applyCrop(): Promise<void> {
		if (!cropping || cropRect.w < 1 || cropRect.h < 1) return;
		const blob = await renderCroppedImage(imageSrc, cropRect, getMimeType(currentName));
		if (!blob) return;
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		imageSrc = URL.createObjectURL(blob);
		imageWidth = cropRect.w;
		imageHeight = cropRect.h;
		modified = true;
		cropping = false;
		if (zoomMode === 'fit') requestAnimationFrame(fitToWindow);
	}

	async function saveImage(): Promise<void> {
		if (!modified) return;
		const blob = await renderTransformedImage(imageSrc, imageWidth, imageHeight, rotation, flipH, flipV, getMimeType(currentName));
		if (!blob) return;
		await writeFile(currentDir, currentName, blob);
		notifyDirectoryChange(currentDir);
		const outW = isSwapped ? imageHeight : imageWidth;
		const outH = isSwapped ? imageWidth : imageHeight;
		modified = false;
		rotation = 0;
		flipH = false;
		flipV = false;
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		imageSrc = URL.createObjectURL(blob);
		imageWidth = outW;
		imageHeight = outH;
		if (thumbnails.has(currentName)) setThumbnail(currentName, blob);
	}

	function navigatePrev(): void {
		if (siblings.length < 2) return;
		const idx = currentIndex > 0 ? currentIndex - 1 : siblings.length - 1;
		loadImage(currentDir, siblings[idx]!);
	}

	function navigateNext(): void {
		if (siblings.length < 2) return;
		const idx = currentIndex < siblings.length - 1 ? currentIndex + 1 : 0;
		loadImage(currentDir, siblings[idx]!);
	}

	function doDelete(permanent: boolean): void {
		const name = currentName;
		const nextName = siblings.length > 1 ? (currentIndex < siblings.length - 1 ? siblings[currentIndex + 1]! : siblings[currentIndex - 1]!) : null;
		const action = permanent ? 'permanently delete' : 'move to Trash';
		const title = permanent ? 'Permanently Delete' : 'Delete';
		const buttonLabel = permanent ? 'Delete' : 'Move to Trash';
		showDialog({
			title,
			message: `Are you sure you want to ${action} "${name}"?`,
			type: 'question',
			buttons: [
				{
					label: buttonLabel,
					backgroundColorVariable: '--color-danger',
					colorVariable: '--color-accent-fg',
					onclick: async () => {
						try {
							if (permanent) await deleteEntry(currentDir, name);
							else await moveToTrash(currentDir, name);
							notifyDirectoryChange(currentDir);
							if (!permanent) notifyDirectoryChange('/Trash');
							siblings = siblings.filter(s => s !== name);
							if (thumbnails.has(name)) removeThumbnail(name);
							if (nextName && siblings.includes(nextName)) loadImage(currentDir, nextName);
							else if (siblings.length > 0) loadImage(currentDir, siblings[0]!);
							else closeWindow(win.id);
						} catch {
							showDialog({ title: 'Error', message: `Failed to ${action} "${name}".`, type: 'warning', buttons: [{ label: 'OK' }] });
						}
					},
				},
				{ label: 'Cancel' },
			],
		});
	}

	const KEY_MAP: Record<string, () => void> = {
		ArrowLeft: navigatePrev,
		ArrowRight: navigateNext,
		'+': zoomIn,
		'=': zoomIn,
		'-': zoomOut,
		'0': fitToWindow,
		'1': zoomActual,
		',': rotateLeft,
		'.': rotateRight,
		h: toggleFlipH,
		H: toggleFlipH,
		v: toggleFlipV,
		V: toggleFlipV,
		c: startCrop,
		C: startCrop,
	};

	function handleKeydown(e: KeyboardEvent): void {
		if (cropping) {
			if (e.key === 'Enter') {
				e.preventDefault();
				applyCrop();
				return;
			}
			if (e.key === 'Escape') {
				e.preventDefault();
				cropping = false;
				return;
			}
		}
		if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
			e.preventDefault();
			saveImage();
			return;
		}
		if (e.key === 'Delete') {
			e.preventDefault();
			doDelete(e.shiftKey);
			return;
		}
		const action = KEY_MAP[e.key];
		if (action) {
			e.preventDefault();
			action();
		}
	}

	function handleZoomChange(z: number, m: 'fit' | 'actual' | 'custom'): void {
		zoom = z;
		zoomMode = m;
	}

	function handlePanChange(x: number, y: number): void {
		panX = x;
		panY = y;
	}

	function handleRectChange(r: CropRect): void {
		cropRect = r;
	}

	function cancelCrop(): void {
		cropping = false;
	}

	function handleThumbSelect(name: string): void {
		if (name !== currentName) loadImage(currentDir, name);
	}

	function init(): void {
		if (initDir && initName) {
			loadImage(initDir, initName);
			loadSiblings()
				.then(() => loadThumbnails())
				.then(() => thumbnailsEl?.scrollToActive());
		} else {
			currentDir = WALLPAPERS_PATH;
			loadSiblings().then(async () => {
				await loadThumbnails();
				if (siblings.length > 0) loadImage(currentDir, siblings[0]!);
			});
		}
	}
	init();

	onDestroy(() => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		revokeAllThumbnails();
	});

	function keyboardAction(node: HTMLDivElement): { destroy: () => void } {
		node.tabIndex = 0;
		node.addEventListener('keydown', handleKeydown);
		return {
			destroy(): void {
				node.removeEventListener('keydown', handleKeydown);
			},
		};
	}
</script>

<style>
	.image-viewer {
		display: flex;
		flex-direction: column;
		height: 100%;
		outline: none;
	}

	.status-item {
		padding: 2px 10px;
		border-right: 1px solid var(--color-border);
		white-space: nowrap;
	}

	.status-item:last-child {
		border-right: none;
	}
</style>

<div class="image-viewer" role="application" use:keyboardAction>
	<MenuBar {menus} />
	<ImageViewerToolbar {canNavigate} {zoomMode} {flipH} {flipV} {cropping} {modified} onnavprev={navigatePrev} onnavnext={navigateNext} onzoomin={zoomIn} onzoomout={zoomOut} onzoomfit={fitToWindow} onzoomactual={zoomActual} onrotateleft={rotateLeft} onrotateright={rotateRight} onfliph={toggleFlipH} onflipv={toggleFlipV} oncrop={startCrop} onsave={saveImage} ondelete={() => doDelete(false)} />
	<ImageViewerCanvas bind:this={canvas} {imageSrc} {imageWidth} {imageHeight} {displayWidth} {displayHeight} {zoom} {zoomMode} {rotation} {flipH} {flipV} {panX} {panY} {cropping} {cropRect} {currentName} onzoomchange={handleZoomChange} onpanchange={handlePanChange} onrectchange={handleRectChange} onapplycrop={applyCrop} oncancelcrop={cancelCrop} onfitrequest={fitToWindow} />
	{#if siblings.length > 1}
		<Thumbnails bind:this={thumbnailsEl} {siblings} {thumbnails} {currentName} onselect={handleThumbSelect} />
	{/if}
	<StatusBar>
		<span class="status-item">{currentName}</span>
		{#if dimensionsLabel}<span class="status-item">{dimensionsLabel}</span>{/if}
		<span class="status-item">{zoomLabel}</span>
		{#if sizeLabel}<span class="status-item">{sizeLabel}</span>{/if}
	</StatusBar>
</div>
