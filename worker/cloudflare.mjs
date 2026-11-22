import catalog from '../dist/data/catalog.json';
import calculatorRules from '../dist/data/calculator-rules.json';
import {createMonitor} from '../backend/monitor.mjs';
import {handleApi} from '../backend/api.mjs';
import {d1Store} from '../backend/d1-store.mjs';
let monitor;
async function getMonitor(env){
 if(!env.DB)throw new Error('Missing DB binding');
 if(!monitor){
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS ppm_monitor (id TEXT PRIMARY KEY, payload TEXT NOT NULL)').run();
  monitor=createMonitor({catalog,calculatorRules,store:d1Store(env.DB)});
 }
 return monitor;
}
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
  try{return await handleApi(request,await getMonitor(env),{adminToken:env.ADMIN_TOKEN});}
  catch{return Response.json({error:'Usługa chwilowo niedostępna.'},{status:503});}
 },
 async scheduled(event,env,ctx){
  const hour=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',hour:'2-digit',hourCycle:'h23'}).format(new Date(event.scheduledTime));
  if(hour==='00')ctx.waitUntil(getMonitor(env).then(m=>m.refresh('scheduled')));
 }
};
