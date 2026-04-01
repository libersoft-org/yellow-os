import type { Component } from 'svelte';
import About from '../../apps/About/About.svelte';
import AppPlayer from '../../apps/AppPlayer/AppPlayer.svelte';
import Calculator from '../../apps/Calculator/Calculator.svelte';
import FileBrowser from '../../apps/FileBrowser/FileBrowser.svelte';
import TextEditor from '../../apps/TextEditor/TextEditor.svelte';
import Pong from '../../apps/Pong/Pong.svelte';
import Snake from '../../apps/Snake/Snake.svelte';
import Settings from '../../apps/Settings/Settings.svelte';
import ImageViewer from '../../apps/ImageViewer/ImageViewer.svelte';
import MediaPlayer from '../../apps/MediaPlayer/MediaPlayer.svelte';

const registry: Record<string, Component> = {
	about: About,
	'app-player': AppPlayer,
	calculator: Calculator,
	'file-browser': FileBrowser,
	'image-viewer': ImageViewer,
	'media-player': MediaPlayer,
	'text-editor': TextEditor,
	pong: Pong,
	snake: Snake,
	settings: Settings,
};

export function getAppComponent(id: string): Component | undefined {
	return registry[id];
}

export function getAppIds(): string[] {
	return Object.keys(registry);
}
