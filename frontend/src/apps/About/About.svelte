<script lang="ts">
	import { PRODUCT_NAME, PRODUCT_VERSION } from '../../scripts/product';
	import Icon from '../../components/Icon/Icon.svelte';
</script>

<style>
	.about {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		height: 100%;
		text-align: center;
	}

	.title {
		color: var(--color-accent);
		font-size: 22px;
		margin-bottom: 4px;
		font-weight: bold;
	}

	.version {
		color: var(--color-text);
		font-size: 18px;
		font-weight: bold;
	}

	.description {
		color: var(--color-text-dim);
	}
</style>

<div class="about">
 	<div class="title">Welcome to {PRODUCT_NAME}</div>
		<Icon img="/img/logo.svg" alt={PRODUCT_NAME} size="64px" colorVariable="--color-accent" />
	<div class="version">Version: {PRODUCT_VERSION}</div>
	<div class="description">A web-based desktop operating system built from scratch.</div>
</div>
