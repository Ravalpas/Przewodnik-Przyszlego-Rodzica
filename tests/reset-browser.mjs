import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {RESET_KEY,RESET_REVISION} from '../dist/reset.js';
import {CHAT_ARCHIVE_KEY,newConversation} from '../dist/chat-storage.js';
import {NOTES_KEY} from '../dist/notes.js';

const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.install({time:new Date('2026-11-19T12:00:00+01:00')});
const conversation=newConversation('2026-11-18T12:00:00Z');conversation.title='Old conversation';conversation.messages=[{role:'user',content:'OLD QUESTION',local:true},{role:'assistant',kind:'profile',content:'OLD ANSWER',local:true}];
await page.addInitScript(({resetKey,chatKey,notesKey,conversation})=>{
  if(localStorage.getItem('reset-check-seeded'))return;
  localStorage.setItem('reset-check-seeded','keep');localStorage.setItem(resetKey,'completed-stages-2026-11-10');
  localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'child',anchor:'2026-11-01',name:'OLD NAME',gender:'girl',completedTasks:['usc']}));
  localStorage.setItem(chatKey,JSON.stringify({version:1,activeId:conversation.id,conversations:[conversation]}));
  localStorage.setItem(notesKey,JSON.stringify({version:1,notes:[{id:'old-note',date:'2026-11-19',time:'',color:'blue',text:'OLD NOTE'}]}));
},{resetKey:RESET_KEY,chatKey:CHAT_ARCHIVE_KEY,notesKey:NOTES_KEY,conversation});
await page.route('**/api/chat',()=>assert.fail('Reset checks must not use the model'));
try{
  await page.goto('http://127.0.0.1:3001');await page.locator('.welcome').waitFor();
  const after=await page.evaluate(({resetKey,chatKey,notesKey})=>({profile:localStorage.getItem('ppm-profile-v1'),chat:localStorage.getItem(chatKey),notes:localStorage.getItem(notesKey),revision:localStorage.getItem(resetKey),other:localStorage.getItem('reset-check-seeded')}),{resetKey:RESET_KEY,chatKey:CHAT_ARCHIVE_KEY,notesKey:NOTES_KEY});
  assert.deepEqual(after,{profile:null,chat:null,notes:null,revision:RESET_REVISION,other:'keep'});
  await page.locator('[data-mode=child]').click();await page.locator('#continue').click();
  assert.equal(await page.locator('#age-value').inputValue(),'');assert.equal(await page.locator('#age-unit').inputValue(),'');
  await page.locator('#age-value').fill('0');await page.locator('#age-unit').selectOption('days');await page.locator('.age-form button[type=submit]').click();
  await page.locator('#nav-chat').click();assert.equal(await page.locator('.chat-message').count(),0);assert.ok(!(await page.locator('#chat-view').textContent()).includes('OLD ANSWER'));
  await page.locator('#chat-input').fill('Ile lat ma moje dziecko?');await page.locator('#chat-send').click();await page.locator('.chat-message-assistant').waitFor();
  await page.locator('#nav-calendar').click();assert.equal(await page.locator('.personal-note').count(),0);await page.locator('#note-add').click();await page.locator('#note-text').fill('NEW NOTE');await page.locator('#note-form button[type=submit]').click();
  await page.reload();await page.locator('#nav-calendar').click();assert.match(await page.locator('.personal-note').textContent(),/NEW NOTE/);
  await page.locator('#nav-chat').click();assert.equal(await page.locator('.chat-message').count(),2);assert.ok(!(await page.locator('#chat-view').textContent()).includes('OLD ANSWER'));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ppm-profile-v1')).anchor),'2026-11-19');assert.deepEqual(errors,[]);
  console.log('PASS: authorized reset removes profile, task markings, notes and chats before chat restoration; unrelated data survives; first setup starts blank; new data survives reload; old conversation cannot return. Real model calls: 0.');
}finally{await browser.close();}
