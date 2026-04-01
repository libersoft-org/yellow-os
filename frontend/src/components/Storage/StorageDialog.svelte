<script lang="ts">
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { closeWindow } from '../../scripts/window/window-store.svelte.ts';
	import { browser } from '$app/environment';
	import { createStorageNavigation, loadDisks } from './storage.svelte.ts';
	import type { DiskInfo } from './storage.svelte.ts';
	import type { FileEntry } from '../../scripts/fs/file-entry.ts';
	import { showDialog } from '../../scripts/ui/dialog.ts';
	import StorageDrives from './StorageDrives.svelte';
	import StorageBrowser from './StorageBrowser.svelte';
	import PanelSeparator from '../PanelSeparator/PanelSeparator.svelte';
	import Toolbar from '../Toolbar/Toolbar.svelte';
	import ToolbarButton from '../Toolbar/ToolbarButton.svelte';
	import Breadcrumb from '../Breadcrumb/Breadcrumb.svelte';
	import Input from '../Input/Input.svelte';
	import Button from '../Button/Button.svelte';
	interface Props {
		mode: 'open' | 'save';
		startPath?: string;
		defaultFileName?: string;
		onconfirm?: (path: string, name: string) => void;
	}
	const props: Props = $props();
	const win = getWindow();
	const nav = createStorageNavigation(() => props.startPath ?? '/');
	const isSave = $derived(props.mode === 'save');
	let sidebarWidth = $state(160);
	let disks = $state<DiskInfo[]>([]);
	let fileName = $state(props.defaultFileName ?? '');
	let entries = $state<FileEntry[]>([]);
	const canConfirm = $derived(fileName.trim() !== '');

	function init(): void {
		if (browser) loadDisks().then(d => (disks = d));
	}
	init();

	function onSeparatorResize(dx: number): void {
		sidebarWidth = Math.max(120, Math.min(300, sidebarWidth + dx));
	}

	function navigateTo(navPath: string): void {
		nav.navigateTo(navPath);
		if (!isSave) fileName = '';
	}

	function onSelectionChange(selected: FileEntry[]): void {
		const file = selected.find(e => e.type === 'file');
		if (isSave) {
			if (file) fileName = file.name;
		} else {
			fileName = file ? file.name : '';
		}
	}

	function onEntriesChange(newEntries: FileEntry[]): void {
		entries = newEntries;
	}

	function doConfirm(): void {
		const trimmed = fileName.trim();
		if (!trimmed) return;
		props.onconfirm?.(nav.currentPath, trimmed);
		closeWindow(win.id);
	}

	function confirm(): void {
		const trimmed = fileName.trim();
		if (!trimmed) return;
		if (isSave) {
			const fileExists = entries.some(e => e.type === 'file' && e.name === trimmed);
			if (fileExists) {
				showDialog({
					title: 'Confirm Save',
					message: `"${trimmed}" already exists. Do you want to replace it?`,
					type: 'question',
					buttons: [{ label: 'Yes', backgroundColorVariable: '--color-accent', colorVariable: '--color-accent-fg', onclick: doConfirm }, { label: 'No' }],
				});
				return;
			}
		}
		doConfirm();
	}

	function handleFileOpen(filePath: string, name: string): void {
		if (isSave) {
			fileName = name;
			confirm();
		} else {
			fileName = name;
			props.onconfirm?.(filePath, name);
			closeWindow(win.id);
		}
	}

	function cancel(): void {
		closeWindow(win.id);
	}

	function handleInputKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') confirm();
		if (e.key === 'Escape') cancel();
	}

	function handleFileNameInput(value: string): void {
		fileName = value;
	}
</script>

<style>
	.storage-dialog {
		display: flex;
		flex-direction: column;
		height: 100%;
		user-select: none;
	}

	.body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.grid-area {
		flex: 1;
		overflow: auto;
	}

	.footer {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-top: 1px solid var(--color-border);
	}

	.footer .filename {
		flex: 1;
	}

	.footer-label {
		font-size: 13px;
		color: var(--color-text-dim);
		white-space: nowrap;
	}
</style>

<div class="storage-dialog">
	<Toolbar>
		<ToolbarButton enabled={nav.canGoBack} onclick={nav.goBack} title="Back" img="/img/arrow-left.svg" alt="Back" />
		<ToolbarButton enabled={nav.canGoForward} onclick={nav.goForward} title="Forward" img="/img/arrow-right.svg" alt="Forward" />
		<ToolbarButton enabled={nav.canGoUp} onclick={nav.goUp} title="Up" img="/img/arrow-up.svg" alt="Up" />
		<Breadcrumb segments={nav.breadcrumbSegments} onnavigate={navigateTo} />
	</Toolbar>
	<div class="body">
		<StorageDrives {disks} currentPath={nav.currentPath} onnavigate={navigateTo} width={sidebarWidth} />
		<PanelSeparator onresize={onSeparatorResize} />
		<div class="grid-area">
			{#key nav.currentPath}
				<StorageBrowser path={nav.currentPath} viewMode="list" onnavigate={navigateTo} onfileopen={handleFileOpen} onselectionchange={onSelectionChange} onentrieschange={onEntriesChange} />
			{/key}
		</div>
	</div>
	<div class="footer">
		<span class="footer-label">File name:</span>
		<div class="filename">
			{#if isSave}
				<Input value={fileName} oninput={handleFileNameInput} onkeydown={handleInputKeydown} autofocus selectAll />
			{:else}
				<Input value={fileName} onkeydown={handleInputKeydown} placeholder="Select a file..." />
			{/if}
		</div>
		<Button onclick={confirm} enabled={canConfirm} backgroundColorVariable="--color-accent" colorVariable="--color-accent-fg">{isSave ? 'Save' : 'Open'}</Button>
		<Button onclick={cancel}>Cancel</Button>
	</div>
</div>
