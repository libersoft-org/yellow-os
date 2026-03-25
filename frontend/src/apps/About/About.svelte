<script lang="ts">
	import { PRODUCT_NAME, PRODUCT_VERSION, PRODUCT_URL, GITHUB_URL, COMMIT_HASH, BUILD_DATE } from '../../scripts/product.ts';
	import { getWindow } from '../../scripts/window-context.ts';
	import Icon from '../../components/Icon/Icon.svelte';
	const win = getWindow();
	win.title = `About ${PRODUCT_NAME}`;
	win.icon = '/img/logo.svg';
	win.width = 512;
	win.height = 380;
	win.position = 'center';
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

	.version,
	.link {
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

	.link a {
		color: var(--color-accent);
		text-decoration: none;
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
	<div class="link">
		<div>Official website:</div>
		<div><a href={PRODUCT_URL} target="_blank">{PRODUCT_URL}</a></div>
	</div>
	<div class="link">
		<div>GitHub:</div>
		<div><a href={GITHUB_URL} target="_blank">{GITHUB_URL}</a></div>
	</div>
</div>
