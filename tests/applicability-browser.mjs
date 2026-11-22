import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ppm-profile-v1')));
const close=()=>page.getByRole('button',{name:'Zamknij',exact:true}).click();
await page.clock.install({time:new Date('2026-11-16T10:00:00+01:00')});
await page.addInitScript(()=>{localStorage.setItem('ppm-test-reset','fresh-start-2026-11-22.1');if(!localStorage.getItem('ppm-profile-v1'))localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'child',anchor:'2026-11-15',name:'Rafał',dates:{birthCardDate:'2026-11-15',peselDate:'2026-11-15'}}));});
try{
  await page.goto('http://127.0.0.1:3001');await page.locator('.map-node.current').waitFor();await page.locator('.map-node.current').click();
  assert.deepEqual(await page.locator('.stage-events>[data-task-group]').evaluateAll(nodes=>nodes.map(n=>n.dataset.taskGroup)),['required','recommended','optional']);
  assert.equal(await page.locator('[data-task-group="required"] [data-event="800-newborn"]').count(),0);
  assert.equal(await page.locator('[data-task-group="optional"] [data-event="800-newborn"]').count(),1);
  await page.screenshot({path:'artifacts/tasks-grouped.png'});
  await page.locator('dialog [data-event="usc"]').click();assert.equal(await page.locator('#event-not-applicable').count(),0);assert.ok((await page.locator('.event-kind').textContent()).includes('Obowiązkowe'));await close();
  await page.locator('.map-node.current').click();await page.locator('dialog [data-event="vaccine-newborn"]').click();assert.equal(await page.locator('#event-not-applicable').count(),0);await close();
  await page.locator('.map-node.current').click();await page.locator('dialog [data-event="krus-benefit"]').click();
  assert.equal(await page.locator('#event-not-applicable').textContent(),'Nie dotyczy');assert.equal(await page.locator('.event-kind .important-icon').count(),0);
  assert.ok(await page.locator('#event-not-applicable').evaluate(el=>el.compareDocumentPosition(document.querySelector('#event-done'))&Node.DOCUMENT_POSITION_PRECEDING));
  await page.screenshot({path:'artifacts/benefit-actions.png'});
  await page.locator('#event-done').click();assert.ok((await data()).completedTasks.includes('krus-benefit'));
  await page.locator('#event-not-applicable').click();assert.ok((await data()).notApplicableTasks.includes('krus-benefit'));assert.equal((await data()).completedTasks.includes('krus-benefit'),false);
  assert.equal(await page.locator('.not-applicable-notice').isVisible(),true);await close();
  await page.locator('.map-node.current').click();assert.equal(await page.locator('.task-group [data-event="krus-benefit"]').count(),0);assert.equal(await page.locator('.excluded-tasks [data-event="krus-benefit"]').isVisible(),false);await close();
  await page.locator('#nav-calendar').click();
  assert.deepEqual(await page.locator('.calendar-agenda').first().locator('[data-task-group]').evaluateAll(nodes=>nodes.map(n=>n.dataset.taskGroup)),['required','recommended','optional']);
  assert.equal(await page.locator('.period-row[data-event="krus-benefit"]').count(),0);
  await page.locator('#calendar-view .excluded-tasks summary').click();await page.locator('#calendar-view .excluded-tasks [data-event="krus-benefit"]').click();await page.locator('#event-not-applicable').click();assert.equal((await data()).notApplicableTasks.includes('krus-benefit'),false);await close();
  assert.ok(await page.locator('.period-row[data-event="krus-benefit"]').count());
  await page.locator('.period-row[data-event="krus-benefit"]').click();await page.locator('#event-not-applicable').click();await close();await page.reload();await page.locator('.map-node.current').waitFor();assert.ok((await data()).notApplicableTasks.includes('krus-benefit'));
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('ppm-profile-v1'));p.notApplicableTasks.push('usc');localStorage.setItem('ppm-profile-v1',JSON.stringify(p));});await page.reload();await page.locator('.map-node.current').waitFor();assert.equal((await data()).notApplicableTasks.includes('usc'),false);
  for(const size of [{width:320,height:568},{width:430,height:932}]){await page.setViewportSize(size);await page.locator('.map-node.current').click();await page.screenshot({path:`artifacts/task-groups-${size.width}.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await close();}
  assert.deepEqual(errors,[]);console.log('PASS: mandatory-first groups on map/calendar; optional benefits use neutral icons; required matters have no dismissal; button order; skip/completion exclusivity; hidden periods; restore; persistence; protected legacy values; mobile widths.');
}finally{await browser.close();}
