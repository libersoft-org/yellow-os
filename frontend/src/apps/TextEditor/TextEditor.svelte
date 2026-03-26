<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import { readFileText, writeFile } from '../../scripts/opfs.ts';
	import { closeWindow } from '../../scripts/window-store.svelte.ts';
	import { browser } from '$app/environment';
	import MenuBar from '../../components/MenuBar/MenuBar.svelte';
	import type { MenuBarMenu } from '../../components/MenuBar/menu-bar.ts';
	import StatusBar from '../../components/StatusBar/StatusBar.svelte';
	import Textarea from '../../components/Textarea/Textarea.svelte';
	interface Props {
		filePath?: string;
		fileName?: string;
	}
	const { filePath, fileName }: Props = $props();

	const win = getWindow();
	win.icon = '/img/apps/text-editor.svg';
	win.width = 640;
	win.height = 480;
	let content = $state('');
	let savedContent = $state('');
	let editorEl: HTMLTextAreaElement | undefined = $state();

	function updateTitle(name: string): void {
		win.title = 'Text Editor' + (name ? ' - ' + name : '');
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
	let hasSelection = $state(false);

	function updateSelection(): void {
		hasSelection = editorEl ? editorEl.selectionStart !== editorEl.selectionEnd : false;
	}

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
		const text = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
		navigator.clipboard.writeText(text);
		const start = editorEl.selectionStart;
		content = content.substring(0, start) + content.substring(editorEl.selectionEnd);
		editorEl.setSelectionRange(start, start);
		snapshot();
	}

	function copy(): void {
		if (!editorEl) return;
		const text = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
		navigator.clipboard.writeText(text);
	}

	function paste(): void {
		if (!editorEl) return;
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

	function handleKeydown(e: KeyboardEvent): void {
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
		}
	}

	const menus = $derived<MenuBarMenu[]>([
		{
			label: 'File',
			items: [{ label: 'New', shortcut: 'Ctrl+N', onclick: newFile }, { label: 'Open', shortcut: 'Ctrl+O', onclick: open }, { separator: true }, { label: 'Save', shortcut: 'Ctrl+S', disabled: !hasChanges || !filePath, onclick: save }, { label: 'Save As...', shortcut: 'Ctrl+Shift+S', onclick: saveAs }, { separator: true }, { label: 'Exit', onclick: exit }],
		},
		{
			label: 'Edit',
			items: [{ label: 'Undo', shortcut: 'Ctrl+Z', disabled: undoStack.length === 0, onclick: undo }, { label: 'Redo', shortcut: 'Ctrl+Y', disabled: redoStack.length === 0, onclick: redo }, { separator: true }, { label: 'Cut', shortcut: 'Ctrl+X', disabled: !hasSelection, onclick: cut }, { label: 'Copy', shortcut: 'Ctrl+C', disabled: !hasSelection, onclick: copy }, { label: 'Paste', shortcut: 'Ctrl+V', onclick: paste }],
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

	.statusbar-content {
		display: flex;
		justify-content: flex-end;
		gap: 16px;
		padding: 4px 12px;
		width: 100%;
	}
</style>

<div class="text-editor">
	<MenuBar {menus} />
	<Textarea bind:value={content} bind:ref={editorEl} oninput={handleInput} onkeydown={handleKeydown} onselect={updateSelection} onpointerup={updateSelection} onkeyup={updateSelection} placeholder="Start typing..." />
	<StatusBar>
		<div class="statusbar-content">
			<span>Lines: {lineCount}</span>
			<span>Characters: {charCount}</span>
		</div>
	</StatusBar>
</div>
