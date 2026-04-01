<script lang="ts">
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { readYappManifest, buildBlobUrl, isYappFile, resolveYappIcon } from './app-player.ts';
	import type { YappManifest } from './app-player.ts';
	import { registerDropZone } from '../../scripts/ui/drag-state.svelte.ts';
	import { focusWindow } from '../../scripts/window/window-store.svelte.ts';
	import Spinner from '../../components/Spinner/Spinner.svelte';
	import Icon from '../../components/Icon/Icon.svelte';
	import { showOpenDialog } from '../../components/Storage/storage.svelte.ts';
	interface Props {
		filePath?: string;
		fileName?: string;
	}
	const { filePath, fileName }: Props = $props();
	const win = getWindow();
	win.title = 'App Player';
	win.icon = '/img/apps/app-player.svg';
	win.width = 640;
	win.height = 480;
	win.position = 'center';
	let iframeSrc = $state('');
	let loading = $state(true);
	let error = $state('');
	let dragging = $state(false);
	const hasFile = $derived(!!filePath && !!fileName);

	async function loadYapp(dir: string, name: string): Promise<void> {
		loading = true;
		error = '';
		iframeSrc = '';
		try {
			const manifest = await readYappManifest(dir, name);
			if (!manifest) {
				error = 'Invalid .yapp manifest file.';
				loading = false;
				return;
			}
			await applyManifest(dir, manifest);
			iframeSrc = await buildBlobUrl(dir, manifest.entry);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load app.';
		}
		loading = false;
	}

	async function applyManifest(dir: string, manifest: YappManifest): Promise<void> {
		win.title = manifest.name ?? '';
		if (manifest.icon) {
			try {
				win.icon = await resolveYappIcon(dir, manifest.icon);
			} catch {
				/* keep default icon */
			}
		}
		const w = manifest.window;
		if (!w) return;
		if (w.width !== undefined) win.width = w.width;
		if (w.height !== undefined) win.height = w.height;
		if (w.minWidth !== undefined) win.minWidth = w.minWidth;
		if (w.minHeight !== undefined) win.minHeight = w.minHeight;
		if (w.maxWidth !== undefined) win.maxWidth = w.maxWidth ?? Infinity;
		if (w.maxHeight !== undefined) win.maxHeight = w.maxHeight ?? Infinity;
		if (w.resizable !== undefined) win.resizable = w.resizable;
		if (w.canMinimize !== undefined) win.canMinimize = w.canMinimize;
		if (w.canMaximize !== undefined) win.canMaximize = w.canMaximize;
		if (w.showInTaskbar !== undefined) win.showInTaskbar = w.showInTaskbar;
		if (w.position !== undefined) win.position = w.position;
		if (w.state !== undefined) win.state = w.state;
	}

	function initFromProps(): void {
		if (filePath && fileName) loadYapp(filePath, fileName);
	}
	initFromProps();

	function handleDragOver(e: DragEvent): void {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave(): void {
		dragging = false;
	}

	async function handleDrop(e: DragEvent): Promise<void> {
		e.preventDefault();
		dragging = false;
		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;
		const file = files[0]!;
		if (!isYappFile(file.name)) {
			error = 'Please drop a .yapp file.';
			return;
		}
		try {
			loading = true;
			error = '';
			iframeSrc = '';
			const text = await file.text();
			const manifest = JSON.parse(text) as Partial<YappManifest>;
			if (typeof manifest.name !== 'string' || typeof manifest.entry !== 'string') {
				error = 'Invalid .yapp manifest file.';
				loading = false;
				return;
			}
			applyManifest('/', manifest as YappManifest);
			error = 'Drag & drop from host OS requires all app files to be on OPFS.\nUse File Browser to upload the app first.';
			loading = false;
		} catch {
			error = 'Failed to read dropped file.';
			loading = false;
		}
	}

	function appPlayerDropZone(el: HTMLElement): { destroy(): void } {
		return { destroy: registerDropZone(el, handleOPFSDrop) };
	}

	function handleOPFSDrop(sourcePath: string, fileNames: string[]): void {
		if (fileNames.length !== 1) return;
		const name = fileNames[0]!;
		if (!isYappFile(name)) return;
		focusWindow(win.id);
		loadYapp(sourcePath, name);
	}

	async function open(): Promise<void> {
		const result = await showOpenDialog({ title: 'Open .yapp file' });
		if (!result) return;
		if (!isYappFile(result.name)) {
			error = 'Please select a .yapp file.';
			return;
		}
		loadYapp(result.path, result.name);
	}
</script>

<style>
	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 12px;
		color: var(--color-text);
		user-select: none;
	}

	.error {
		color: var(--color-danger);
		white-space: pre-line;
		text-align: center;
		padding: 16px;
	}

	.app-frame {
		width: 100%;
		height: 100%;
		border: none;
		display: block;
	}

	.drop-zone {
		cursor: default;
		border: 2px dashed var(--color-border);
		border-radius: 12px;
		margin: 16px;
		height: calc(100% - 32px);
		box-sizing: border-box;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}

	.drop-zone.dragging {
		border-color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
	}

	.hint {
		font-size: 0.85em;
		opacity: 0.6;
		text-align: center;
		line-height: 1.5;
	}
</style>

{#if loading && hasFile}
	<div class="center">
		<Spinner show={true} size="64px" />
		<p>Loading app...</p>
	</div>
{:else if error}
	<div class="center">
		<p class="error">{error}</p>
	</div>
{:else if iframeSrc}
	<iframe src={iframeSrc} title={win.title} sandbox="allow-scripts" class="app-frame"></iframe>
{:else}
	<div
		class="center drop-zone"
		class:dragging
		role="button"
		tabindex="0"
		onclick={open}
		onkeydown={e => {
			if (e.key === 'Enter') open();
		}}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		use:appPlayerDropZone
	>
		<Icon img="/img/apps/app-player.svg" size="48px" padding="0" colorVariable="--color-text" />
		<p>Open a <strong>.yapp</strong> file</p>
		<p class="hint">Click here to browse, double-click a .yapp in File Browser<br />or drag & drop it here</p>
	</div>
{/if}
