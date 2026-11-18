import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'});
const errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));
await page.clock.install({time:new Date('2026-11-18T12:00:00+01:00')});
await page.addInitScript(()=>{localStorage.setItem('ppm-test-reset','completed-stages-2026-11-10');if(!localStorage.getItem('ppm-profile-v1'))localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'child',anchor:'2026-11-01',name:'Anna Maria Kowalska',gender:'girl',dates:{birthCardDate:'2026-11-02',peselDate:'2026-11-15'},completedTasks:['usc'],notApplicableTasks:['krus-benefit']}));});
let fail=false,hold=null,release=null;
await page.route('**/api/chat',async route=>{
  const body=route.request().postDataJSON();requests.push(body);
  if(hold)await hold;
  if(fail)return route.fulfill({status:429,json:{error:'Limit zapytań. Spróbuj ponownie później.'}});
  return route.fulfill({json:{kind:'source',answer:'USC oznaczono jako wykonane. Zgłoszenie do ubezpieczenia jest jeszcze otwarte.\nTermin: 22 listopada 2026.\n<img src=x onerror="window.pwned=true">',sources:[{id:'insurance',name:'Pacjent.gov.pl · ubezpieczenie',url:'https://pacjent.gov.pl/aktualnosc/zglos-dziecko-do-ubezpieczenia#:~:text=PESEL',status:'ok'}],tasks:[{id:'insurance',title:'Zgłoś dziecko do ubezpieczenia zdrowotnego',status:'pending',period:'Od 15 listopada 2026 do 22 listopada 2026'}]}});
});
try{
  await page.goto('http://127.0.0.1:3001');await page.locator('.map-node.current').waitFor();
  const order=await page.locator('.bottom-nav button').evaluateAll(nodes=>nodes.map(node=>node.id));
  assert.deepEqual(order,['nav-map','nav-today','nav-calendar','nav-chat','nav-profile']);
  const doctor=await page.locator('#doctor-launcher').boundingBox(),recenter=await page.locator('#recenter').boundingBox();assert.ok(doctor.y+doctor.height<=recenter.y-8);
  await page.locator('#doctor-launcher img').evaluate(image=>image.decode());await page.screenshot({path:'artifacts/doctor-map-390.png'});
  await page.locator('#doctor-launcher').click();await page.locator('#chat-view').waitFor();
  assert.equal(await page.locator('.journey-summary').isVisible(),false);assert.equal(await page.locator('#doctor-launcher').isVisible(),false);assert.equal(await page.locator('#recenter').isVisible(),false);assert.equal(await page.locator('#nav-chat').getAttribute('aria-current'),'page');
  assert.match(await page.locator('.chat-context').textContent(),/3\. tydzień życia/);
  for(const size of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]){
    await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const composer=await page.locator('#chat-form').boundingBox(),nav=await page.locator('.bottom-nav').boundingBox();assert.ok(composer.y+composer.height<=nav.y+1);
    await page.screenshot({path:`artifacts/doctor-chat-empty-${size.width}.png`});
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#chat-input').fill('Co zostało do zrobienia?');await page.locator('#chat-send').click();await page.locator('.chat-message-assistant').waitFor();
  assert.equal(requests.length,1);assert.ok(requests[0].profile.completedTasks.includes('usc'));assert.ok(requests[0].profile.notApplicableTasks.includes('krus-benefit'));assert.ok(!JSON.stringify(requests[0]).includes('Kowalska'));assert.ok(!('gender' in requests[0].profile));
  assert.ok((await page.locator('.chat-answer').last().textContent()).includes('<img'));assert.equal(await page.locator('img[onerror]').count(),0);assert.equal(await page.evaluate(()=>window.pwned),undefined);
  assert.match(await page.locator('.chat-source').getAttribute('href'),/#:~:text=PESEL/);
  await page.screenshot({path:'artifacts/doctor-chat-reply-390.png'});
  await page.locator('.chat-task').click();await page.locator('#event-done').click();await page.locator('#close-sheet').click();
  assert.equal(await page.locator('#nav-chat').getAttribute('aria-current'),'page');assert.equal(await page.locator('.chat-message-assistant').count(),1);
  await page.locator('#nav-map').click();assert.equal(await page.locator('.journey-summary').isVisible(),true);await page.locator('#nav-calendar').click();assert.equal(await page.locator('.journey-summary').isVisible(),false);await page.locator('#nav-chat').click();assert.equal(await page.locator('.chat-message-assistant').count(),1);
  await page.locator('#chat-input').fill('Czy moje oznaczenie ubezpieczenia już widać?');await page.locator('#chat-input').press('Enter');await page.locator('.chat-message-assistant').nth(1).waitFor();assert.ok(requests[1].profile.completedTasks.includes('insurance'));assert.equal(requests[1].history.length,2);
  await page.locator('#chat-clear').click();assert.equal(await page.locator('.chat-message').count(),0);
  fail=true;await page.locator('#chat-input').fill('Co z becikowym?');await page.locator('#chat-send').click();await page.getByRole('alert').filter({hasText:'Limit zapytań'}).waitFor();assert.equal(await page.locator('#chat-input').inputValue(),'Co z becikowym?');assert.equal(await page.locator('.chat-message-user').count(),0);
  fail=false;hold=new Promise(resolve=>{release=resolve;});await page.locator('#chat-send').click();await page.locator('.chat-thinking').waitFor();await page.locator('#nav-map').click();release();hold=null;await page.waitForResponse(response=>response.url().endsWith('/api/chat'));await page.locator('#nav-chat').click();await page.locator('.chat-message-assistant').waitFor();
  await page.setViewportSize({width:390,height:480});const form=await page.locator('#chat-form').boundingBox(),nav=await page.locator('.bottom-nav').boundingBox();assert.ok(form.y+form.height<=nav.y+1);
  for(const path of ['/backend/.env','/.env','/server/index.js']){const r=await page.request.get('http://127.0.0.1:3001'+path);assert.ok([403,404].includes(r.status()));}
  assert.equal((await (await page.request.get('http://127.0.0.1:3001/api/chat/status')).json()).available,true);
  assert.deepEqual(errors,[]);
  console.log('PASS: floating doctor above My Week; fifth tab placement; 320/390/430px and keyboard-height layouts; source links; escaped answers; no name/gender sent; status changes; preserved conversation across navigation; clear/retry/pending states; server-only secret files.');
}finally{await browser.close();}
