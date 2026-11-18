import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'});
await page.clock.install({time:new Date('2026-11-18T12:00:00+01:00')});
await page.addInitScript(()=>{localStorage.setItem('ppm-test-reset','fresh-start-2026-11-19.1');if(!localStorage.getItem('ppm-profile-v1'))localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'child',anchor:'2025-05-18',name:'Anna Maria Kowalska',gender:'girl',dates:{birthCardDate:'2025-05-19',peselDate:'2025-05-20'},completedTasks:['usc'],notApplicableTasks:['krus-benefit']}));});
const requests=[];let replyKind='source';
await page.route('**/api/chat',route=>{requests.push(route.request().postDataJSON());return route.fulfill({json:{kind:replyKind,answer:'Pozostałą część sprawy sprawdź we wskazanym oficjalnym materiale.',sources:[{id:'insurance',name:'Pacjent.gov.pl',url:'https://pacjent.gov.pl/aktualnosc/zglos-dziecko-do-ubezpieczenia',status:'ok'}],tasks:[]}});});
const send=async text=>{const before=await page.locator('.chat-message-assistant').count();await page.locator('#chat-input').fill(text);await page.locator('#chat-send').click();await page.locator('.chat-message-assistant').nth(before).waitFor();};
try{
  await page.goto('http://127.0.0.1:3001');await page.locator('#nav-chat').click();
  for(const text of ['Jaka płeć jest wpisana w profilu?','Podaj datę urodzenia mojego dziecka.','Co mam oznaczone jako wykonane w aplikacji?'])await send(text);
  assert.equal(requests.length,0);assert.match(await page.locator('.chat-message-assistant').nth(0).textContent(),/dziewczynka/);assert.match(await page.locator('.chat-message-assistant').nth(1).textContent(),/18 maja 2025/);assert.match(await page.locator('.chat-message-assistant').nth(2).textContent(),/USC/);
  await send('Podaj imię mojego dziecka i wyjaśnij zasady ubezpieczenia zdrowotnego.');
  assert.equal(requests.length,1);assert.ok(requests[0].handledProfileFields.includes('name'));assert.ok(!JSON.stringify(requests[0]).includes('Kowalska'));
  const mixed=await page.locator('.chat-message-assistant').last().textContent();assert.match(mixed,/Anna Maria Kowalska/);assert.match(mixed,/Pozostałą część/);
  await page.reload();await page.locator('#nav-chat').click();
  await send('A gdzie zgłosić dziecko do ubezpieczenia?');assert.equal(requests.length,2);assert.ok(!JSON.stringify(requests[1]).includes('Kowalska'));assert.ok(requests[1].history.some(m=>m.content.includes('Pozostałą część')));
  replyKind='no_evidence';await send('Jakie dokładnie są warunki świadczenia rodzicielskiego?');assert.match(await page.locator('.chat-message-assistant').last().textContent(),/Gdzie sprawdzić informacje/);
  console.log('PASS: multiple profile fields and task status work locally; mixed requests preserve both parts; local identity stays out of model history after saved-chat reload; unavailable evidence is distinguished from cited answers. All model responses were mocked.');
}finally{await browser.close();}
