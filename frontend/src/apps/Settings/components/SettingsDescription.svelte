<script lang="ts">
	interface Props {
		text: string;
	}
	let { text }: Props = $props();
</script>

<style>
	.setting-title {
		font-size: 16px;
		padding-bottom: 10px;
		color: var(--color-text-dim);
	}
</style>

<div class="setting-title">{text}</div>
