// Optional local acceptance check. Never copies originals, text, names or outcomes.
import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=resolve(process.env.PRIVATE_CASE_ROOT||'../Sprawy');
async function collect(dir){const result=[];for(const item of await readdir(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory())result.push(...await collect(path));else if(/\.pdf$/i.test(item.name))result.push({path,size:(await stat(path)).size});}return result;}
const files=(await collect(root)).sort((a,b)=>a.size-b.size);if(!files.length)throw new Error('Brak lokalnych dokumentów do testu.');const bytes=await readFile(files[0].path);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage();let blocked=0;
await page.route('**/*',route=>{if(!route.request().url().startsWith('http://localhost:61619/')||route.request().method()!=='GET'){blocked++;return route.abort();}return route.continue();});
try{await page.goto('http://localhost:61619/');const result=await page.evaluate(async data=>{
 const {createDocumentSession}=await import('/document-session.js'),s=createDocumentSession(),before=JSON.stringify(localStorage);
 try{const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));await s.add([new File([bytes],'lokalna-sprawa.pdf',{type:'application/pdf'})]);const c=s.current(),d=c.documents[0];return {ready:d.status==='ready',pages:d.pageCount,ocrPages:d.pages.filter(p=>p.method==='ocr'||p.method==='mixed').length,recognizedFields:c.fields.length,storageUntouched:JSON.stringify(localStorage)===before};}finally{s.dispose();}
},bytes.toString('base64'));assert.ok(result.ready);assert.ok(result.ocrPages>0);assert.ok(result.storageUntouched);assert.equal(blocked,0);console.log(JSON.stringify({passed:true,...result,externalOrUploadRequests:blocked}));}catch{console.log(JSON.stringify({passed:false,message:'Lokalny test prywatnego zestawu wymaga sprawdzenia; szczegóły treści nie są logowane.'}));process.exitCode=1;}finally{await browser.close();}
