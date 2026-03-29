<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';
	import { browser } from '$app/environment';
	import { ensureOpfsReady } from '../scripts/fs/opfs-init.ts';
	interface Props {
		children: Snippet;
	}
	let { children }: Props = $props();

	if (browser) ensureOpfsReady();
</script>

{@render children()}
