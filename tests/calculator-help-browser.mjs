import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {doctorHtml} from '../dist/doctor-view.js';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:61619');await page.locator('#case-skip').click();await page.locator('#nav-doctor').click();assert.equal(await page.locator('#doctor-view a[href="https://www.znanylekarz.pl/"]').count(),1);
 assert.match(doctorHtml({caseStage:'pregnancy'}),/Lekarz prowadzący ciążę/);assert.match(doctorHtml({caseStage:'born'}),/pediatrą/);
 await page.locator('#nav-calculator').click();await page.locator('#calc-documents').waitFor();
 await page.locator('[data-calc-field="familyType"]').selectOption('adoption');await page.locator('[data-calc-field="eventDate"]').fill('2026-11-01');
 await page.locator('[data-calc-step="2"]').click();assert.ok(await page.locator('.calc-field-error').isVisible());assert.equal(await page.locator('[data-calc-field="childBirthDate"]').getAttribute('aria-invalid'),'true');
 await page.locator('[data-calc-field="childBirthDate"]').fill('2026-01-01');await page.locator('[data-calc-field="adoptionApplicationDate"]').fill('2026-11-01');await page.locator('#integrated-calculator-form button[type=submit]').click();await page.locator('[data-calc-field="parents.0.insuranceFrom"]').waitFor({state:'attached'});
 for(const [field,value]of [['insuranceFrom','2026-11-01'],['insuranceTo','2026-10-01']]){const input=page.locator('[data-calc-field="parents.0.'+field+'"]');await input.evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await input.fill(value);}
 await page.locator('#integrated-calculator-form button[type=submit]').click();assert.ok(await page.locator('.calc-field-error').isVisible());assert.equal(await page.locator('[data-calc-field="parents.0.insuranceTo"]').getAttribute('aria-invalid'),'true');
 await page.locator('[data-calc-field="parents.0.insuranceTo"]').fill('2026-12-01');await page.locator('#integrated-calculator-form button[type=submit]').click();assert.equal(await page.locator('[data-calc-step="2"]').getAttribute('aria-current'),'step');
 const duplicate=await page.evaluate(async()=>{const root=document.querySelector('#calculator-view'),{enhanceTerms}=await import('/terms.js');enhanceTerms(root);enhanceTerms(root);const ids=[...root.querySelectorAll('[data-term]')].map(e=>e.dataset.term);return ids.length!==new Set(ids).size;});assert.equal(duplicate,false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,uniqueHelp:true,visibleErrors:true,recovery:true,doctor:true}));
}finally{await browser.close();}
