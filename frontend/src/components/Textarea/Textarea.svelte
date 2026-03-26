<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		oninput?: () => void;
		onkeydown?: (e: KeyboardEvent) => void;
		onselect?: () => void;
		onpointerup?: () => void;
		onkeyup?: () => void;
		ref?: HTMLTextAreaElement | undefined;
	}
	let { value = $bindable(), placeholder = '', oninput, onkeydown, onselect, onpointerup, onkeyup, ref = $bindable() }: Props = $props();
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

<textarea class="textarea" bind:this={ref} bind:value {placeholder} {oninput} {onkeydown} {onselect} {onpointerup} {onkeyup} spellcheck="false"></textarea>
