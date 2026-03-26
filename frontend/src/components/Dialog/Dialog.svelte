<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import { closeWindow } from '../../scripts/window-store.svelte.ts';
	import { getTypeIcon, getTypeColorVariable } from '../../scripts/dialog.ts';
	import type { DialogType, DialogButton } from '../../scripts/dialog.ts';
	import Icon from '../../components/Icon/Icon.svelte';
	import Button from '../../components/Button/Button.svelte';
	interface Props {
		message: string;
		type?: DialogType;
		buttons?: DialogButton[];
	}
	const { message, type = 'info', buttons = [] }: Props = $props();
	const win = getWindow();
	const typeIcon = $derived(getTypeIcon(type));
	const typeColor = $derived(getTypeColorVariable(type));

	function handleButton(btn: DialogButton): void {
		if (btn.onclick) btn.onclick();
		closeWindow(win.id);
	}
</script>

<style>
	.dialog {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 16px;
		gap: 16px;
	}

	.content {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
	}

	.message {
		font-size: 14px;
		line-height: 1.4;
		color: var(--color-text);
		word-break: break-word;
	}

	.buttons {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
</style>

<div class="dialog">
	<div class="content">
		<Icon img={typeIcon} size="40px" padding="0" colorVariable={typeColor} />
		<span class="message">{message}</span>
	</div>
	<div class="buttons">
		{#each buttons as btn}
			<Button colorVariable={btn.colorVariable} backgroundColorVariable={btn.backgroundColorVariable} onclick={() => handleButton(btn)}>
				{btn.label}
			</Button>
		{/each}
	</div>
</div>
