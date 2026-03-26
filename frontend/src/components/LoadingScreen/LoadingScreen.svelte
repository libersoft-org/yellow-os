<script lang="ts">
	import Spinner from '../Spinner/Spinner.svelte';
	import { PRODUCT_NAME, PRODUCT_VERSION } from '../../scripts/product.ts';
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

	.logo {
		width: 96px;
		height: 96px;
		background-color: var(--color-accent);
		mask-image: url('/img/logo.svg');
		mask-size: contain;
		mask-repeat: no-repeat;
		mask-position: center;
		-webkit-mask-image: url('/img/logo.svg');
		-webkit-mask-size: contain;
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
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
	<div class="logo"></div>
	<Spinner size="128px" />
</div>
