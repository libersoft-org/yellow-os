<script lang="ts">
	import Icon from '../Icon/Icon.svelte';
	import Spinner from '../Spinner/Spinner.svelte';
	import { PRODUCT_NAME, PRODUCT_VERSION } from '../../scripts/system/product.ts';
</script>

<style>
	.loading-screen {
		z-index: 3000;
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		gap: 24px;
		background: #000;
	}

	.name {
		font-size: 48px;
		font-weight: bold;
		color: var(--color-accent);
		letter-spacing: 1px;
	}

	.version {
		font-size: 28px;
		font-weight: bold;
		color: var(--color-text-dim);
	}
</style>

<div class="loading-screen">
	<div class="name">{PRODUCT_NAME}</div>
	<div class="version">v{PRODUCT_VERSION}</div>
	<Icon img="/img/logo.svg" alt={PRODUCT_NAME} size="96px" padding="0" colorVariable="--color-accent" />
	<Spinner size="128px" />
</div>
