<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import { readFileText } from '../../scripts/opfs.ts';
	import { browser } from '$app/environment';
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

	function init(): void {
		win.title = 'Notepad' + (fileName ? ' - ' + fileName : '');
		if (browser && filePath && fileName) readFileText(filePath, fileName).then(text => (content = text));
	}
	init();

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
	<textarea class="editor" bind:value={content} placeholder="Start typing..." spellcheck="false"></textarea>
	<div class="statusbar">
		<span>Lines: {lineCount}</span>
		<span>Characters: {charCount}</span>
	</div>
</div>
