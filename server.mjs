import http from 'node:http';
import { readFile,writeFile,mkdir,rename } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { createMonitor,warsawDay,nextMidnight } from './backend/monitor.mjs';
import { handleApi } from './backend/api.mjs';
import {loadBackendEnvironment} from './backend/environment.mjs';
import {createBielik} from './backend/bielik.mjs';
loadBackendEnvironment();
const root=resolve(import.meta.dirname,'dist'),dataDir=resolve(process.env.DATA_DIR||resolve(import.meta.dirname,'.data'));
const catalog=JSON.parse(await readFile(resolve(root,'data/catalog.json'),'utf8'));
const calculatorRules=JSON.parse(await readFile(resolve(root,'data/calculator-rules.json'),'utf8'));
const store={
  read:async()=>{try{return JSON.parse(await readFile(resolve(dataDir,'monitor.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}},
  write:async state=>{await mkdir(dataDir,{recursive:true});await writeFile(resolve(dataDir,'monitor.tmp'),JSON.stringify(state));await rename(resolve(dataDir,'monitor.tmp'),resolve(dataDir,'monitor.json'));}
};
const monitor=createMonitor({catalog,store,calculatorRules}),types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const bielik=createBielik({monitor,env:process.env});
const port=Number(process.env.PORT||3000);
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(url.pathname.startsWith('/api/')){
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>50000){res.writeHead(413).end();return;}chunks.push(chunk);}
      const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
      const response=await handleApi(request,monitor,{adminToken:process.env.ADMIN_TOKEN,bielik,clientKey:req.socket.remoteAddress});
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    const pathname=decodeURIComponent(url.pathname),file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)||pathname.startsWith('/server/')||pathname.startsWith('/.openai/')){res.writeHead(403).end();return;}
    const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}).end(data);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:500,{'Content-Type':'text/plain; charset=utf-8'}).end('Nie udało się obsłużyć żądania.');}
});
let timer;
async function schedule(){
  clearTimeout(timer);const next=nextMidnight();console.log(`Następne sprawdzenie źródeł: ${next} (00:00 Europe/Warsaw)`);
  timer=setTimeout(async()=>{try{await monitor.refresh('scheduled');}catch(e){console.error('Sprawdzenie źródeł nie powiodło się:',e.message);}finally{schedule();}},Math.max(1,new Date(next)-Date.now()));timer.unref();
}
server.listen(port,'0.0.0.0',async()=>{
  console.log(`Aplikacja: http://localhost:${port}`);
  for(const items of Object.values(networkInterfaces()))for(const n of items||[])if(n.family==='IPv4'&&!n.internal)console.log(`Telefon: http://${n.address}:${port}`);
  schedule();
  // Catch up after downtime without waiting until the next midnight.
  if(process.env.PPM_STARTUP_CHECK==='1'){const state=await monitor.read();if(state.lastScheduledDay!==warsawDay())monitor.refresh('scheduled').catch(e=>console.error(e.message));}
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearTimeout(timer);server.close(()=>process.exit(0));});
