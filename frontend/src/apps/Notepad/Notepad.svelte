<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import { readFileText, writeFile } from '../../scripts/opfs.ts';
	import { closeWindow } from '../../scripts/window-store.svelte.ts';
	import { browser } from '$app/environment';
	import MenuBar from '../../components/MenuBar/MenuBar.svelte';
	import type { MenuBarMenu } from '../../components/MenuBar/menu-bar.ts';
	interface Props {
		filePath?: string;
		fileName?: string;
	}
	const { filePath, fileName }: Props = $props();

	const win = getWindow();
	win.icon = '/img/apps/notepad.svg';
	win.width = 640;
	win.height = 480;
	let content = $state('');
	let savedContent = $state('');
	let editorEl: HTMLTextAreaElement | undefined = $state();
	let clipboard = $state('');

	function updateTitle(name: string): void {
		win.title = 'Notepad' + (name ? ' - ' + name : '');
	}

	function init(): void {
		updateTitle(fileName ?? '');
		if (browser && filePath && fileName) {
			readFileText(filePath, fileName).then(text => {
				content = text;
				savedContent = text;
			});
		}
	}
	init();

	const hasChanges = $derived(content !== savedContent);
	const hasSelection = $derived(editorEl ? editorEl.selectionStart !== editorEl.selectionEnd : false);

	function newFile(): void {
		content = '';
		savedContent = '';
		updateTitle('');
	}

	function open(): void {
		// TODO: open file picker
	}

	function save(): void {
		if (!hasChanges) return;
		if (filePath && fileName) {
			writeFile(filePath, fileName, content).then(() => {
				savedContent = content;
			});
		}
	}

	function saveAs(): void {
		// TODO: save as dialog
	}

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
		}
	}

	function undo(): void {
		if (undoStack.length === 0) return;
		redoStack = [...redoStack, content];
		content = undoStack[undoStack.length - 1]!;
		undoStack = undoStack.slice(0, -1);
		lastSnapshot = content;
	}

	function redo(): void {
		if (redoStack.length === 0) return;
		undoStack = [...undoStack, content];
		content = redoStack[redoStack.length - 1]!;
		redoStack = redoStack.slice(0, -1);
		lastSnapshot = content;
	}

	function cut(): void {
		if (!editorEl) return;
		clipboard = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
		const start = editorEl.selectionStart;
		content = content.substring(0, start) + content.substring(editorEl.selectionEnd);
		editorEl.setSelectionRange(start, start);
		snapshot();
	}

	function copy(): void {
		if (!editorEl) return;
		clipboard = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
	}

	function paste(): void {
		if (!editorEl || !clipboard) return;
		const start = editorEl.selectionStart;
		const end = editorEl.selectionEnd;
		snapshot();
		content = content.substring(0, start) + clipboard + content.substring(end);
		const cursorPos = start + clipboard.length;
		requestAnimationFrame(() => editorEl!.setSelectionRange(cursorPos, cursorPos));
	}

	function handleInput(): void {
		snapshot();
	}

	const menus = $derived<MenuBarMenu[]>([
		{
			label: 'File',
			items: [{ label: 'New', shortcut: 'Ctrl+N', onclick: newFile }, { label: 'Open', shortcut: 'Ctrl+O', onclick: open }, { separator: true }, { label: 'Save', shortcut: 'Ctrl+S', disabled: !hasChanges || !filePath, onclick: save }, { label: 'Save As...', shortcut: 'Ctrl+Shift+S', onclick: saveAs }, { separator: true }, { label: 'Exit', onclick: exit }],
		},
		{
			label: 'Edit',
			items: [{ label: 'Undo', shortcut: 'Ctrl+Z', disabled: undoStack.length === 0, onclick: undo }, { label: 'Redo', shortcut: 'Ctrl+Y', disabled: redoStack.length === 0, onclick: redo }, { separator: true }, { label: 'Cut', shortcut: 'Ctrl+X', disabled: !hasSelection, onclick: cut }, { label: 'Copy', shortcut: 'Ctrl+C', disabled: !hasSelection, onclick: copy }, { label: 'Paste', shortcut: 'Ctrl+V', disabled: clipboard.length === 0, onclick: paste }],
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
	.notepad {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.editor {
		flex: 1;
		border: none;
		outline: none;
		resize: none;
		padding: 14px 16px;
		background: #0e0e20;
		color: var(--color-text);
		font-family: var(--font-family-mono);
		font-size: 14px;
		line-height: 1.6;
		tab-size: 4;
		user-select: text;
	}

	.editor::placeholder {
		color: var(--color-text-dim);
	}

	.statusbar {
		display: flex;
		justify-content: flex-end;
		gap: 16px;
		padding: 4px 12px;
		background: var(--color-surface-2);
		border-top: 1px solid var(--color-border);
		font-size: 11px;
		color: var(--color-text-dim);
		flex-shrink: 0;
	}
</style>

<div class="notepad">
	<MenuBar {menus} />
	<textarea class="editor" bind:this={editorEl} bind:value={content} oninput={handleInput} placeholder="Start typing..." spellcheck="false"></textarea>
	<div class="statusbar">
		<span>Lines: {lineCount}</span>
		<span>Characters: {charCount}</span>
	</div>
</div>
