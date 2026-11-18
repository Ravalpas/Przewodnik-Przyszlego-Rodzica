// A real, opt-in test. Only fictitious profile dates and statuses are sent.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadBackendEnvironment} from '../backend/environment.mjs';
import {createBielik} from '../backend/bielik.mjs';

loadBackendEnvironment();
const catalog=JSON.parse(await readFile(new URL('../dist/data/catalog.json',import.meta.url),'utf8'));
const diagnosticFetch=async(...args)=>{
  const response=await fetch(...args);
  if(!response.ok){let data;try{data=await response.clone().json();}catch{}console.error(JSON.stringify({upstreamStatus:response.status,detail:JSON.stringify(data?.error||data?.detail||'').split(process.env.FABRYKA_API_KEY).join('[ukryto]').slice(0,400)}));}
  else {
    const reply=await response.clone().json(),choice=reply.choices?.[0];let parsed;
    try{parsed=JSON.parse(choice?.message?.content);}catch{}
    if(!parsed?.kind||choice?.finish_reason==='length')console.error(JSON.stringify({diagnostic:'Niekompletna struktura testowej odpowiedzi',finish:choice?.finish_reason,content:String(choice?.message?.content||'').split(process.env.FABRYKA_API_KEY).join('[ukryto]').slice(0,600)}));
  }
  return response;
};
const service=createBielik({env:process.env,fetcher:diagnosticFetch,monitor:{read:async()=>({catalog,sources:{}})}});
try {
  const reply=await service.answer({message:'Zgłoszenie urodzenia w USC jest już oznaczone jako wykonane. Co jeszcze trzeba zrobić z ubezpieczeniem zdrowotnym dziecka, gdzie to załatwić i od jakiego zdarzenia liczy się termin? Nie przypominaj USC jako zaległego.',profile:{mode:'child',anchor:'2026-11-01',dates:{birthCardDate:'2026-11-02',peselDate:'2026-11-15'},completedTasks:['usc'],notApplicableTasks:['krus-benefit']}});
  assert.ok(reply.answer?.length>30);assert.equal(reply.kind,'source');assert.ok(reply.sources.some(s=>s.id==='insurance'));assert.ok(!/przez\s+Pacjent\.gov\.pl/i.test(reply.answer));
  console.log(JSON.stringify({test:'Rzeczywiste wywołanie Fabryka AI',model:reply.model,kind:reply.kind,context:reply.context,answer:reply.answer,sources:reply.sources.map(s=>({id:s.id,url:s.url,status:s.status}))},null,2));
  const outside=await service.answer({message:'Jakie filmy science fiction polecasz na weekend?',profile:{mode:'child',anchor:'2026-11-01'}});
  assert.equal(outside.kind,'out_of_scope');console.log('PASS: odmowa pytania spoza zakresu.');
}catch(error){console.error(JSON.stringify({test:'Fabryka AI',status:'failed',code:error.code||'test_failed',message:error.code?error.message:'Odpowiedź nie spełniła wymagań testu.'}));process.exitCode=1;}
