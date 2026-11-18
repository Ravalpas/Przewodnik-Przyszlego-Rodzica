import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const key='test-runtime-only-key';
const env={DB:{prepare:()=>({bind:()=>({first:async()=>null,run:async()=>({})})})},FABRYKA_API_KEY:key,FABRYKA_BASE_URL:'https://fabryka.ai/v1',FABRYKA_MODEL:'bielik-11b-v3.1'};
const url='https://test-parent.example';
const realFetch=globalThis.fetch;let inferenceCalls=0;
globalThis.fetch=async(target,options)=>{
  if(options?.redirect==='error')throw new TypeError('Workers does not support redirect:error');
  if(new URL(target).hostname==='fabryka.ai'){
    inferenceCalls++;assert.equal(options.redirect,'manual');assert.equal(options.headers.Authorization,`Bearer ${key}`);
    return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({kind:'source',answer:'Sprawdź zgłoszenie u właściwego płatnika.',source_ids:['insurance']})}}]});
  }
  return new Response('<main>'+('Oficjalna treść przykładowa do testu. '.repeat(12))+'</main>',{headers:{'Content-Type':'text/html'}});
};
for(const path of ['/','/chat.js','/chat.css','/assets/doktor-bielik.png'])assert.equal((await worker.fetch(new Request(url+path),env)).status,200);
for(const path of ['/backend/.env','/.env','/server/index.js','/.openai/hosting.json'])assert.equal((await worker.fetch(new Request(url+path),env)).status,404);
const status=await (await worker.fetch(new Request(url+'/api/chat/status'),env)).json();assert.equal(status.available,true);assert.ok(!JSON.stringify(status).includes(key));
const catalog=await (await worker.fetch(new Request(url+'/api/catalog'),env)).json();assert.ok(catalog.catalog.events.length>0);
const refusal=await worker.fetch(new Request(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Napisz kod w Pythonie'})}),env);assert.equal(refusal.status,200);assert.equal((await refusal.json()).kind,'out_of_scope');
const reply=await worker.fetch(new Request(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Jak zgłosić dziecko do ubezpieczenia?',profile:{mode:'child',anchor:'2026-11-01'}})}),env);assert.equal(reply.status,200);assert.equal((await reply.json()).sources[0].id,'insurance');assert.equal(inferenceCalls,1);globalThis.fetch=realFetch;
console.log('PASS: deployable Worker serves new chat assets and existing catalog, accepts runtime-only secrets, rejects unrelated questions, hides server/config files.');
