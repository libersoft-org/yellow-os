import { hexToCSSFilter } from 'hex-to-css-filter';

export function getColorFromCSSToFilter(name: string): string {
	if (!name.startsWith('--')) throw new Error('getColorFromCSSToFilter: name must start with --');
	let v = getColorFromCSS(name);
	if (!v) return 'none';
	v = convertFromShortHex(v);
	return hexToCSSFilter(v).filter;
}

export function convertFromShortHex(v: string): string {
	if (v.length === 4) {
		const r = v[1] ?? '0';
		const g = v[2] ?? '0';
		const b = v[3] ?? '0';
		v = `#${r}${r}${g}${g}${b}${b}`;
	}
	return v;
}

export function getColorFromCSS(name: string): string {
	if (typeof window === 'undefined') return '';
	return getComputedStyle(document.documentElement).getPropertyValue(name);
}
