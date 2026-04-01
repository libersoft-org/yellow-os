export interface PrintOptions {
	title?: string;
}

export function printText(text: string, options?: PrintOptions): void {
	const iframe = document.createElement('iframe');
	iframe.style.position = 'fixed';
	iframe.style.left = '-9999px';
	iframe.style.width = '0';
	iframe.style.height = '0';
	document.body.appendChild(iframe);
	const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
	if (!doc) {
		iframe.remove();
		return;
	}
	doc.open();
	const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const title = options?.title ?? 'Print';
	doc.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:monospace;white-space:pre-wrap;font-size:12pt;margin:20mm;}</style></head><body>${escaped}</body></html>`);
	doc.close();
	iframe.contentWindow?.focus();
	iframe.contentWindow?.print();
	setTimeout(() => iframe.remove(), 1000);
}

export function printImage(src: string, options?: PrintOptions): void {
	const iframe = document.createElement('iframe');
	iframe.style.position = 'fixed';
	iframe.style.left = '-9999px';
	iframe.style.width = '0';
	iframe.style.height = '0';
	document.body.appendChild(iframe);
	const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
	if (!doc) {
		iframe.remove();
		return;
	}
	doc.open();
	const title = options?.title ?? 'Print';
	doc.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;}img{max-width:100%;max-height:100vh;object-fit:contain;}</style></head><body><img src="${src}" /></body></html>`);
	doc.close();
	iframe.contentWindow?.focus();
	iframe.contentWindow?.print();
	setTimeout(() => iframe.remove(), 1000);
}
