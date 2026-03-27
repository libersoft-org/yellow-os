<script lang="ts">
	import Icon from '../Icon/Icon.svelte';
	interface Props {
		icon: string;
		label: string;
		subtitle?: string;
		layout?: 'vertical' | 'horizontal';
		iconSize?: string;
		iconColor?: string | undefined;
		color?: string | undefined;
	}
	const { icon, label, subtitle, layout = 'vertical', iconSize = '40px', iconColor, color }: Props = $props();
</script>

<style>
	.icon-item {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
	}

	.icon-item.vertical {
		flex-direction: column;
		text-align: center;
	}

	.icon-item.horizontal {
		flex-direction: row;
		gap: 8px;
	}

	.text {
		min-width: 0;
		overflow: hidden;
	}

	.label {
		font-size: 12px;
		line-height: 1.3;
	}

	.vertical .label {
		word-break: break-word;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	.horizontal .label {
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.subtitle {
		font-size: 11px;
		color: inherit;
		opacity: 0.7;
	}
</style>

<div class="icon-item" class:vertical={layout === 'vertical'} class:horizontal={layout === 'horizontal'} style:color>
	<Icon img={icon} alt={label} size={iconSize} padding="0" colorVariable={iconColor} />
	<div class="text">
		<div class="label">{label}</div>
		{#if subtitle}
			<div class="subtitle">{subtitle}</div>
		{/if}
	</div>
</div>
