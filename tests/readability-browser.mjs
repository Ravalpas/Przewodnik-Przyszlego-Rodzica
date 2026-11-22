import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const url=process.env.TEST_URL||'http://localhost:61619',errors=[];
const size=async(page,selector)=>page.locator(selector).first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
try{
  for(const viewport of [{width:1800,height:1000},{width:1366,height:900},{width:1440,height:720},{width:1024,height:768},{width:390,height:844},{width:320,height:640}]){
    const page=await browser.newPage({viewport,locale:'pl-PL',timezoneId:'Europe/Warsaw'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      localStorage.setItem('ppm-test-reset','fresh-start-2026-11-22.1');
      localStorage.setItem('ppm-profile-v1',JSON.stringify({mode:'pregnancy',anchor:'2026-10-24',parentRole:'mother',gender:'girl',name:'Anna Maria',firstUsedAt:'2026-11-20T12:00:00Z',statsStartedAt:'2026-11-20T12:00:00Z'}));
      localStorage.setItem('ppm-calendar-notes-v1',JSON.stringify({version:1,notes:[{id:'visit',date:'2026-11-25',time:'14:30',text:'Wizyta kontrolna — zabrać listę pytań',color:'blue'}]}));
    });
    await page.route('**/api/chat',()=>{throw new Error('Test wyglądu nie powinien wysyłać zapytań do modelu.');});
    await page.goto(url);await page.locator('.map-node.current').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(viewport.width>=900){
      assert.equal(Math.round((await page.locator('#app').boundingBox()).width),viewport.width);
      assert.ok((await page.locator('.brand img').boundingBox()).width>=52);
      assert.ok((await page.locator('.app-header').boundingBox()).height<220);
      assert.ok(await size(page,'.bottom-nav .nav-item')>=15);
      if(viewport.width>=1100){
        const left=await page.locator('.journey-aside-left').boundingBox(),map=await page.locator('.map-canvas').boundingBox(),right=await page.locator('.journey-aside-right').boundingBox();
        assert.ok(left.x+left.width<=map.x);assert.ok(map.x+map.width<=right.x);assert.ok(left.width>=300);
      }
      await page.screenshot({path:`artifacts/readability-road-${viewport.width}.png`});
    }
    await page.locator('.map-node.current').click();
    await page.locator('dialog [data-event="pregnancy-zus-insurance"]').first().click();
    assert.ok(await size(page,'.event-detail p')>=(viewport.width>=900?18:16), 'event text at '+viewport.width+': '+await size(page,'.event-detail p'));
    assert.ok(await size(page,'.official-source small')>=13);
    assert.ok(await size(page,'.official-source a')>=16);
    if(viewport.width===1800)await page.screenshot({path:'artifacts/readability-event.png'});
    await page.locator('#close-sheet').click();
    await page.locator('#nav-calendar').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(viewport.width>=900){
      const left=await page.locator('.calendar-month').boundingBox(),right=await page.locator('.calendar-detail').boundingBox();assert.ok(right.x>left.x+left.width);
      assert.ok(await size(page,'.calendar-day>span')>=20);
      await page.screenshot({path:`artifacts/readability-calendar-${viewport.width}.png`});
    }
    await page.locator('#nav-chat').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.locator('.chat-suggestions button').count(),4);
    assert.ok(await size(page,'.chat-welcome p')>=16);
    if(viewport.width>=900){
      const intro=await page.locator('.chat-welcome-intro').boundingBox(),suggestions=await page.locator('.chat-suggestions').boundingBox(),messages=await page.locator('.chat-messages').boundingBox();
      assert.ok(suggestions.x>intro.x+intro.width);
      assert.ok(suggestions.y+suggestions.height<=messages.y+messages.height+2,'All four suggestions should fit above the composer on a laptop.');
      assert.ok((await page.locator('.chat-toolbar').boundingBox()).height<80);
    }
    await page.screenshot({path:`artifacts/readability-chat-${viewport.width}.png`});
    await page.locator('#nav-doctor').click();assert.ok(await size(page,'.doctor-options p')>=16);
    await page.locator('#nav-profile').click();assert.ok(await size(page,'.profile-hero p')>=14);
    await page.locator('#close-sheet').click();
    await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: full-width desktop, enlarged brand and controls, readable cards/profile/calendar, useful side panels without road overlap, compact chat toolbar and four visible suggestions, laptop and 320/390px mobile layouts. Model requests: 0.');
}finally{await browser.close();}
