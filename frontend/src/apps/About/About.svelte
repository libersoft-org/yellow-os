<script lang="ts">
	import { PRODUCT_NAME, PRODUCT_VERSION, COMMIT_HASH, BUILD_DATE } from '../../scripts/product';
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
		display: flex;
		gap: 6px;
		color: var(--color-text);
		font-size: 18px;
		font-weight: bold;
	}

	.version .value {
		color: var(--color-accent);
	}

	.description {
		color: var(--color-text-dim);
	}
</style>

<div class="about">
	<div class="title">Welcome to {PRODUCT_NAME}</div>
	<div class="description">An open source web-based operating system.</div>
	<Icon img="/img/logo.svg" alt={PRODUCT_NAME} size="64px" colorVariable="--color-accent" />
	<div class="version">
		<div>Version:</div>
		<div class="value">{PRODUCT_VERSION}</div>
	</div>
	<div class="version">
		<div>Commit:</div>
		<div class="value">{COMMIT_HASH}</div>
	</div>
	<div class="version">
		<div>Build:</div>
		<div class="value">{BUILD_DATE}</div>
	</div>
</div>
