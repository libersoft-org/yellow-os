<script lang="ts">
	import { onMount } from 'svelte';
	import Desktop from '../components/Desktop/Desktop.svelte';
	import { openWindow } from '../scripts/window.svelte';
	import Welcome from '../apps/Welcome/Welcome.svelte';

	onMount(() => {
		openWindow({
			title: 'Welcome',
			icon: '/img/apps/welcome.svg',
			component: Welcome,
			width: 480,
			height: 340,
			x: 200,
			y: 120,
		});
	});
</script>

<Desktop />
