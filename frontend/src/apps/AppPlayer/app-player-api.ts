import type { WindowState } from '../../scripts/window/window-store.svelte.ts';
import { closeWindow, minimizeWindow, toggleMaximize, restoreWindow, resizeWindow, focusWindow } from '../../scripts/window/window-store.svelte.ts';
import { addNotification } from '../../scripts/ui/notifications.svelte.ts';
type MethodHandler = (iframe: HTMLIFrameElement, win: WindowState, params: Record<string, unknown>) => Promise<unknown>;
const METHODS: Record<string, MethodHandler> = {
	'cursor.lock': async iframe => {
		await iframe.requestPointerLock();
		return true;
	},
	'cursor.unlock': async () => {
		document.exitPointerLock();
		return true;
	},
	'cursor.hide': async iframe => {
		iframe.style.cursor = 'none';
		return true;
	},
	'cursor.show': async iframe => {
		iframe.style.cursor = '';
		return true;
	},
	'window.maximize': async (_iframe, win) => {
		toggleMaximize(win.id);
		return true;
	},
	'window.minimize': async (_iframe, win) => {
		minimizeWindow(win.id);
		return true;
	},
	'window.restore': async (_iframe, win) => {
		restoreWindow(win.id);
		return true;
	},
	'window.setFrameless': async (_iframe, win, params) => {
		win.frameless = !!params['value'];
		return true;
	},
	'window.setTitle': async (_iframe, win, params) => {
		win.title = String(params['value'] ?? '');
		return true;
	},
	'window.setIcon': async (_iframe, win, params) => {
		win.icon = String(params['value'] ?? '');
		return true;
	},
	'window.setSize': async (_iframe, win, params) => {
		const w = Number(params['width']);
		const h = Number(params['height']);
		if (!Number.isFinite(w) || !Number.isFinite(h)) throw new Error('Invalid size');
		resizeWindow(win.id, w, h);
		return true;
	},
	'window.getSize': async (_iframe, win) => {
		return { width: win.width, height: win.height };
	},
	'window.getState': async (_iframe, win) => {
		if (win.fullscreen) return 'fullscreen';
		if (win.maximized) return 'maximized';
		if (win.minimized || win.minimizing) return 'minimized';
		return 'normal';
	},
	'window.close': async (_iframe, win) => {
		closeWindow(win.id);
		return true;
	},
	'window.focus': async (_iframe, win) => {
		focusWindow(win.id);
		return true;
	},
	'window.fullscreen': async (_iframe, win) => {
		win.state = 'fullscreen';
		return true;
	},
	'notification.show': async (_iframe, _win, params) => {
		const data: { title: string; description?: string } = {
			title: String(params['title'] ?? ''),
		};
		if (params['body']) data.description = String(params['body']);
		addNotification(data);
		return true;
	},
};

interface YosRequest {
	type: 'yos:request';
	id: string;
	method: string;
	params?: unknown;
}

function isYosRequest(data: unknown): data is YosRequest {
	if (typeof data !== 'object' || data === null) return false;
	const obj = data as Record<string, unknown>;
	return obj['type'] === 'yos:request' && typeof obj['id'] === 'string' && typeof obj['method'] === 'string';
}

export function setupYappBridge(iframe: HTMLIFrameElement, win: WindowState): () => void {
	function handleMessage(e: MessageEvent): void {
		if (e.source !== iframe.contentWindow) return;
		if (!isYosRequest(e.data)) return;
		const { id, method, params } = e.data;
		const handler = METHODS[method];
		if (!handler) {
			iframe.contentWindow!.postMessage({ type: 'yos:response', id, error: `Unknown method: ${method}` }, '*');
			return;
		}
		handler(iframe, win, (params ?? {}) as Record<string, unknown>).then(
			result => iframe.contentWindow?.postMessage({ type: 'yos:response', id, result }, '*'),
			err => iframe.contentWindow?.postMessage({ type: 'yos:response', id, error: err instanceof Error ? err.message : String(err) }, '*')
		);
	}

	window.addEventListener('message', handleMessage);

	return function cleanup(): void {
		window.removeEventListener('message', handleMessage);
		iframe.style.cursor = '';
		if (document.pointerLockElement === iframe) document.exitPointerLock();
	};
}

export function buildClientApiScript(): string {
	const code = `(function(){
var _id=0;
var _cbs={};
window.addEventListener('message',function(e){
if(!e.data||e.data.type!=='yos:response')return;
var cb=_cbs[e.data.id];
if(!cb)return;
delete _cbs[e.data.id];
if(e.data.error)cb[1](new Error(e.data.error));
else cb[0](e.data.result);
});
function call(m,p){
return new Promise(function(ok,fail){
var id=String(++_id);
_cbs[id]=[ok,fail];
window.parent.postMessage({type:'yos:request',id:id,method:m,params:p||{}},'*');
});
}
window.os={
cursor:{
lock:function(){return call('cursor.lock');},
unlock:function(){return call('cursor.unlock');},
hide:function(){return call('cursor.hide');},
show:function(){return call('cursor.show');}
},
window:{
maximize:function(){return call('window.maximize');},
minimize:function(){return call('window.minimize');},
restore:function(){return call('window.restore');},
setFrameless:function(v){return call('window.setFrameless',{value:v});},
setTitle:function(v){return call('window.setTitle',{value:v});},
setIcon:function(v){return call('window.setIcon',{value:v});},
setSize:function(w,h){return call('window.setSize',{width:w,height:h});},
getSize:function(){return call('window.getSize');},
getState:function(){return call('window.getState');},
close:function(){return call('window.close');},
focus:function(){return call('window.focus');},
fullscreen:function(){return call('window.fullscreen');}
},
notification:{
show:function(t,b){return call('notification.show',{title:t,body:b});}
}
};
})()`;
	return `<script>${code}${'<'}/script>`;
}
