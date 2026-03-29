<script lang="ts">
	import { onMount } from 'svelte';
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { closeWindow } from '../../scripts/window/window-store.svelte.ts';
	import { getTypeIcon, getTypeColorVariable } from '../../scripts/ui/dialog.ts';
	import type { DialogType, DialogButton } from '../../scripts/ui/dialog.ts';
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
	let buttonsEl: HTMLDivElement | undefined = $state();

	function handleButton(btn: DialogButton): void {
		if (btn.onclick) btn.onclick();
		closeWindow(win.id);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeWindow(win.id);
			return;
		}
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		if (!buttonsEl) return;
		const focusable = [...buttonsEl.querySelectorAll<HTMLElement>('[role="button"]')];
		if (focusable.length === 0) return;
		const current = focusable.indexOf(document.activeElement as HTMLElement);
		if (current === -1) return;
		e.preventDefault();
		const next = e.key === 'ArrowRight' ? (current + 1) % focusable.length : (current - 1 + focusable.length) % focusable.length;
		focusable[next]!.focus();
	}

	onMount(() => {
		const first = buttonsEl?.querySelector<HTMLElement>('[role="button"]');
		if (first) first.focus();
	});
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

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="dialog" role="application" onkeydown={handleKeydown}>
	<div class="content">
		<Icon img={typeIcon} size="40px" padding="0" colorVariable={typeColor} />
		<span class="message">{message}</span>
	</div>
	<div class="buttons" bind:this={buttonsEl}>
		{#each buttons as btn}
			<Button colorVariable={btn.colorVariable} backgroundColorVariable={btn.backgroundColorVariable} onclick={() => handleButton(btn)}>
				{btn.label}
			</Button>
		{/each}
	</div>
</div>
