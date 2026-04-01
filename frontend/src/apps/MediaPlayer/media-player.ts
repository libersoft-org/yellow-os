export const AUDIO_EXTENSIONS: ReadonlySet<string> = new Set(['mp3', 'wav', 'ogg', 'oga', 'flac', 'aac', 'm4a', 'opus', 'webm', 'weba']);
export const VIDEO_EXTENSIONS: ReadonlySet<string> = new Set(['mp4', 'm4v', 'webm', 'ogv', '3gp']);
export const MEDIA_EXTENSIONS: ReadonlySet<string> = new Set([...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS]);

function getExtension(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot >= 0 ? name.substring(dot + 1).toLowerCase() : '';
}

export function isMediaFile(name: string): boolean {
	return MEDIA_EXTENSIONS.has(getExtension(name));
}

export function isAudioFile(name: string): boolean {
	return AUDIO_EXTENSIONS.has(getExtension(name));
}

export function isVideoFile(name: string): boolean {
	return VIDEO_EXTENSIONS.has(getExtension(name));
}

export function getMediaType(name: string): 'audio' | 'video' {
	return isVideoFile(name) ? 'video' : 'audio';
}
