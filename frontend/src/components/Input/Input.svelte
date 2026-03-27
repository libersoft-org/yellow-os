<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		oninput?: (value: string) => void;
		onkeydown?: (e: KeyboardEvent) => void;
		autofocus?: boolean;
		selectAll?: boolean;
	}
	let { value = $bindable(''), placeholder, oninput, onkeydown, autofocus = false, selectAll = false }: Props = $props();

	function handleInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		value = target.value;
		if (oninput) oninput(value);
	}

	function initInput(node: HTMLInputElement): void {
		if (autofocus) node.focus();
		if (selectAll && value) node.select();
	}
</script>

<style>
	input {
		width: 100%;
		box-sizing: border-box;
		padding: 6px 10px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 14px;
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}

	input:focus {
		border-color: var(--color-accent);
	}

	input::placeholder {
		color: var(--color-text-dim);
	}
</style>

<input type="text" {value} {placeholder} oninput={handleInput} {onkeydown} use:initInput />
