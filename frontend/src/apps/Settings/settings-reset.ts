import { showDialog } from '../../scripts/ui/dialog.ts';
import { startFactoryReset } from '../../scripts/system/factory-reset.svelte.ts';

export function confirmFactoryReset(): void {
	showDialog({
		title: 'Factory reset',
		message: 'Are you sure you want to reset the system? All data including files, settings and cache will be permanently erased.',
		type: 'warning',
		buttons: [
			{
				label: 'Yes',
				onclick: () => {
					startFactoryReset();
				},
				backgroundColorVariable: '--color-accent',
				colorVariable: '--color-accent-fg',
			},
			{
				label: 'No',
			},
		],
	});
}
