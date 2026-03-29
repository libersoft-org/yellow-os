<script lang="ts">
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { closeWindow } from '../../scripts/window/window-store.svelte.ts';
	import Icon from '../../components/Icon/Icon.svelte';
	import Button from '../../components/Button/Button.svelte';
	import Input from '../../components/Input/Input.svelte';
	interface Props {
		entryType: 'file' | 'directory';
		oncreate: (name: string) => void;
	}
	const { entryType, oncreate }: Props = $props();
	const win = getWindow();
	let name = $state(initialName());
	let errorMessage = $state('');
	const icon = $derived(entryType === 'directory' ? '/img/directory.svg' : '/img/file.svg');

	function initialName(): string {
		return entryType === 'file' ? 'New file.txt' : 'New directory';
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
		errorMessage = '';
		return true;
	}

	function handleConfirm(): void {
		if (!validate(name)) return;
		oncreate(name.trim());
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
			<span class="label">Enter name for new {entryType}:</span>
			<Input bind:value={name} autofocus selectAll onkeydown={handleKeydown} />
			<span class="error">{errorMessage}</span>
		</div>
	</div>
	<div class="buttons">
		<Button onclick={handleCancel}>Cancel</Button>
		<Button backgroundColorVariable="--color-accent" colorVariable="--color-accent-fg" onclick={handleConfirm}>Create</Button>
	</div>
</div>
