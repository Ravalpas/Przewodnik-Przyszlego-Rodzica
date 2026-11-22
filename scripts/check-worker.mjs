import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const env={DB:{prepare:()=>({bind:()=>({first:async()=>null,run:async()=>({})})})}},url='https://test-parent.example';
for(const path of ['/','/app.js','/responsive.css','/calculator.js','/document-session.js'])assert.equal((await worker.fetch(new Request(url+path),env)).status,200);
for(const path of ['/backend/.env','/.env','/server/index.js','/.openai/hosting.json','/chat.js'])assert.equal((await worker.fetch(new Request(url+path),env)).status,404);
assert.equal((await worker.fetch(new Request(url+'/api/chat/status'),env)).status,404);
assert.equal((await worker.fetch(new Request(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env)).status,404);
const catalog=await (await worker.fetch(new Request(url+'/api/catalog'),env)).json();assert.ok(catalog.catalog.events.length>0);
console.log('PASS: aplikacja i katalog działają; API czatu i prywatne pliki są niedostępne.');
