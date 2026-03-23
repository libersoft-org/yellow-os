<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes, MouseEventHandler } from 'svelte/elements';
	interface Props extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		enabled?: boolean | undefined;
		onclick?: MouseEventHandler<HTMLDivElement> | undefined;
		oncontextmenu?: MouseEventHandler<HTMLDivElement> | undefined;
	}
	let { children, enabled = true, onclick, oncontextmenu, class: className = '', ...restProps }: Props = $props();

	function handleClick(e: MouseEvent & { currentTarget: HTMLDivElement }): void {
		if (!enabled) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		onclick?.(e);
	}

	function handleRightClick(e: MouseEvent & { currentTarget: HTMLDivElement }): void {
		if (!enabled) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		oncontextmenu?.(e);
	}

	function handleKeyDown(e: KeyboardEvent): void {
		if (!enabled) return;
		if (e.key === 'Enter') (e.currentTarget as HTMLElement).click();
		if (e.key === ' ') e.preventDefault();
	}

	function handleKeyUp(e: KeyboardEvent): void {
		if (!enabled) return;
		if (e.key === ' ') (e.currentTarget as HTMLElement).click();
	}
</script>

<style>
	.clickable {
		cursor: pointer;
	}

	.clickable[aria-disabled='true'] {
		cursor: default;
		pointer-events: none;
	}

	.clickable:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: -2px;
	}
</style>

<div class="clickable {className}" role="button" tabindex={enabled ? 0 : -1} aria-disabled={!enabled || undefined} {...restProps} onclick={handleClick} oncontextmenu={handleRightClick} onkeydown={handleKeyDown} onkeyup={handleKeyUp}>
	{@render children?.()}
</div>
