import { createMonitor } from '../backend/monitor.mjs';
import { handleApi } from '../backend/api.mjs';
import { d1Store } from '../backend/d1-store.mjs';
// The build embeds the approved catalog, backend modules and existing static assets.
let deployedMonitor;
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/')) {
      if(!env.DB)return Response.json({error:'Baza źródeł jest niedostępna.'},{status:503});
      deployedMonitor??=createMonitor({catalog:CATALOG,store:d1Store(env.DB)});
      return handleApi(request,deployedMonitor);
    }
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
    let path;try{path=decodeURIComponent(url.pathname);}catch{return new Response('Bad request',{status:400});}
    const asset=ASSETS[path==='/'?'/index.html':path];if(!asset)return new Response('Nie znaleziono pliku',{status:404});
    const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
    return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
  }
};
