import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base='http://localhost:61619';const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[],external=[],posts=[];
page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{const request=route.request();if(!request.url().startsWith(base+'/')){external.push(new URL(request.url()).origin);return route.abort();}if(request.method()==='POST'){posts.push(request.url());return route.abort();}return route.continue();});
try{
 await page.goto(base);await page.waitForSelector('#onboarding-documents');await page.click('#onboarding-documents');await page.click('#doc-upload-choice');
 await page.locator('#doc-files').setInputFiles(['wniosek','podstawa','ubezpieczenie','decyzja'].map(n=>'dist/examples/documents/'+n+'.pdf'));
 await page.waitForFunction(()=>document.querySelectorAll('.doc-file').length===4&&[...document.querySelectorAll('.doc-file')].every(x=>x.textContent.includes('Odczyt zakończony')),{},{timeout:90000});
 assert.ok(await page.locator('.doc-field').count()>5);assert.equal(await page.locator('.doc-field').filter({hasText:'Kwota przyznana'}).count(),0);
 await page.locator('[data-preview]').first().click();await page.waitForFunction(()=>!document.querySelector('#doc-canvas').hidden);assert.ok(await page.locator('#doc-canvas').evaluate(c=>c.width>300));
 await page.locator('#doc-files').setInputFiles('dist/examples/documents/wniosek.pdf');await page.waitForFunction(()=>document.querySelector('#doc-list').textContent.includes('Ten sam dokument'));assert.equal(await page.locator('.doc-file').count(),4);
 // OCR must use local workers, WASM and Polish/English models, never a CDN.
 await page.locator('#doc-files').setInputFiles('dist/examples/documents/skan.pdf');await page.waitForFunction(()=>[...document.querySelectorAll('.doc-file')].some(x=>x.textContent.includes('skan.pdf')&&/Odczyt zakończony|Wymaga uwagi/.test(x.textContent)),{},{timeout:120000});
 const scan=await page.locator('.doc-file').filter({hasText:'skan.pdf'}).textContent();assert.ok(scan.includes('Odczyt zakończony'),scan);
 assert.ok((await page.locator('#doc-fields').textContent()).includes('2024-02-01')||await page.locator('[data-value][value="2024-02-01"]').count()>0,'Polish scan date extracted');
 // Confirm the original four-file case; the scan is a separate person and is removed.
 await page.locator('.doc-file').filter({hasText:'skan.pdf'}).locator('[data-remove]').click();
 for(const select of await page.locator('[data-doc-owner]').all())await select.selectOption('0');
 for(const label of ['Faktyczna data porodu','Liczba dzieci z jednego porodu','Podstawa wymiaru zasiłku','Chorobowe:','Początek ubezpieczenia chorobowego','Rodzaj tytułu ubezpieczenia']){const card=page.locator('.doc-field').filter({has:page.locator('.doc-field-title strong').filter({hasText:label})}).first();await card.locator('[data-use]').check();}
 await page.locator('#doc-confirm').check();await page.locator('#doc-replace').check();await page.locator('#doc-apply').click();await page.locator('#calc-documents').waitFor();
 await page.locator('[data-calc-step="3"]').click();await page.locator('#calc-save').waitFor();assert.ok((await page.locator('#calculator-view').textContent()).includes('28'));assert.equal(posts.length,0,'document calculation stays local');
 await page.locator('#calc-documents').click();await page.locator('#doc-reference').evaluate(el=>el.open=true);await page.locator('#doc-ref-start').fill('2026-11-01');await page.locator('#doc-ref-end').fill('2027-03-20');await page.locator('#doc-ref-comparable').check();await page.locator('#doc-ref-run').click();assert.ok((await page.locator('#doc-ref-result').textContent()).includes('Różnica: 0.00'));
 await page.locator('#doc-close').click();page.once('dialog',d=>d.accept());await page.locator('#calc-save').click();assert.equal(await page.locator('.calc-saved-case').count(),1);assert.equal(await page.evaluate(()=>localStorage.getItem('ppm-calculator-v1')),null);
 await page.locator('#calc-documents').click();await page.setViewportSize({width:390,height:844});await page.locator('[data-preview]').first().click();await page.waitForFunction(()=>!document.querySelector('#doc-canvas').hidden);assert.ok(await page.locator('#doc-canvas').evaluate(c=>c.getBoundingClientRect().width<390));await page.screenshot({path:'artifacts/document-workspace-mobile.png'});await page.setViewportSize({width:1440,height:960});
 assert.deepEqual(external,[]);assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);
 const stored=await page.evaluate(()=>JSON.stringify(localStorage));assert.ok(!stored.includes('Przykładowa')&&!stored.includes('Żółkiewska'));
 await page.screenshot({path:'artifacts/document-workspace-desktop.png',fullPage:false});
 console.log(JSON.stringify({passed:true,localText:true,multiDocument:true,localPolishOCR:true,preview:true,duplicateDetection:true,externalRequests:external.length,posts:posts.length,uncaught:errors}));
}catch(e){console.log(JSON.stringify({error:e.message,uncaught:errors,external,files:await page.locator('#doc-list').innerText().catch(()=>''),fields:await page.locator('.doc-field').count()}));await page.screenshot({path:'artifacts/document-failure.png'});throw e;}finally{await browser.close();}
