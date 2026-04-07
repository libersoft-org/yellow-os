const METHODS: Record<string, (iframe: HTMLIFrameElement) => Promise<unknown>> = {
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

export function setupYappBridge(iframe: HTMLIFrameElement): () => void {
	function handleMessage(e: MessageEvent): void {
		if (e.source !== iframe.contentWindow) return;
		if (!isYosRequest(e.data)) return;
		const { id, method } = e.data;
		const handler = METHODS[method];
		if (!handler) {
			iframe.contentWindow!.postMessage({ type: 'yos:response', id, error: `Unknown method: ${method}` }, '*');
			return;
		}
		handler(iframe).then(
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
}
};
})()`;
	return `<script>${code}${'<'}/script>`;
}
