import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
if(!process.env.PRIVATE_CASE_FILE)throw new Error('Wskaż lokalny PDF przez PRIVATE_CASE_FILE.');
const bytes=await readFile(process.env.PRIVATE_CASE_FILE),base='http://localhost:61619';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage({viewport:{width:1440,height:960}});let blocked=0;const errors=[];
page.on('pageerror',()=>errors.push('Błąd przeglądarki'));
await page.route('**/*',r=>{if(!r.request().url().startsWith(base+'/')){blocked++;return r.abort();}if(r.request().method()!=='GET')return r.abort();return r.continue();});
try{
 await page.goto(base);await page.locator('#onboarding-documents').click();await page.locator('#doc-upload-choice').click();await page.locator('#doc-files').setInputFiles({name:'lokalna-sprawa.pdf',mimeType:'application/pdf',buffer:bytes});
 await page.waitForFunction(()=>{const file=document.querySelector('.doc-file>div>span');return file&&/Odczyt zakończony|Wymaga uwagi/.test(file.textContent);},{},{timeout:600000});
 const documentStats=await page.evaluate(()=>({readFinished:document.querySelector('.doc-file>div>span').textContent.includes('Odczyt zakończony'),pageCount:Number(document.querySelector('.doc-file>div>span').textContent.match(/(\d+) stron/)?.[1]),fields:document.querySelectorAll('.doc-field').length,candidates:document.querySelectorAll('.doc-candidate').length,storageUntouched:!localStorage.getItem('ppm-calculator-v1')}));assert.ok(documentStats.readFinished);assert.equal(documentStats.pageCount,20);assert.ok(documentStats.storageUntouched);
 // A separate navigation regression uses explicit test declarations, not values
 // alleged to come from the private PDF. No second PDF is read.
 await page.locator('#doc-options').click();await page.locator('#doc-manual-choice').click();await page.locator('[data-calc-field="familyType"]').selectOption('adoption');await page.locator('[data-calc-field="dateKind"]').selectOption('actual');await page.locator('[data-calc-field="eventDate"]').fill('2026-11-01');
 await page.locator('#integrated-calculator-form button[type=submit]').click();assert.equal(await page.locator('[data-calc-step="0"]').getAttribute('aria-current'),'step');assert.equal(await page.locator('[data-calc-field="childBirthDate"]').getAttribute('aria-invalid'),'true');
 await page.locator('[data-calc-step="2"]').click();assert.equal(await page.locator('[data-calc-step="0"]').getAttribute('aria-current'),'step');
 await page.locator('[data-calc-field="childBirthDate"]').fill('2026-01-01');await page.locator('#integrated-calculator-form button[type=submit]').click();assert.equal(await page.locator('[data-calc-step="0"]').getAttribute('aria-current'),'step');assert.equal(await page.locator('[data-calc-field="adoptionApplicationDate"]').getAttribute('aria-invalid'),'true');
 await page.locator('[data-calc-field="adoptionApplicationDate"]').fill('2026-11-01');await page.locator('#integrated-calculator-form button[type=submit]').click();assert.equal(await page.locator('[data-calc-step="1"]').getAttribute('aria-current'),'step');await page.locator('#integrated-calculator-form button[type=submit]').click();assert.equal(await page.locator('[data-calc-step="2"]').getAttribute('aria-current'),'step');
 assert.equal(blocked,0);assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,document:documentStats,requiredBirthDateBlockedImmediately:true,sidebarCannotSkip:true,requiredCourtDateBlockedImmediately:true,completeSituationReachesPlan:true,externalRequests:blocked}));
}catch{console.log(JSON.stringify({passed:false,message:'Sprawdzenie wymaga poprawki. Treść prywatnego dokumentu nie jest logowana.'}));process.exitCode=1;}finally{await browser.close();}
