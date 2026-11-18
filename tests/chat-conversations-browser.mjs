import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'});
const errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));
await page.clock.install({time:new Date('2026-11-18T12:00:00+01:00')});
await page.addInitScript(()=>{localStorage.setItem('ppm-test-reset','completed-stages-2026-11-10');if(!localStorage.getItem('ppm-profile-v1'))localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'child',anchor:'2026-11-01',name:'Anna Maria Kowalska',gender:'girl',dates:{birthCardDate:'2026-11-02',peselDate:'2026-11-15'},completedTasks:['usc']}));});
let release;const waiting=new Promise(resolve=>{release=resolve;});
await page.route('**/api/chat',async route=>{requests.push(route.request().postDataJSON());await waiting;return route.fulfill({json:{kind:'source',answer:'Sprawdź otwarte sprawy na swojej drodze.',sources:[],tasks:[]}});});
const send=async text=>{await page.locator('#chat-input').fill(text);await page.locator('#chat-send').click();};
const archive=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ppm-bielik-conversations-v1')));
try{
  await page.goto('http://127.0.0.1:3001');await page.locator('#nav-chat').click();
  assert.equal(await page.locator('.chat-privacy').count(),0);assert.ok(!(await page.locator('#chat-view').textContent()).includes('Jak korzystam z kontekstu'));
  assert.match(await page.locator('.chat-welcome p').textContent(),/na początkowym etapie życia dziecka/);
  assert.ok(!(await page.locator('.chat-suggestions').textContent()).includes('położną'));
  for(const size of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]){
    await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`artifacts/chat-revision-empty-${size.width}.png`});
  }
  await page.setViewportSize({width:390,height:844});
  await send('podaj imię mojego dziecka, oraz ile ma lat?');
  await page.locator('.chat-message-assistant').waitFor();assert.equal(requests.length,0);
  const personal=await page.locator('.chat-message-assistant').textContent();assert.match(personal,/Anna Maria Kowalska/);assert.match(personal,/2 tygodnie i 3 dni/);
  await page.locator('#chat-save').click();await page.getByRole('status').filter({hasText:'Zapisano rozmowę'}).waitFor();
  const firstId=(await archive()).activeId;
  await page.reload();await page.locator('#nav-chat').click();assert.equal(await page.locator('.chat-message-assistant').count(),1);assert.match(await page.locator('.chat-message-assistant').textContent(),/Kowalska/);
  await send('Jakie formalności jeszcze czekają?');await page.locator('.chat-thinking').waitFor();
  assert.equal((await page.locator('.chat-thinking').textContent()).trim(),'Obecnie pracuję nad rozwiązaniem powierzonego mi zagadnienia.');
  await page.screenshot({path:'artifacts/chat-revision-thinking-390.png'});
  release();await page.locator('.chat-message-assistant').nth(1).waitFor();assert.equal(requests.length,1);assert.equal(requests[0].history.length,0);assert.ok(!JSON.stringify(requests[0]).includes('Kowalska'));
  assert.equal((await archive()).conversations[0].messages.length,4);
  await page.locator('#chat-new').click();assert.equal(await page.locator('.chat-message').count(),0);assert.equal((await archive()).conversations.length,1);
  await send('Ile lat ma moje dziecko?');await page.locator('#chat-save').click();assert.equal((await archive()).conversations.length,2);
  await page.locator('#chat-history').click();assert.equal(await page.locator('[data-open-chat]').count(),2);
  await page.screenshot({path:'artifacts/chat-revision-history-390.png'});
  await page.locator('[data-open-chat="'+firstId+'"]').click();assert.equal(await page.locator('.chat-message').count(),4);
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('ppm-profile-v1'));localStorage.setItem('ppm-profile-v1',JSON.stringify({...p,name:'Rafał',anchor:'2024-11-18'}));});
  await page.reload();await page.locator('#nav-chat').click();await send('Podaj imię mojego dziecka, oraz ile ma lat?');
  assert.match(await page.locator('.chat-message-assistant').last().textContent(),/Rafał/);assert.match(await page.locator('.chat-message-assistant').last().textContent(),/2 lata/);assert.equal(requests.length,1);
  await page.screenshot({path:'artifacts/chat-revision-profile-390.png'});
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='ppm-bielik-conversations-v1')throw new DOMException('Storage full','QuotaExceededError');return original.call(this,key,value);};});
  const count=await page.locator('.chat-message').count();await page.locator('#chat-new').click();assert.equal(await page.locator('.chat-message').count(),count);assert.match(await page.locator('.chat-error').textContent(),/Nie udało się zapisać/);
  assert.deepEqual(errors,[]);
  console.log('PASS: exact reported name/age query answered locally with zero AI requests; saved/new/resume/reload/update flows; local replies excluded from AI history; exact waiting text; removed context panel; wider childhood age; storage failure preserves open conversation; mobile widths. All model responses were mocked.');
}finally{await browser.close();}
