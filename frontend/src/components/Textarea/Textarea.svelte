<script lang="ts">
	import type { Action } from 'svelte/action';
	interface Props {
		value: string;
		placeholder?: string;
		lineNumbers?: boolean;
		wordWrap?: boolean;
		oninput?: () => void;
		onkeydown?: (e: KeyboardEvent) => void;
		onselect?: () => void;
		onpointerup?: () => void;
		onkeyup?: () => void;
		onmount?: (el: HTMLTextAreaElement) => void;
	}
	let { value = $bindable(), placeholder = '', lineNumbers = false, wordWrap = false, oninput, onkeydown, onselect, onpointerup, onkeyup, onmount }: Props = $props();

	let gutterEl: HTMLDivElement | undefined = $state();
	let scrollTop = $state(0);

	const mount: Action<HTMLTextAreaElement> = node => {
		onmount?.(node);
	};

	function handleScroll(e: Event): void {
		scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
		if (gutterEl) gutterEl.scrollTop = scrollTop;
	}

	function countLines(text: string): number {
		let count = 1;
		let pos = 0;
		while ((pos = text.indexOf('\n', pos)) !== -1) {
			count++;
			pos++;
		}
		return count;
	}

	const lineCount = $derived(countLines(value));
</script>

<style>
	.textarea-wrapper {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.gutter {
		flex-shrink: 0;
		overflow: hidden;
		padding: 14px 0;
		border-right: 1px solid var(--color-border);
		text-align: right;
		user-select: none;
		color: var(--color-text);
		background-color: var(--color-surface-2);
		font-family: var(--font-family-mono);
		font-size: 16px;
		line-height: 1.4;
	}

	.line-number {
		padding: 0 8px;
	}

	.textarea {
		flex: 1;
		border: none;
		outline: none;
		resize: none;
		padding: 14px 16px;
		background: var(--color-surface);
		color: var(--color-text);
		font-family: var(--font-family-mono);
		font-size: 16px;
		line-height: 1.4;
		tab-size: 4;
		user-select: text;
		white-space: pre;
		overflow-x: auto;
	}

	.textarea::placeholder {
		color: var(--color-text-dim);
	}

	.textarea.word-wrap {
		white-space: pre-wrap;
		word-break: break-all;
		overflow-wrap: break-word;
	}
</style>

<div class="textarea-wrapper">
	{#if lineNumbers}
		<div class="gutter" bind:this={gutterEl}>
			{#each { length: lineCount } as _, i}
				<div class="line-number">{i + 1}</div>
			{/each}
		</div>
	{/if}
	<textarea class="textarea" class:word-wrap={wordWrap} use:mount bind:value {placeholder} {oninput} {onkeydown} {onselect} {onpointerup} {onkeyup} onscroll={handleScroll} spellcheck="false"></textarea>
</div>
