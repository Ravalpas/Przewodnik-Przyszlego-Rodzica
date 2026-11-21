import {scopeCatalog} from '../dist/source-scope.js';
import {validateCalculatorParameters} from '../dist/calculator-params.js';
export function warsawDay(date=new Date()) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function nextMidnight(now=new Date()) {
  const day=warsawDay(now);
  // Locate the next local midnight, including the 23/25-hour DST days.
  let low=now.getTime()+1,high=low+27*3600000;
  while(high>low){const mid=Math.floor((low+high)/2);if(warsawDay(new Date(mid))===day)low=mid+1;else high=mid;}
  return new Date(high).toISOString();
}
export function normalizeSource(html) {
  let body=html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
  const main=body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);if(main)body=main[1];
  body=body.replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const cp=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return cp<=0x10ffff?String.fromCodePoint(cp):' ';})
    .replace(/&(nbsp|amp|quot|apos|lt|gt);/gi,(_,n)=>({nbsp:' ',amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'}[n.toLowerCase()]))
    .replace(/\s+/g,' ').trim();
  return body.split(/Informacje o publikacji dokumentu|stopka gov\.pl|Ostatnia modyfikacja:/i)[0].trim();
}
export async function digest(value) {
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
const officialHosts=new Set(['www.gov.pl','gov.pl','pacjent.gov.pl','www.zus.pl','zus.pl','www.nfz.gov.pl','akademia.nfz.gov.pl','www.pip.gov.pl','eli.gov.pl','dziennikmz.mz.gov.pl']);
export function safeOfficial(url) {try{const u=new URL(url);return u.protocol==='https:'&&officialHosts.has(u.hostname)&&!u.username&&!u.password&&(!u.port||u.port==='443');}catch{return false;}}
export async function sourceSnapshot(source,fetcher=fetch) {
  let url=source.url;
  for(let redirects=0;redirects<5;redirects++) {
    if(!safeOfficial(url))throw new Error('Przekierowanie poza dozwolone źródła.');
    const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'PPR-source-monitor/1.0','Accept':'text/html,application/pdf'}});
    if(response.status>=300&&response.status<400&&response.status!==304){url=new URL(response.headers.get('location'),url).href;continue;}
    if(response.status===404||response.status===410)return {status:'missing',http:response.status,url};
    if(!response.ok)throw new Error(`Źródło zwróciło HTTP ${response.status}.`);
    const type=response.headers.get('content-type')||'';
    if(!/text\/html|application\/pdf/.test(type))throw new Error('Nierozpoznany typ dokumentu.');
    const reader=response.body.getReader();let size=0;const chunks=[];
    try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2500000)throw new Error('Dokument przekracza limit 2,5 MB.');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
    const bytes=new Uint8Array(size);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}
    const html=new TextDecoder().decode(bytes),text=type.includes('pdf')?'Dokument PDF — sprawdź treść w oficjalnym źródle.':normalizeSource(html);
    if(!type.includes('pdf')&&(text.length<150||/just a moment|access denied|verify you are human|captcha/i.test(text.slice(0,500))))throw new Error('Strona nie udostępniła treści do odczytu.');
    const links=[];
    if(source.discover)for(const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)){
      try{const link=new URL(match[1].replace(/&amp;/g,'&'),url);link.hash='';if(safeOfficial(link.href)&&/szczep|standard|prenatal|urodzeni|opiek.*porod|\.pdf/i.test(link.pathname))links.push(link.href);}catch{}
    }
    return {status:'ok',url,http:response.status,hash:await digest(type.includes('pdf')?bytes:text),text:text.slice(0,20000),links:[...new Set(links)].slice(0,80)};
  }
  throw new Error('Zbyt wiele przekierowań.');
}
export function createMonitor({catalog,store,fetcher=fetch,clock=()=>new Date(),defaultScope='zus',calculatorRules=null}) {
  let running=null,runningScope=null;
  const initial=()=>({catalog:structuredClone(catalog),calculatorRules:calculatorRules?structuredClone(calculatorRules):null,seedVersion:catalog.version,sources:{},sourceScope:defaultScope,history:[],lastCheckedAt:null,lastScheduledDay:null});
  const read=async()=>{
    const state=await store.read();if(!state)return initial();
    if(!state.calculatorRules&&calculatorRules)state.calculatorRules=structuredClone(calculatorRules);
    if(state.seedVersion!==catalog.version){
      state.catalog.sources=[...state.catalog.sources,...catalog.sources.filter(s=>!state.catalog.sources.some(old=>old.id===s.id))];
      state.catalog.events=[...state.catalog.events,...catalog.events.filter(e=>!state.catalog.events.some(old=>old.id===e.id))];state.seedVersion=catalog.version;
    }
    return state;
  };
  async function perform(reason,scope) {
    const state=await read(),now=clock().toISOString();
    if(reason==='scheduled'&&state.lastScheduledDay===warsawDay(clock()))return {...state,skipped:true,nextCheckAt:nextMidnight(clock())};
    state.sourceScope=scope||state.sourceScope||defaultScope;
    const queue=[...scopeCatalog(state.catalog,state.sourceScope).sources];
    async function consume(){while(queue.length){const source=queue.shift(),previous=state.sources[source.id]||{};try{
      const result=await sourceSnapshot(source,fetcher);
      const changed=result.status==='ok'&&previous.acceptedHash&&result.hash!==previous.acceptedHash;
      const discovered=(result.links||[]).filter(link=>previous.links&&!previous.links.includes(link));
      state.sources[source.id]={...previous,lastCheckedAt:now,lastError:null,url:result.url,http:result.http,status:result.status==='missing'?'missing':changed?'changed':'ok',currentHash:result.hash||previous.currentHash,acceptedHash:previous.acceptedHash||result.hash,acceptedText:previous.acceptedText||result.text,links:result.links||previous.links||[],newLinks:[...new Set([...(previous.newLinks||[]),...discovered])],pending:changed?{hash:result.hash,text:result.text,detectedAt:now}:result.status==='missing'?previous.pending||null:null};
      if(changed&&previous.pending?.hash!==result.hash||result.status==='missing'&&previous.status!=='missing'||discovered.length)state.history.unshift({sourceId:source.id,at:now,kind:result.status==='missing'?'missing':discovered.length?'new-links':'changed',hash:result.hash||null});
    }catch(error){state.sources[source.id]={...previous,status:'unavailable',lastCheckedAt:now,lastError:error.message};}}
    }
    await Promise.all(Array.from({length:4},consume));
    state.lastCheckedAt=now;state.history=state.history.slice(0,120);if(reason==='scheduled')state.lastScheduledDay=warsawDay(clock());
    await store.write(state);return {...state,nextCheckAt:nextMidnight(clock())};
  }
  async function exclusive(action){
    const lease=store.acquire?await store.acquire():true;
    if(!lease)throw new Error('Inne sprawdzanie źródeł jest w toku. Spróbuj ponownie za chwilę.');
    try{return await action();}finally{if(store.release)await store.release(lease);}
  }
  return {
    read:async()=>({...await read(),nextCheckAt:nextMidnight(clock())}),
    updateCalculator:({parameters,validFrom,previousRevision,verified,note})=>exclusive(async()=>{
      if(running)throw new Error('Poczekaj na zakończenie sprawdzania źródeł.');
      const state=await read(),current=state.calculatorRules;if(!current)throw new Error('Brak zasad kalkulatora.');
      if(verified!==true)throw new Error('Potwierdź weryfikację zasad w oficjalnych źródłach.');
      if(previousRevision!==current.revision)throw new Error('Zasady zmieniły się w innym oknie. Wczytaj aktualną wersję.');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(validFrom||'')||Number.isNaN(Date.parse(validFrom))||new Date(validFrom+'T12:00Z').toISOString().slice(0,10)!==validFrom)throw new Error('Podaj prawidłową datę obowiązywania.');
      const checked=validateCalculatorParameters(parameters),revision=current.revision+1,id=`${warsawDay(clock())}.${revision}`;
      const versions=[...(current.versions||[]).filter(v=>v.validFrom!==validFrom),{id,validFrom,parameters:checked,note:String(note||'').trim().slice(0,1000),reviewedAt:warsawDay(clock())}].sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
      if(versions.length>40)throw new Error('Osiągnięto limit wersji; przed kolejną zmianą potrzebna jest archiwizacja przez administratora.');
      state.calculatorHistory=[{at:clock().toISOString(),previous:current,revision:id},...(state.calculatorHistory||[])].slice(0,8);
      state.calculatorRules={...current,revision,reviewedAt:warsawDay(clock()),versions};await store.write(state);return state.calculatorRules;
    }),
    refresh:(reason,scope)=>{
      if(scope&&!['zus','all'].includes(scope))throw new Error('Nieprawidłowy zakres źródeł.');
      if(running&&scope&&scope!==runningScope)return Promise.reject(new Error('Trwa odświeżanie innego zakresu. Poczekaj na jego zakończenie.'));
      if(!running){runningScope=scope||null;running=exclusive(()=>perform(reason||'manual',scope)).finally(()=>{running=null;runningScope=null;});}
      return running;
    },
    review:({sourceId,hash,patches=[],replacementUrl,quote,section})=>exclusive(async()=>{
      if(running)throw new Error('Poczekaj na zakończenie odświeżania.');
      const state=await read(),source=state.sources[sourceId];
      const previousCatalog=structuredClone(state.catalog);
      const definition=state.catalog.sources.find(s=>s.id===sourceId);
      if(!definition||!source||(hash||null)!==(source.pending?.hash||source.currentHash||null))throw new Error('Zmiana jest już nieaktualna. Odśwież listę.');
      if(replacementUrl&&replacementUrl!==definition.url){if(!safeOfficial(replacementUrl))throw new Error('Wymagany adres oficjalnego źródła HTTPS.');const replacement=await sourceSnapshot({...definition,url:replacementUrl},fetcher);if(replacement.status!=='ok')throw new Error('Nowe źródło jest niedostępne.');definition.url=replacementUrl;source.pending={hash:replacement.hash,text:replacement.text};}
      if(!source.pending&&source.newLinks?.length)source.pending={hash:source.currentHash,text:source.acceptedText};
      if(!source.pending)throw new Error('Brak nowej wersji do zatwierdzenia.');
      if(!Array.isArray(patches)||patches.length>30)throw new Error('Nieprawidłowa lista zmian.');
      state.revisions=[{at:clock().toISOString(),sourceId,catalog:previousCatalog},...(state.revisions||[])].slice(0,10);
      for(const [key,value]of Object.entries({quote,section}))if(value!==undefined){if(typeof value!=='string'||!value.trim()||value.length>250)throw new Error('Fragment i sekcja źródła muszą mieć 1–250 znaków.');definition[key]=value.trim();}
      for(const patch of patches){const event=state.catalog.events.find(e=>e.id===patch.id&&(e.source===sourceId||e.source==='vaccines'&&sourceId.startsWith('vaccines')));if(!event)throw new Error('Karta nie należy do tego źródła.');
        if(typeof patch.description!=='string'||patch.description.length<20||patch.description.length>3000)throw new Error('Opis powinien mieć 20–3000 znaków.');
        if(!patch.end||!['birth','pregnancy','birthCardDate','peselDate','parentalLeaveDate','dueDate'].includes(patch.end.anchor)||!Number.isInteger(patch.end.days??0)||Math.abs(patch.end.days??0)>1000||!Number.isInteger(patch.end.months??0)||Math.abs(patch.end.months??0)>24)throw new Error('Nieprawidłowa reguła terminu.');
        if(patch.validFrom&&!/^\d{4}-\d{2}-\d{2}$/.test(patch.validFrom))throw new Error('Nieprawidłowa data obowiązywania.');
        const version={description:patch.description,end:patch.end,validFrom:patch.validFrom||warsawDay(clock())};
        if(patch.calendarWindow){
          if(event.recurring!=='800')throw new Error('Karta nie zawiera okresu corocznego.');
          const {start,end}=patch.calendarWindow,valid=v=>typeof v==='string'&&/^\d{2}-\d{2}$/.test(v)&&new Date('2001-'+v+'T12:00:00Z').toISOString().slice(5,10)===v;
          if(!valid(start)||!valid(end)||start>end)throw new Error('Nieprawidłowy coroczny okres kalendarzowy.');
          version.calendarWindow={start,end};
        }
        if(patch.start){if(!['birth','pregnancy','birthCardDate','peselDate','parentalLeaveDate','dueDate'].includes(patch.start.anchor)||!Number.isInteger(patch.start.days??0)||Math.abs(patch.start.days??0)>1000||!Number.isInteger(patch.start.months??0)||Math.abs(patch.start.months??0)>24)throw new Error('Nieprawidłowa reguła początku.');version.start=patch.start;}
        event.versions=[...(event.versions||[]),version];
      }
      source.acceptedHash=source.pending.hash;source.acceptedText=source.pending.text;source.pending=null;source.newLinks=[];source.status='ok';source.reviewedAt=clock().toISOString();
      state.catalog.version=clock().toISOString();state.catalog.reviewedAt=clock().toISOString().slice(0,10);state.history.unshift({sourceId,at:clock().toISOString(),kind:'reviewed'});
      await store.write(state);return {ok:true,version:state.catalog.version};
    })
  };
}
export function publicCalculatorRules(state){
  if(!state.calculatorRules)return null;
  return {...state.calculatorRules,sources:state.calculatorRules.sources.map(s=>({...s,status:state.sources?.[s.id]?.status||'reviewed',checkedAt:state.sources?.[s.id]?.lastCheckedAt||null}))};
}
export function publicMonitorState(state) {
  const scope=state.sourceScope||'zus',catalog=scopeCatalog(state.catalog,scope),ids=new Set(catalog.sources.map(s=>s.id));
  return {sourceScope:scope,catalog,calculatorRules:publicCalculatorRules(state),lastCheckedAt:state.lastCheckedAt,nextCheckAt:state.nextCheckAt,schedule:{time:'00:00',timezone:'Europe/Warsaw'},sources:Object.fromEntries(Object.entries(state.sources).filter(([id])=>ids.has(id)).map(([id,s])=>[id,{status:s.status,lastCheckedAt:s.lastCheckedAt,lastError:s.lastError,newLinks:s.newLinks||[],reviewedAt:s.reviewedAt}])),history:state.history.filter(h=>ids.has(h.sourceId))};
}
