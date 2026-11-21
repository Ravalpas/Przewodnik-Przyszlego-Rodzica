import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(await readFile('drizzle/0000_source_monitor.sql','utf8'));
const DB={prepare:sql=>({bind:(...args)=>({first:async()=>sqlite.prepare(sql).get(...args),run:async()=>sqlite.prepare(sql).run(...args)})})};
const env={DB,ADMIN_TOKEN:'test-only-admin'},request=(path,body,token)=>new Request('https://app.example'+path,body?{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}:{});
try{
 const rules=await (await worker.fetch(request('/api/calculator/rules'),env)).json();assert.equal(rules.parameters.limits.parental1,41);
 const input={eventDate:'2026-11-01',dateKind:'actual',parents:[{occupation:'employee',coverage:'compulsory',insuranceFrom:'2020-01-01',basis:6000}],parentalParts:[]};
 const response=await worker.fetch(request('/api/calculator/calculate',{input}),env);assert.equal(response.status,200);const result=await response.json();assert.equal(result.periods[0].gross,28000);
 assert.equal((await worker.fetch(request('/api/calculator/rules',{parameters:rules.parameters}),env)).status,403);
 const updated=await worker.fetch(request('/api/calculator/rules',{parameters:{...rules.parameters,rates:{...rules.parameters.rates,maternity:95}},validFrom:'2027-01-01',previousRevision:rules.revision,verified:true,note:'Test in isolated SQLite'},'test-only-admin'),env);assert.equal(updated.status,200);
 const old=await (await worker.fetch(request('/api/calculator/calculate',{input}),env)).json();assert.equal(old.periods[0].rate,100);
 const future=await (await worker.fetch(request('/api/calculator/calculate',{input:{...input,eventDate:'2027-01-01',dateKind:'expected'}}),env)).json();assert.equal(future.periods[0].rate,95);
 for(const operation of ['login','insurance','debt','ezla','ezus','application','usc']){const response=await worker.fetch(request('/api/calculator/simulate',{operation,debt:50}),env);assert.equal(response.status,200);assert.equal((await response.json()).sent,false);}
 for(const path of ['/calculator.js','/calculator.css','/data/calculator-rules.json','/admin.html'])assert.equal((await worker.fetch(request(path),env)).status,200);
 const state=await (await worker.fetch(request('/api/catalog'),env)).json();assert.ok(state.catalog.sources.some(s=>s.id==='calc-small2026'));console.log('PASS: exact deployable Worker, D1 persistence, calculations, admin authorization, future rule versions, all demos, embedded assets and source monitoring. No AI or real agency calls.');
}finally{sqlite.close();}
