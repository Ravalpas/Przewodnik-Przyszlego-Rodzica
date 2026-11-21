import { publicMonitorState,publicCalculatorRules } from './monitor.mjs';
import {BielikError} from './fabryka.mjs';
import {calculateIntegrated} from '../dist/calculator-engine.js';
import {calculatorSimulation} from './calculator-simulations.mjs';
import {warsawDay} from './monitor.mjs';
async function chatBody(request) {
  const reader=request.body?.getReader();if(!reader)throw new BielikError('Wymagane jest pytanie.',400,'invalid_body');
  const chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>40000)throw new BielikError('Zapytanie jest zbyt duże.',413,'body_too_large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new BielikError('Nieprawidłowe dane pytania.',400,'invalid_json');}
}
export async function handleApi(request,monitor,{adminToken,bielik,clientKey}={}) {
  const url=new URL(request.url),path=url.pathname;
  const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if(request.method==='GET'&&path==='/api/catalog')return json(publicMonitorState(await monitor.read()));
  if(request.method==='GET'&&path==='/api/health')return json({ok:true,timezone:'Europe/Warsaw',nextCheckAt:(await monitor.read()).nextCheckAt});
  if(request.method==='GET'&&path==='/api/chat/status')return json(bielik?.status()||{available:false});
  if(path==='/api/calculator/rules'){
    if(request.method==='GET')return json(publicCalculatorRules(await monitor.read()));
    if(!adminToken||request.headers.get('Authorization')!==`Bearer ${adminToken}`)return json({error:'Brak uprawnienia do zmiany zasad.'},403);
  }
  if(path==='/api/review'&&(!adminToken||request.headers.get('Authorization')!==`Bearer ${adminToken}`))return json({error:'Brak uprawnienia do przeglądu źródeł.'},403);
  if(request.method==='GET'&&path==='/api/review'){
    const state=await monitor.read();return json({sources:state.catalog.sources.map(source=>({...source,...state.sources[source.id]})),events:state.catalog.events});
  }
  if(request.method!=='POST')return json({error:'Nie znaleziono operacji.'},404);
  const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Niedozwolone pochodzenie żądania.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Wymagany JSON.'},415);
  if(path==='/api/chat') {
    try {
      if(!bielik)throw new BielikError('Czat nie jest jeszcze skonfigurowany na serwerze.',503,'not_configured');
      return json(await bielik.answer(await chatBody(request),{client:clientKey,signal:request.signal}));
    } catch(error) {
      const known=error instanceof BielikError;
      return Response.json({error:known?error.message:'Nie udało się przygotować odpowiedzi. Spróbuj ponownie.',code:known?error.code:'chat_error'},{status:known?error.status:500,headers:{'Cache-Control':'no-store',...(known&&error.retryAfter?{'Retry-After':String(error.retryAfter)}:{})}});
    }
  }
  try {
    if(path.startsWith('/api/calculator/')){
      const text=await request.text();if(text.length>150000)return json({error:'Za dużo danych kalkulatora.'},413);
      let body;try{body=JSON.parse(text);}catch{return json({error:'Nieprawidłowy JSON.'},400);}
      if(path==='/api/calculator/calculate'){try{return json(calculateIntegrated(body.input,publicCalculatorRules(await monitor.read()),warsawDay(),{history:body.history||[]}));}catch(error){return json({error:error.message,field:error.field||''},400);}}
      if(path==='/api/calculator/rules')return json(await monitor.updateCalculator(body));
      if(path==='/api/calculator/simulate')return json(calculatorSimulation(body,warsawDay()));
    }
    if(path==='/api/refresh'){const body=await request.json();if(body.scope!==undefined&&!['zus','all'].includes(body.scope))return json({error:'Wybierz zakres źródeł.'},400);return json(publicMonitorState(await monitor.refresh('manual',body.scope)));}
    if(path==='/api/scheduled-refresh')return json(publicMonitorState(await monitor.refresh('scheduled')));
    if(path==='/api/review'){
      const body=await request.text();if(body.length>50000)return json({error:'Za dużo danych.'},413);
      return json(await monitor.review(JSON.parse(body)));
    }
    return json({error:'Nie znaleziono operacji.'},404);
  }catch(error){return json({error:error.message},409);}
}
