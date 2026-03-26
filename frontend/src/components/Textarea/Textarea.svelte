<script lang="ts">
	import type { Action } from 'svelte/action';
	interface Props {
		value: string;
		placeholder?: string;
		oninput?: () => void;
		onkeydown?: (e: KeyboardEvent) => void;
		onselect?: () => void;
		onpointerup?: () => void;
		onkeyup?: () => void;
		onmount?: (el: HTMLTextAreaElement) => void;
	}
	let { value = $bindable(), placeholder = '', oninput, onkeydown, onselect, onpointerup, onkeyup, onmount }: Props = $props();

	const mount: Action<HTMLTextAreaElement> = node => {
		onmount?.(node);
	};
</script>

<style>
	.textarea {
		flex: 1;
		border: none;
		outline: none;
		resize: none;
		background: var(--color-surface);
		color: var(--color-text);
		font-family: var(--font-family-mono);
		font-size: 16px;
		line-height: 1.4;
		tab-size: 4;
		user-select: text;
	}

	.textarea::placeholder {
		color: var(--color-text-dim);
	}
</style>

<textarea class="textarea" use:mount bind:value {placeholder} {oninput} {onkeydown} {onselect} {onpointerup} {onkeyup} spellcheck="false"></textarea>
