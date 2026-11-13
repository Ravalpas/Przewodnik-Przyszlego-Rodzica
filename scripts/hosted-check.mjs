// Service credential is accepted on hidden stdin and is never persisted or printed.
const input=await new Promise((resolve,reject)=>{
  let value='';const terminal=process.stdin.isTTY;
  function finish(error){process.stdin.off('data',onData);if(terminal)process.stdin.setRawMode(false);process.stdin.pause();error?reject(error):resolve(value);}
  function onData(chunk){value+=chunk;if(value.includes('\u0003'))finish(new Error('Cancelled'));else if(value.length>65536)finish(new Error('Input too large'));else if(/[\r\n]/.test(value))finish();}
  if(terminal)process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');process.stdin.on('data',onData);process.stdin.resume();console.log('Ready for hidden service access JSON.');
});
const {url,token,action='read'}=JSON.parse(input),base=new URL(url);
if(base.protocol!=='https:'||!base.hostname.endsWith('.chatgpt.site'))throw new Error('Expected the selected Site HTTPS URL.');
const headers={'OAI-Sites-Authorization':`Bearer ${token}`,'Content-Type':'application/json'};
const endpoint=action==='refresh'?'/api/scheduled-refresh':'/api/catalog';
const r=await fetch(new URL(endpoint,base),{method:action==='refresh'?'POST':'GET',headers,...(action==='refresh'?{body:'{}'}:{})});
const text=await r.text();let data;try{data=JSON.parse(text);}catch{console.log(JSON.stringify({status:r.status,error:'Response was not JSON',excerpt:text.slice(0,150)}));process.exit(1);}
if(!r.ok){console.log(JSON.stringify({status:r.status,error:data.error}));process.exit(1);}
const counts={};for(const source of Object.values(data.sources||{}))counts[source.status]=(counts[source.status]||0)+1;
console.log(JSON.stringify({status:r.status,lastCheckedAt:data.lastCheckedAt,nextCheckAt:data.nextCheckAt,version:data.catalog?.version,cards:data.catalog?.events?.length,sources:data.catalog?.sources?.length,counts,problems:Object.entries(data.sources||{}).filter(([,s])=>s.status!=='ok').map(([id,s])=>({id,status:s.status,error:s.lastError})),history:data.history?.slice(0,3)}));
