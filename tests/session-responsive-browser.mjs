import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base='http://localhost:61619',browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const errors=[],results=[];
try{
 const context=await browser.newContext({locale:'pl-PL'});
 for(const width of [320,390,768,1024,1440]){
  const page=await context.newPage({viewport:{width,height:900}});await page.setViewportSize({width,height:900});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.evaluate(()=>{localStorage.setItem('ppm-profile-v1','old-person');localStorage.setItem('ppm-calendar-notes-v1','old-notes');localStorage.setItem('ppm-bielik-conversations-v1','old-chat');localStorage.setItem('unrelated-setting','preserve');});await page.reload();await page.locator('#case-profile-form').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('ppm-profile-v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('ppm-calendar-notes-v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('ppm-bielik-conversations-v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-setting')),'preserve');
  const check=async selector=>{const value=await page.locator(selector).evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(value.scroll<=value.width+2,selector+' overflows at '+width+': '+JSON.stringify(value));};
  await check('.case-onboarding');await page.locator('#case-skip').click();assert.equal(await page.locator('[data-nav]').count(),6);assert.equal(await page.locator('#nav-chat').count(),0);assert.equal(await page.locator('.doctor-launcher').count(),0);
  for(const tab of ['guide','calculator','calendar','documents','profile']){await page.locator('#nav-'+tab).click();await page.locator('.workspace-main').waitFor();if(tab==='calculator')await page.locator('#calc-documents').waitFor();await check('.workspace-main');await check('.phone-shell');const nav=await page.locator('.bottom-nav').boundingBox();assert.ok(width<900?nav.y>700:nav.x<2,'navigation placement');if(width===390)await page.screenshot({path:'artifacts/mobile-current-'+tab+'.png'});}
  // Notes and drafts survive tab navigation inside this page but never a reload.
  await page.locator('#nav-calendar').click();await page.locator('#note-add').click();await page.locator('#note-text').fill('Notatka wyłącznie bieżącej sesji');await page.locator('#note-form button[type=submit]').click();await page.locator('#sheet').waitFor({state:'hidden'});assert.ok((await page.locator('#calendar-view').textContent()).includes('Notatka wyłącznie bieżącej sesji'));
  await page.locator('#nav-calculator').click();await page.locator('[data-calc-field="eventDate"]').fill('2026-11-01');await page.locator('#nav-calendar').click();assert.ok((await page.locator('#calendar-view').textContent()).includes('Notatka wyłącznie bieżącej sesji'));await page.locator('#nav-calculator').click();assert.equal(await page.locator('[data-calc-field="eventDate"]').inputValue(),'2026-11-01');
  assert.equal(await page.evaluate(()=>localStorage.getItem('ppm-calculator-v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('ppm-profile-v1')),null);
  await page.reload();await page.locator('#case-profile-form').waitFor();assert.equal(await page.locator('.bottom-nav').count(),0);
  await page.locator('#case-skip').click();await page.close();const reopened=await context.newPage();await reopened.goto(base);await reopened.locator('#case-profile-form').waitFor();assert.equal(await reopened.locator('.bottom-nav').count(),0);await reopened.close();results.push({width,passed:true});
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,viewports:results,newAfterReload:true,newAfterClosingPage:true,temporaryNotesAndDrafts:true,chatRemoved:true,uncaught:errors}));await context.close();
}catch(e){console.log(JSON.stringify({passed:false,error:e.message,uncaught:errors}));process.exitCode=1;}finally{await browser.close();}
