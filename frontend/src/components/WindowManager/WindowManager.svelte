<script lang="ts">
	import { windows } from '../../scripts/window.svelte';
	import Window from './Window.svelte';
</script>

{#each windows as win (win.id)}
	<Window {win} />
{/each}
