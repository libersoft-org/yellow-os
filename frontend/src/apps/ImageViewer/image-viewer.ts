import { getExtension } from '../../scripts/fs/file-entry.ts';
export const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'jpe', 'jfif', 'gif', 'webp', 'avif', 'apng', 'svg', 'bmp', 'ico', 'cur']);
const MIME_MAP: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	jpe: 'image/jpeg',
	jfif: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',
	apng: 'image/apng',
	bmp: 'image/bmp',
	svg: 'image/svg+xml',
	ico: 'image/x-icon',
	cur: 'image/x-icon',
};

export function isImageFile(name: string): boolean {
	return IMAGE_EXTENSIONS.has(getExtension(name));
}

export function getMimeType(name: string): string {
	return MIME_MAP[getExtension(name)] ?? 'image/png';
}

export function clamp(v: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, v));
}

export interface CropRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = (): void => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

export async function renderCroppedImage(src: string, crop: CropRect, mimeType: string): Promise<Blob | null> {
	const img = await loadImageElement(src);
	const canvas = document.createElement('canvas');
	canvas.width = crop.w;
	canvas.height = crop.h;
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
	return new Promise(resolve => canvas.toBlob(resolve, mimeType));
}

export async function renderTransformedImage(src: string, width: number, height: number, rotation: number, flipH: boolean, flipV: boolean, mimeType: string): Promise<Blob | null> {
	const img = await loadImageElement(src);
	const swapped = rotation === 90 || rotation === 270;
	const outW = swapped ? height : width;
	const outH = swapped ? width : height;
	const canvas = document.createElement('canvas');
	canvas.width = outW;
	canvas.height = outH;
	const ctx = canvas.getContext('2d')!;
	ctx.translate(outW / 2, outH / 2);
	ctx.rotate((rotation * Math.PI) / 180);
	ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
	ctx.drawImage(img, -width / 2, -height / 2);
	return new Promise(resolve => canvas.toBlob(resolve, mimeType));
}
