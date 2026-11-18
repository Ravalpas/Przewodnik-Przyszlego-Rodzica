import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'});
const errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));
await page.clock.install({time:new Date('2026-11-18T12:00:00+01:00')});
await page.addInitScript(()=>{localStorage.setItem('ppm-test-reset','fresh-start-2026-11-19.1');if(!localStorage.getItem('ppm-profile-v1'))localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'child',anchor:'2026-11-01',name:'Rafał',dates:{birthCardDate:'2026-11-02',peselDate:'2026-11-15'}}));});
await page.route('**/api/chat',route=>{requests.push(route.request().postDataJSON());return route.fulfill({json:{kind:'practical',answer:'Przygotuj zapisane pytania przed wizytą.',sources:[],tasks:[]}});});
const storedNotes=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ppm-calendar-notes-v1')).notes);
const archive=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ppm-bielik-conversations-v1')));
const close=()=>page.getByRole('button',{name:'Zamknij',exact:true}).click();
async function send(text){const n=await page.locator('.chat-message-assistant').count();await page.locator('#chat-input').fill(text);await page.locator('#chat-send').click();await page.locator('.chat-message-assistant').nth(n).waitFor();}
async function add(text,color='red',date='2026-11-19',time=''){
  await page.locator('#note-add').click();assert.equal(await page.locator('[name=color]:checked').inputValue(),'red');
  await page.locator('#note-text').fill(text);await page.locator('#note-date').fill(date);if(time)await page.locator('#note-time').fill(time);
  await page.locator(`[name=color][value=${color}]`).check({force:true});await page.locator('#note-form button[type=submit]').click();await page.locator('#sheet').waitFor({state:'hidden'});
}
try{
  await page.goto('http://127.0.0.1:3001');await page.locator('#nav-calendar').click();
  await add('Pediatra — książeczka zdrowia','red','2026-11-19','10:30');
  assert.equal(await page.locator('[data-day="2026-11-19"] .day-note-pins').count(),1);
  assert.match(await page.locator('.calendar-agenda').first().textContent(),/Pediatra/);
  assert.ok(await page.locator('.calendar-agenda').first().evaluate(el=>{const note=el.querySelector('.day-notes'),other=el.querySelector('.event-group,.event-card,.milestone-card');return !other||!!(note.compareDocumentPosition(other)&Node.DOCUMENT_POSITION_FOLLOWING);}));
  await add('USC — odebrać akt','green');await add('Pytania o szczepienie','yellow');await add('Spotkanie z rodziną','orange');
  assert.equal((await storedNotes()).length,4);assert.equal(await page.locator('.personal-note').count(),4);assert.equal(await page.locator('.day-note-count').textContent(),'4');
  for(const width of [320,390,430]){await page.setViewportSize({width,height:844});await page.locator('#calendar-today').click();await page.screenshot({path:`artifacts/notes-calendar-${width}.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.setViewportSize({width:390,height:844});await page.locator('[data-day="2026-11-19"]').click();
  const first=(await storedNotes()).find(n=>n.text.startsWith('Pediatra'));
  await page.locator('.day-notes').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/notes-agenda-390.png'});
  await page.locator('#note-add').click();await page.setViewportSize({width:320,height:740});await page.screenshot({path:'artifacts/notes-editor-320.png'});assert.equal(await page.locator('#note-form').evaluate(el=>el.scrollWidth>el.clientWidth),false);await page.locator('#note-cancel').click();await page.setViewportSize({width:390,height:844});
  await page.locator(`[data-edit-note="${first.id}"]`).click();await page.locator('#note-text').fill('Pediatra — kontrola, zabrać pytania\n<img src=x onerror=alert(1)>');await page.locator('[name=color][value=green]').check({force:true});await page.locator('#note-form button[type=submit]').click();
  assert.equal(await page.locator('.personal-note img').count(),0);await page.locator(`[data-open-note="${first.id}"]`).click();assert.match(await page.locator('.note-full-text').textContent(),/<img/);await close();
  await page.locator('#nav-chat').click();assert.equal(await page.locator('#chat-save').count(),0);
  await send('Jakie mam notatki na jutro?');assert.equal(requests.length,0);assert.match(await page.locator('.chat-message-assistant').textContent(),/Pediatra/);assert.equal(await page.locator('[data-chat-note]').count(),4);
  await page.locator(`[data-chat-note="${first.id}"]`).click();assert.match(await page.locator('.note-full-text').textContent(),/kontrola/);await close();
  await page.locator('#nav-map').click();await page.locator('#nav-chat').click();assert.equal(await page.locator('.chat-message-assistant').count(),1);
  const firstChat=(await archive()).activeId;await page.reload();await page.locator('#nav-chat').click();assert.equal((await archive()).activeId,firstChat);assert.equal(await page.locator('[data-chat-note]').count(),4);
  await send('Jak przygotować pytania do pediatry z moich notatek?');assert.equal(requests.length,1);assert.equal(requests[0].history.length,0);assert.equal(requests[0].noteContext.notes.length,1);assert.equal(requests[0].noteContext.notes[0].id,first.id);
  await page.locator('#chat-new').click();await send('Podaj imię mojego dziecka');assert.equal((await archive()).conversations.length,2);
  await page.locator('#chat-history').click();await page.locator(`[data-open-chat="${firstChat}"]`).click();assert.equal(await page.locator('.chat-message-assistant').count(),2);await send('Pokaż zielone szpilki');assert.equal(requests.length,1);assert.equal(await page.locator('.chat-message-assistant').count(),3);
  await page.locator('#nav-calendar').click();await page.locator('[data-day="2026-11-19"]').click();await page.locator(`[data-edit-note="${first.id}"]`).click();await page.locator('#note-date').fill('2026-11-20');await page.locator('#note-time').fill('15:45');await page.locator('#note-text').fill('Pediatra — zmieniona wizyta');await page.locator('#note-form button[type=submit]').click();assert.equal(await page.locator('.personal-note').count(),1);
  await page.locator(`[data-delete-note="${first.id}"]`).click();await page.locator('#note-delete-cancel').click();await page.locator('#sheet').waitFor({state:'hidden'});assert.equal((await storedNotes()).length,4);
  await page.locator(`[data-open-note="${first.id}"]`).click();await page.locator('#note-delete-detail').click();await page.locator('#note-delete-cancel').click();await page.locator('#sheet').waitFor({state:'hidden'});assert.equal((await storedNotes()).length,4);
  await page.locator(`[data-delete-note="${first.id}"]`).click();await page.locator('#note-delete-confirm').click();assert.equal((await storedNotes()).length,3);assert.equal(await page.locator('[data-day="2026-11-20"].has-note').count(),0);
  await page.locator('#nav-chat').click();await send('Pokaż notatki o pediatrze');assert.equal(requests.length,1);assert.match(await page.locator('.chat-message-assistant').last().textContent(),/Nie widzę notatek pasujących/);
  await page.locator('#chat-new').click();await page.locator('#chat-input').fill('Szkic do zachowania');await page.clock.runFor(600);await page.reload();await page.locator('#nav-chat').click();assert.equal(await page.locator('#chat-input').inputValue(),'Szkic do zachowania');
  assert.deepEqual(errors,[]);console.log('PASS: notes CRUD, four cartoon pin colors, multiple notes/day, escaping, top-of-day order, move date/time, confirmed deletion, local Bielik reads and current note links, bounded context, no Save button, automatic conversations, archive continuation, reload and draft persistence. Real model calls: 0.');
}finally{await browser.close();}
