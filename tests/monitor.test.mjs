import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMonitor,nextMidnight,warsawDay,normalizeSource,safeOfficial} from '../backend/monitor.mjs';
const catalog={version:'initial',sources:[{id:'usc',url:'https://www.gov.pl/web/gov/test',name:'Test',discover:true}],events:[{id:'usc',source:'usc',description:'Opis zatwierdzony przed zmianą źródła.',start:{anchor:'birth',days:0},end:{anchor:'birth',days:21}}]};
const html=(content,extra='')=>`<main><h1>Informacja urzędowa</h1><p>${content.repeat(8)}</p>${extra}</main><footer>Zmieniająca się stopka</footer>`;
function setup(){let data=null,body=html('Pierwotna treść urzędu. '),status=200,requests=0;const fetcher=async()=>{requests++;return new Response(body,{status,headers:{'Content-Type':'text/html'}});};const store={read:async()=>data?structuredClone(data):null,write:async value=>{data=structuredClone(value);}};return {monitor:createMonitor({catalog,store,fetcher,defaultScope:'all',clock:()=>new Date('2026-11-13T10:00:00Z')}),change:(text,code=200)=>{body=text;status=code;},data:()=>data,requests:()=>requests};}
test('detects changes, disappearance, recovery and new documents without overwriting approved content',async()=>{
  const f=setup();await f.monitor.refresh();assert.equal(f.data().sources.usc.status,'ok');
  f.change(html('Nowa reguła urzędowa. ','<a href="https://www.gov.pl/web/gov/opieka-porodowa">Nowy dokument</a>'));
  await f.monitor.refresh();assert.equal(f.data().sources.usc.status,'changed');assert.equal(f.data().sources.usc.newLinks.length,1);
  assert.equal(f.data().catalog.events[0].end.days,21);assert.ok(f.data().sources.usc.pending.text.includes('Nowa'));
  const hash=f.data().sources.usc.pending.hash;
  await f.monitor.review({sourceId:'usc',hash,patches:[{id:'usc',description:'Nowa reguła, sprawdzona przez redaktora.',end:{anchor:'birth',days:25},validFrom:'2027-01-01'}]});
  assert.equal(f.data().sources.usc.status,'ok');assert.equal(f.data().catalog.events[0].versions[0].end.days,25);assert.equal(f.data().revisions.length,1);
  f.change('Usunięto',404);await f.monitor.refresh();assert.equal(f.data().sources.usc.status,'missing');assert.equal(f.data().catalog.events.length,1);
  f.change(html('Nowa reguła urzędowa. ','<a href="https://www.gov.pl/web/gov/opieka-porodowa">Nowy dokument</a>'));await f.monitor.refresh();assert.equal(f.data().sources.usc.status,'ok');
});
test('failed checks and stale approvals cannot erase or publish rules',async()=>{
  const f=setup();await f.monitor.refresh();f.change('Niedostępne',503);await f.monitor.refresh();assert.equal(f.data().sources.usc.status,'unavailable');assert.equal(f.data().catalog.events[0].description,catalog.events[0].description);
  await assert.rejects(()=>f.monitor.review({sourceId:'usc',hash:'wrong'}));
  assert.equal(safeOfficial('http://127.0.0.1'),false);assert.equal(safeOfficial('https://www.gov.pl.evil.example'),false);
  assert.equal(normalizeSource('<main>A&nbsp;B</main><footer>Nowa data</footer>'),'A B');
});
test('manual requests coalesce and scheduled runs execute once per Warsaw date',async()=>{
  const f=setup();await Promise.all([f.monitor.refresh('manual'),f.monitor.refresh('manual')]);assert.equal(f.requests(),1);
  await f.monitor.refresh('scheduled');const count=f.requests();await f.monitor.refresh('scheduled');assert.equal(f.requests(),count);
});
test('a removed source can be replaced by another official address with reviewed rules and fragment',async()=>{
  const f=setup();await f.monitor.refresh();const oldUrl=f.data().catalog.sources[0].url;
  f.change('Brak',404);await f.monitor.refresh();const hash=f.data().sources.usc.currentHash;
  f.change(html('Nowa oficjalna strona. '));await f.monitor.review({sourceId:'usc',hash,replacementUrl:'https://www.gov.pl/web/gov/nowy-poradnik',quote:'Nowa oficjalna strona.',section:'Terminy',patches:[]});
  assert.equal(f.data().catalog.sources[0].url,'https://www.gov.pl/web/gov/nowy-poradnik');assert.equal(f.data().revisions[0].catalog.sources[0].url,oldUrl);assert.equal(f.data().catalog.sources[0].quote,'Nowa oficjalna strona.');
});
test('00:00 Warsaw follows civil time across DST instead of a fixed 24-hour interval',()=>{
  assert.equal(nextMidnight(new Date('2026-11-13T10:00:00Z')),'2026-11-13T23:00:00.000Z');
  assert.equal(nextMidnight(new Date('2026-03-28T23:00:00Z')),'2026-03-29T22:00:00.000Z');
  assert.equal(nextMidnight(new Date('2026-10-24T22:00:00Z')),'2026-10-25T23:00:00.000Z');
  assert.equal(warsawDay(new Date('2026-11-13T23:00:00Z')),'2026-11-14');
});
