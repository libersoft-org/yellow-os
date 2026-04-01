<script lang="ts">
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { readFileText, readFileBlob, writeFile } from '../../scripts/fs/opfs.ts';
	import { closeWindow, onBeforeClose } from '../../scripts/window/window-store.svelte.ts';
	import { browser } from '$app/environment';
	import MenuBar from '../../components/MenuBar/MenuBar.svelte';
	import type { MenuBarMenu } from '../../components/MenuBar/menu-bar.ts';
	import Statusbar from '../../components/Statusbar/Statusbar.svelte';
	import StatusbarItem from '../../components/Statusbar/StatusbarItem.svelte';
	import Textarea from '../../components/Textarea/Textarea.svelte';
	import { setClipboardOwner, hasClipboard } from '../../scripts/fs/clipboard.svelte.ts';
	import { showDialog } from '../../scripts/ui/dialog.ts';
	import { printText } from '../../scripts/system/print.ts';
	import { showOpenDialog, showSaveDialog } from '../../components/Storage/storage.svelte.ts';
	import { untrack } from 'svelte';
	interface Props {
		filePath?: string;
		fileName?: string;
	}
	const props: Props = $props();
	const SIZE_LIMIT = 1024 * 1024;
	const win = getWindow();
	let currentFilePath = $state(untrack(() => props.filePath ?? ''));
	let currentFileDir = $derived(currentFilePath ? currentFilePath : '/');
	win.icon = '/img/apps/text-editor.svg';
	win.width = 640;
	win.height = 480;
	let content = $state('');
	let savedContent = $state('');
	let editorEl: HTMLTextAreaElement | undefined = $state();
	let currentFileName = $state('');
	let showLineNumbers = $state(true);
	let wordWrap = $state(false);

	function updateTitle(): void {
		const dirty = content !== savedContent;
		win.title = 'Text Editor' + (currentFileName ? ' - ' + currentFileName : '') + (dirty ? ' *' : '');
	}

	function handleEditorMount(el: HTMLTextAreaElement): void {
		editorEl = el;
		el.focus();
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function loadFile(): void {
		readFileText(props.filePath!, props.fileName!).then(text => {
			content = text;
			savedContent = text;
		});
	}

	function init(): void {
		currentFileName = props.fileName ?? '';
		updateTitle();
		if (browser && props.filePath && props.fileName) {
			readFileBlob(props.filePath, props.fileName).then(file => {
				if (file.size > SIZE_LIMIT) {
					showDialog({
						title: 'Large file',
						message: `This file is ${formatSize(file.size)}. Opening large files may slow down the editor. Do you want to continue?`,
						type: 'question',
						buttons: [
							{ label: 'Yes', backgroundColorVariable: '--color-accent', colorVariable: '--color-accent-fg', onclick: loadFile },
							{ label: 'No', onclick: () => closeWindow(win.id) },
						],
						onclosed: () => {
							if (content === '') closeWindow(win.id);
						},
					});
				} else {
					loadFile();
				}
			});
		}
	}
	init();

	const hasChanges = $derived(content !== savedContent);
	let hasSelection = $state(false);

	function updateSelection(): void {
		hasSelection = editorEl ? editorEl.selectionStart !== editorEl.selectionEnd : false;
	}

	function askSaveBeforeAction(action: () => void): void {
		if (!hasChanges) {
			action();
			return;
		}
		showDialog({
			title: 'Text Editor',
			message: `Do you want to save changes to "${currentFileName || 'Untitled'}"?`,
			type: 'question',
			buttons: [
				{
					label: 'Yes',
					backgroundColorVariable: '--color-accent',
					colorVariable: '--color-accent-fg',
					onclick: () => {
						if (currentFilePath && currentFileName) {
							writeFile(currentFilePath, currentFileName, content).then(() => {
								savedContent = content;
								action();
							});
						} else {
							showSaveDialog({ title: 'Save as ...', path: currentFileDir, fileName: currentFileName }).then(result => {
								if (!result) return;
								writeFile(result.path, result.name, content).then(() => {
									savedContent = content;
									action();
								});
							});
						}
					},
				},
				{
					label: 'No',
					onclick: action,
				},
				{ label: 'Cancel' },
			],
		});
	}

	function doNewFile(): void {
		content = '';
		savedContent = '';
		currentFileName = '';
		currentFilePath = '';
		undoStack = [];
		redoStack = [];
		lastSnapshot = '';
		updateTitle();
	}

	function newFile(): void {
		askSaveBeforeAction(doNewFile);
	}

	function doOpen(): void {
		showOpenDialog({ title: 'Open', path: currentFileDir }).then(result => {
			if (!result) return;
			readFileText(result.path, result.name).then(text => {
				content = text;
				savedContent = text;
				currentFileName = result.name;
				currentFilePath = result.path;
				undoStack = [];
				redoStack = [];
				lastSnapshot = text;
				updateTitle();
			});
		});
	}

	function open(): void {
		askSaveBeforeAction(doOpen);
	}

	function save(): void {
		if (!hasChanges) return;
		if (currentFilePath && currentFileName) {
			writeFile(currentFilePath, currentFileName, content).then(() => {
				savedContent = content;
				updateTitle();
			});
		} else saveAs();
	}

	function saveAs(): void {
		showSaveDialog({ title: 'Save as ...', path: currentFileDir, fileName: currentFileName }).then(result => {
			if (!result) return;
			writeFile(result.path, result.name, content).then(() => {
				currentFileName = result.name;
				currentFilePath = result.path;
				savedContent = content;
				updateTitle();
			});
		});
	}

	function printDocument(): void {
		printText(content, { title: currentFileName || 'Untitled' });
	}

	let forceClose = false;

	function confirmClose(): void {
		forceClose = true;
		closeWindow(win.id);
	}

	onBeforeClose(win.id, (): boolean => {
		if (forceClose) return true;
		if (!hasChanges) return true;
		askSaveBeforeAction(confirmClose);
		return false;
	});

	function exit(): void {
		closeWindow(win.id);
	}

	let undoStack = $state<string[]>([]);
	let redoStack = $state<string[]>([]);
	let lastSnapshot = $state('');

	function snapshot(): void {
		if (content !== lastSnapshot) {
			undoStack = [...undoStack, lastSnapshot];
			redoStack = [];
			lastSnapshot = content;
			updateTitle();
		}
	}

	function undo(): void {
		if (undoStack.length === 0) return;
		redoStack = [...redoStack, content];
		content = undoStack[undoStack.length - 1]!;
		undoStack = undoStack.slice(0, -1);
		lastSnapshot = content;
		updateTitle();
	}

	function redo(): void {
		if (redoStack.length === 0) return;
		undoStack = [...undoStack, content];
		content = redoStack[redoStack.length - 1]!;
		redoStack = redoStack.slice(0, -1);
		lastSnapshot = content;
		updateTitle();
	}

	function cut(): void {
		if (!editorEl) return;
		const text = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
		navigator.clipboard.writeText(text);
		setClipboardOwner('text');
		const start = editorEl.selectionStart;
		content = content.substring(0, start) + content.substring(editorEl.selectionEnd);
		editorEl.setSelectionRange(start, start);
		snapshot();
	}

	function copy(): void {
		if (!editorEl) return;
		const text = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
		navigator.clipboard.writeText(text);
		setClipboardOwner('text');
	}

	function paste(): void {
		if (!editorEl || hasClipboard()) return;
		navigator.clipboard.readText().then(text => {
			if (!editorEl || !text) return;
			const start = editorEl.selectionStart;
			const end = editorEl.selectionEnd;
			snapshot();
			content = content.substring(0, start) + text + content.substring(end);
			const cursorPos = start + text.length;
			requestAnimationFrame(() => editorEl!.setSelectionRange(cursorPos, cursorPos));
		});
	}

	function handleInput(): void {
		snapshot();
	}

	function toggleLineNumbers(): void {
		showLineNumbers = !showLineNumbers;
	}

	function toggleWordWrap(): void {
		wordWrap = !wordWrap;
	}

	function handleKeydown(e: KeyboardEvent): void {
		const isCopy = (e.ctrlKey && (e.key === 'c' || e.key === 'C')) || (e.ctrlKey && e.key === 'Insert');
		const isCut = e.ctrlKey && (e.key === 'x' || e.key === 'X');
		const isPaste = (e.ctrlKey && (e.key === 'v' || e.key === 'V')) || (e.shiftKey && e.key === 'Insert');
		if (isCopy) {
			setClipboardOwner('text');
			return;
		}
		if (isCut) {
			setClipboardOwner('text');
			return;
		}
		if (isPaste) {
			if (hasClipboard()) {
				e.preventDefault();
				return;
			}
			return;
		}
		if (!e.ctrlKey) return;
		switch (e.key.toLowerCase()) {
			case 'z':
				e.preventDefault();
				undo();
				break;
			case 'y':
				e.preventDefault();
				redo();
				break;
			case 'n':
				e.preventDefault();
				newFile();
				break;
			case 's':
				e.preventDefault();
				if (e.shiftKey) saveAs();
				else save();
				break;
			case 'o':
				e.preventDefault();
				open();
				break;
			case 'p':
				e.preventDefault();
				printDocument();
				break;
			case 'l':
				e.preventDefault();
				toggleLineNumbers();
				break;
			case 'm':
				e.preventDefault();
				toggleWordWrap();
				break;
		}
	}

	const menus = $derived<MenuBarMenu[]>([
		{
			label: 'File',
			items: [{ label: 'New', shortcut: 'Ctrl+N', onclick: newFile }, { label: 'Open', shortcut: 'Ctrl+O', onclick: open }, { separator: true }, { label: 'Save', shortcut: 'Ctrl+S', disabled: !hasChanges, onclick: save }, { label: 'Save as ...', shortcut: 'Ctrl+Shift+S', onclick: saveAs }, { separator: true }, { label: 'Print', shortcut: 'Ctrl+P', onclick: printDocument }, { separator: true }, { label: 'Exit', onclick: exit }],
		},
		{
			label: 'Edit',
			items: [{ label: 'Undo', shortcut: 'Ctrl+Z', disabled: undoStack.length === 0, onclick: undo }, { label: 'Redo', shortcut: 'Ctrl+Y', disabled: redoStack.length === 0, onclick: redo }, { separator: true }, { label: 'Cut', shortcut: 'Ctrl+X', disabled: !hasSelection, onclick: cut }, { label: 'Copy', shortcut: 'Ctrl+C', disabled: !hasSelection, onclick: copy }, { label: 'Paste', shortcut: 'Ctrl+V', onclick: paste }],
		},
		{
			label: 'View',
			items: [
				{ label: 'Word Wrap', shortcut: 'Ctrl+M', checked: wordWrap, onclick: toggleWordWrap },
				{ label: 'Line Numbers', shortcut: 'Ctrl+L', checked: showLineNumbers, onclick: toggleLineNumbers },
			],
		},
	]);

	function countLines(text: string): number {
		let count = 1;
		let pos = 0;
		while ((pos = text.indexOf('\n', pos)) !== -1) {
			count++;
			pos++;
		}
		return count;
	}

	const lineCount = $derived(countLines(content));
	const charCount = $derived(content.length);
</script>

<style>
	.text-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
</style>

<div class="text-editor">
	<MenuBar {menus} />
	<Textarea bind:value={content} lineNumbers={showLineNumbers} {wordWrap} onmount={handleEditorMount} oninput={handleInput} onkeydown={handleKeydown} onselect={updateSelection} onpointerup={updateSelection} onkeyup={updateSelection} placeholder="Start typing..." />
	<Statusbar>
		{#snippet right()}
			<StatusbarItem>Lines: {lineCount}</StatusbarItem>
			<StatusbarItem>Characters: {charCount}</StatusbarItem>
		{/snippet}
	</Statusbar>
</div>
