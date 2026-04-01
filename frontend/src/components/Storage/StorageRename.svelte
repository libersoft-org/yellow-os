<script lang="ts">
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { closeWindow } from '../../scripts/window/window-store.svelte.ts';
	import Icon from '../Icon/Icon.svelte';
	import Button from '../Button/Button.svelte';
	import Input from '../Input/Input.svelte';
	interface Props {
		entryType: 'file' | 'directory';
		currentName: string;
		onrename: (newName: string) => void;
	}
	const { entryType, currentName, onrename }: Props = $props();
	const win = getWindow();
	let name = $state(initialName());
	let errorMessage = $state('');
	const icon = $derived(entryType === 'directory' ? '/img/directory.svg' : '/img/file.svg');

	function initialName(): string {
		return currentName;
	}

	function validate(value: string): boolean {
		if (!value.trim()) {
			errorMessage = 'Name cannot be empty.';
			return false;
		}
		if (value.includes('/') || value.includes('\\')) {
			errorMessage = 'Name cannot contain / or \\.';
			return false;
		}
		if (value.trim() === currentName) {
			errorMessage = 'Name is the same.';
			return false;
		}
		errorMessage = '';
		return true;
	}

	function handleConfirm(): void {
		if (!validate(name)) return;
		onrename(name.trim());
		closeWindow(win.id);
	}

	function handleCancel(): void {
		closeWindow(win.id);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') handleConfirm();
		if (e.key === 'Escape') handleCancel();
	}
</script>

<style>
	.dialog {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 16px;
		gap: 12px;
	}

	.content {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label {
		font-size: 14px;
		color: var(--color-text);
	}

	.error {
		font-size: 12px;
		color: var(--color-danger);
		min-height: 16px;
	}

	.buttons {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
</style>

<div class="dialog">
	<div class="content">
		<Icon img={icon} size="40px" padding="0" colorVariable="--color-accent" />
		<div class="fields">
			<span class="label">Rename {entryType}:</span>
			<Input bind:value={name} autofocus selectAll onkeydown={handleKeydown} />
			<span class="error">{errorMessage}</span>
		</div>
	</div>
	<div class="buttons">
		<Button backgroundColorVariable="--color-accent" colorVariable="--color-accent-fg" onclick={handleConfirm}>Rename</Button>
		<Button onclick={handleCancel}>Cancel</Button>
	</div>
</div>
