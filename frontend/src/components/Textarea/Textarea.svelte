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
	let mirrorWidth = $state(0);
	const mount: Action<HTMLTextAreaElement> = node => {
		onmount?.(node);
		function updateWidth(): void {
			const cs = getComputedStyle(node);
			mirrorWidth = node.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		}
		updateWidth();
		const ro = new ResizeObserver(updateWidth);
		ro.observe(node);
		return {
			destroy(): void {
				ro.disconnect();
			},
		};
	};

	function handleScroll(e: Event): void {
		scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
		if (gutterEl) gutterEl.scrollTop = scrollTop;
	}

	const lines = $derived(value.split('\n'));
	const gutterWidth = $derived('calc(' + String(lines.length).length + 'ch + 16px)');
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

	.line-row {
		position: relative;
		overflow: hidden;
	}

	.line-row .line-number {
		position: absolute;
		right: 0;
		top: 0;
	}

	.mirror {
		visibility: hidden;
		white-space: pre-wrap;
		word-break: break-all;
		overflow-wrap: break-word;
		tab-size: 4;
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
		<div class="gutter" bind:this={gutterEl} style:width={wordWrap ? gutterWidth : undefined}>
			{#each lines as line, i}
				{#if wordWrap && mirrorWidth > 0}
					<div class="line-row">
						<span class="line-number">{i + 1}</span>
						<div class="mirror" style:width={mirrorWidth + 'px'}>{line || ' '}</div>
					</div>
				{:else}
					<div class="line-number">{i + 1}</div>
				{/if}
			{/each}
		</div>
	{/if}
	<textarea class="textarea" class:word-wrap={wordWrap} use:mount bind:value {placeholder} {oninput} {onkeydown} {onselect} {onpointerup} {onkeyup} onscroll={handleScroll} spellcheck="false"></textarea>
</div>
