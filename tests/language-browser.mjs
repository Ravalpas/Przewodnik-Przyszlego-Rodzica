import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pl-PL',timezoneId:'Europe/Warsaw'});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.clock.install({time:new Date('2026-11-16T12:00:00+01:00')});
try{
  await page.goto('http://127.0.0.1:3001');
  await page.locator('[data-mode="child"]').waitFor();
  await page.locator('.choice-symbol img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  assert.equal(await page.locator('.choice-symbol img').count(),2);
  for(const width of [320,390,430]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`artifacts/onboarding-language-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{window.originalChoice=document.querySelector('[data-mode="child"]');});
  await page.locator('[data-mode="child"]').click();
  assert.equal(await page.evaluate(()=>window.originalChoice===document.querySelector('[data-mode="child"]')),true);
  await page.locator('#continue').click();
  assert.equal(await page.locator('#age-value').inputValue(),'');
  assert.equal(await page.locator('#age-unit').inputValue(),'');
  for(const [value,label] of [['1','pełny tydzień życia'],['2','pełne tygodnie życia'],['5','pełnych tygodni życia'],['12','pełnych tygodni życia'],['22','pełne tygodnie życia']]){
    await page.locator('#age-value').fill(value);
    assert.equal(await page.locator('#age-unit option[value="weeks"]').textContent(),label);
  }
  await page.locator('#age-value').fill('3');
  assert.equal(await page.locator('#age-unit option[value="months"]').textContent(),'pełne miesiące życia');
  await page.locator('#age-value').fill('1');await page.locator('#age-unit').selectOption('days');
  assert.equal(await page.locator('#age-unit option[value="days"]').textContent(),'dzień życia');
  await page.locator('button[type="submit"]').click();await page.locator('.map-node.current').waitFor();
  await page.locator('#nav-profile').click();
  assert.match(await page.locator('.usage-stats').textContent(),/Dzień z aplikacją/);
  await page.locator('#profile-settings').click();await page.locator('#correct-age').click();
  await page.locator('#age-value').fill('2');await page.locator('#age-unit').selectOption('weeks');
  assert.equal(await page.locator('#age-unit option:checked').textContent(),'pełne tygodnie życia');
  await page.locator('#anchor-date').fill('2026-11-15');
  assert.equal(await page.locator('#age-unit option:checked').textContent(),'dzień życia');
  await page.locator('#close-sheet').click();

  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('ppm-profile-v1'));localStorage.setItem('ppm-profile-v1',JSON.stringify({...p,anchor:'2026-11-01',dates:{birthCardDate:'2026-11-02',peselDate:'2026-11-10'}}));});
  await page.reload();await page.locator('.map-node.current').click();
  assert.match(await page.locator('[data-event="insurance"]').textContent(),/Do końca okresu: 1 dzień/);
  await page.locator('[data-event="krus-benefit"]').click();
  assert.equal(await page.locator('.official-source blockquote').count(),0);
  assert.match(await page.locator('.event-range').textContent(),/Okres w kalendarzuOd 1 listopada 2026 do 1 lutego 2027/);
  assert.match(await page.locator('.official-source a').getAttribute('href'),/#:~:text=3%20miesi%C4%99cy/);
  assert.equal(await page.locator('#event-not-applicable').count(),1);
  await page.screenshot({path:'artifacts/krus-language-390.png',fullPage:true});
  await page.locator('#close-sheet').click();await page.locator('.map-node.current').click();
  await page.locator('[data-event="insurance"]').click();assert.equal(await page.locator('#event-not-applicable').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: new onboarding art at 320/390/430px; blank inputs; in-place selection; Polish inflections in onboarding, corrections, profile and deadline cards; explicit date periods; source fragment preserved without bare quote; mandatory protection retained.');
}finally{await browser.close();}
