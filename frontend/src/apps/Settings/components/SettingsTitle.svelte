<script lang="ts">
	interface Props {
		label: string;
	}
	let { label }: Props = $props();
</script>

<style>
	.setting-title {
		font-size: 18px;
		font-weight: bold;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
	}
</style>

<div class="setting-title">{label}</div>
