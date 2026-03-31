<script lang="ts">
	import { onMount } from 'svelte';
	import { getWindow } from '../../scripts/window/window-context.ts';
	import { closeWindow } from '../../scripts/window/window-store.svelte.ts';
	import Icon from '../Icon/Icon.svelte';
	import Button from '../Button/Button.svelte';
	import type { ConflictResolution } from '../../scripts/fs/file-conflict.ts';
	interface Props {
		fileName: string;
		remaining: number;
		onresolution: (resolution: ConflictResolution, applyToAll: boolean) => void;
	}
	const { fileName, remaining, onresolution }: Props = $props();
	const win = getWindow();
	const showApplyAll = $derived(remaining > 0);
	let buttonsEl: HTMLDivElement | undefined = $state();

	function resolve(resolution: ConflictResolution, applyToAll: boolean): void {
		onresolution(resolution, applyToAll);
		closeWindow(win.id);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			resolve('cancel', false);
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
	.conflict-dialog {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 16px;
		gap: 12px;
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

	.file-name {
		font-weight: bold;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 8px;
	}
</style>

<div class="conflict-dialog" role="dialog" tabindex="-1" onkeydown={handleKeydown}>
	<div class="content">
		<Icon img="/img/dialog/question.svg" size="40px" padding="0" colorVariable="--color-warning" />
		<span class="message">
			<span class="file-name">"{fileName}"</span> already exists in the destination.
			{#if remaining > 0}({remaining} more conflict{remaining > 1 ? 's' : ''} remaining){/if}
		</span>
	</div>
	<div class="buttons" bind:this={buttonsEl}>
		<Button onclick={() => resolve('replace', false)}>Replace</Button>
		{#if showApplyAll}
			<Button onclick={() => resolve('replace', true)}>Replace all</Button>
		{/if}
		<Button onclick={() => resolve('rename', false)}>Auto rename</Button>
		{#if showApplyAll}
			<Button onclick={() => resolve('rename', true)}>Auto rename all</Button>
		{/if}
		<Button onclick={() => resolve('skip', false)}>Skip</Button>
		{#if showApplyAll}
			<Button onclick={() => resolve('skip', true)}>Skip all</Button>
		{/if}
		<Button onclick={() => resolve('cancel', false)}>Cancel</Button>
	</div>
</div>
