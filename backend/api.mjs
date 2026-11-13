import { publicMonitorState } from './monitor.mjs';
export async function handleApi(request,monitor,{adminToken}={}) {
  const url=new URL(request.url),path=url.pathname;
  const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if(request.method==='GET'&&path==='/api/catalog')return json(publicMonitorState(await monitor.read()));
  if(request.method==='GET'&&path==='/api/health')return json({ok:true,timezone:'Europe/Warsaw',nextCheckAt:(await monitor.read()).nextCheckAt});
  if(path==='/api/review'&&adminToken&&request.headers.get('Authorization')!==`Bearer ${adminToken}`)return json({error:'Brak uprawnienia do przeglądu źródeł.'},403);
  if(request.method==='GET'&&path==='/api/review'){
    const state=await monitor.read();return json({sources:state.catalog.sources.map(source=>({...source,...state.sources[source.id]})),events:state.catalog.events});
  }
  if(request.method!=='POST')return json({error:'Nie znaleziono operacji.'},404);
  const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Niedozwolone pochodzenie żądania.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Wymagany JSON.'},415);
  try {
    if(path==='/api/refresh')return json(publicMonitorState(await monitor.refresh('manual')));
    if(path==='/api/scheduled-refresh')return json(publicMonitorState(await monitor.refresh('scheduled')));
    if(path==='/api/review'){
      const body=await request.text();if(body.length>50000)return json({error:'Za dużo danych.'},413);
      return json(await monitor.review(JSON.parse(body)));
    }
    return json({error:'Nie znaleziono operacji.'},404);
  }catch(error){return json({error:error.message},409);}
}
