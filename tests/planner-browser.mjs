import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.clock.install({time:new Date('2026-11-13T10:00:00+01:00')});
await page.addInitScript(()=>{localStorage.setItem('ppm-test-reset','completed-stages-2026-11-10');if(!localStorage.getItem('ppm-profile-v1'))localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'child',anchor:'2026-10-25',name:'Rafał',pregnancyStart:'2026-01-22',dates:{birthCardDate:'2026-10-26',peselDate:'2026-11-03'},birthTime:'08:30'}));});
try{
  await page.goto('http://127.0.0.1:3001');await page.locator('.map-node.current').waitFor();
  await page.locator('.map-node.current').click();assert.ok(await page.locator('dialog [data-event="usc"]').count());
  await page.locator('dialog [data-event="usc"]').click();assert.ok((await page.locator('.event-detail').textContent()).includes('16 listopada 2026'));
  assert.ok((await page.locator('.official-source a').getAttribute('href')).includes('#:~:text='));
  assert.equal(await page.locator('.important-icon path').first().getAttribute('stroke'),'#3275e7');
  await page.getByRole('button',{name:'Zamknij',exact:true}).click();await page.locator('#nav-calendar').click();
  assert.equal(await page.locator('.calendar-day').count(),42);assert.equal(await page.locator('.calendar-day.week-child').count()>0,true);
  await page.locator('[data-day="2026-11-16"]').click();await page.locator('.calendar-agenda [data-event="usc"]').first().click();
  await page.locator('#event-done').click();assert.ok((await page.locator('#event-done').textContent()).includes('Cofnij'));
  await page.getByRole('button',{name:'Zamknij',exact:true}).click();
  await page.locator('#month-picker').fill('2026-02');await page.locator('#month-picker').press('Tab');assert.equal(await page.locator('.milestone-conception').count(),7);
  await page.locator('[data-day="2026-02-05"]').click();await page.locator('[data-milestone="conception"]').click();assert.ok((await page.locator('dialog').textContent()).toLowerCase().includes('nie ustala rzeczywistego dnia'));await page.getByRole('button',{name:'Zamknij',exact:true}).click();
  await page.locator('#month-picker').fill('2026-10');await page.locator('#month-picker').press('Tab');await page.locator('[data-day="2026-10-25"]').click();await page.locator('[data-milestone="birth"]').click();assert.ok((await page.locator('dialog').textContent()).includes('08:30'));await page.getByRole('button',{name:'Zamknij',exact:true}).click();
  await page.locator('#calendar-dates').click();await page.locator('#birthCardDate').fill('2099-01-01');await page.getByRole('button',{name:'Zapisz daty',exact:true}).click();assert.ok(await page.locator('#dates-error').textContent());await page.locator('#birthCardDate').fill('2026-10-27');await page.getByRole('button',{name:'Zapisz daty',exact:true}).click();
  const state=await (await page.request.get('http://127.0.0.1:3001/api/catalog')).json();let requests=0;
  await page.route('**/api/refresh',route=>{requests++;return route.fulfill({json:{...state,lastCheckedAt:'2026-11-13T10:00:00Z'}});});
  await page.locator('#refresh-sources').click();await page.getByRole('heading',{name:'Aktualność informacji',exact:true}).waitFor();assert.equal(requests,1);assert.ok((await page.locator('dialog').textContent()).includes('00:00'));await page.getByRole('button',{name:'Zamknij',exact:true}).click();
  for(const size of [{width:320,height:568},{width:430,height:932}]){await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`artifacts/calendar-${size.width}.png`});}
  await page.reload();await page.locator('#nav-calendar').waitFor();await page.locator('#nav-calendar').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ppm-profile-v1')).dates.birthCardDate),'2026-10-27');
  assert.deepEqual(errors,[]);console.log('PASS: same formal cards on map/calendar, exact periods, blue importance icon, official fragments, pregnancy/life weeks, seven-day conception estimate, actual birth time, dates validation/persistence, manual refresh, mobile views.');
}finally{await browser.close();}
