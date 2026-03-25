import type { Component } from 'svelte';
import About from '../apps/About/About.svelte';
import Calculator from '../apps/Calculator/Calculator.svelte';
import FileBrowser from '../apps/FileBrowser/FileBrowser.svelte';
import Notepad from '../apps/Notepad/Notepad.svelte';
import Pong from '../apps/Pong/Pong.svelte';
import Snake from '../apps/Snake/Snake.svelte';

const registry: Record<string, Component> = {
	about: About,
	calculator: Calculator,
	'file-browser': FileBrowser,
	notepad: Notepad,
	pong: Pong,
	snake: Snake,
};

export function getAppComponent(id: string): Component | undefined {
	return registry[id];
}

export function getAppIds(): string[] {
	return Object.keys(registry);
}
