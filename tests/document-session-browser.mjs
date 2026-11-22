import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage();const external=[];
await page.route('**/*',r=>{if(!r.request().url().startsWith('http://localhost:61619/')){external.push('blocked');return r.abort();}return r.continue();});
try{await page.goto('http://localhost:61619/');const result=await page.evaluate(async()=>{
 const {createDocumentSession}=await import('/document-session.js'),s=createDocumentSession(),fixture=async name=>new File([await(await fetch('/examples/documents/'+name+'.pdf')).blob()],name+'.pdf',{type:'application/pdf'});
 try{
  await s.add([await fixture('haslo')]);const doc=s.current().documents[0],protectedStatus=doc.status;await s.retry(doc.id,'test123');const unlocked=doc.status==='ready'&&s.current().fields.length>0;
  await s.retry(doc.id,'wrong');const wrongPassword=doc.status==='error';await s.retry(doc.id,'test123');
  const oldCase=s.current();s.newCase();await s.add([await fixture('acroform')]);const acro=s.current().fields,acroValid=acro.some(f=>f.field==='basis'&&f.value===6000)&&!acro.some(f=>f.field==='life');
  s.select(oldCase.id);const target=s.cases[1];s.move(doc.id,target.id);const moved=s.current().documents.length===0&&target.documents.length===2;
  s.select(target.id);s.clear();const cleared=s.current().fields.length===0&&s.current().documents.length===0;
  let rejected=false;try{await s.add([new File(['not a PDF'],'bad.pdf',{type:'application/pdf'})]);}catch{rejected=true;}
  return {protectedStatus,unlocked,wrongPassword,acroValid,moved,cleared,rejected};
 }finally{s.dispose();}
});assert.equal(result.protectedStatus,'error');for(const [key,value]of Object.entries(result).filter(([k])=>k!=='protectedStatus'))assert.equal(value,true,key);assert.deepEqual(external,[]);console.log(JSON.stringify({passed:true,...result,externalRequests:external.length}));}finally{await browser.close();}
