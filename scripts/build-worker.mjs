import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..'),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json'};
const assets={};
async function collect(dir,prefix=''){
  for(const item of await readdir(dir,{withFileTypes:true})){
    if(item.name.startsWith('.')||item.name==='server')continue;
    if(item.isSymbolicLink())throw new Error('Dowiązania nie mogą trafiać do paczki aplikacji.');
    const name=`${prefix}/${item.name}`,file=resolve(dir,item.name);
    if(item.isDirectory())await collect(file,name);else assets[name]={type:types[extname(item.name)]||'application/octet-stream',data:(await readFile(file)).toString('base64')};
  }
}
await collect(resolve(root,'dist'));
const catalog=await readFile(resolve(root,'dist/data/catalog.json'),'utf8');
const calculatorSeed=await readFile(resolve(root,'dist/data/calculator-rules.json'),'utf8');
let code=`const CATALOG=${catalog};\nconst CALCULATOR_SEED=${calculatorSeed};\nconst ASSETS=${JSON.stringify(assets)};\n`;
for(const name of ['dist/polish.js','dist/age.js','dist/source-scope.js','dist/event-policy.js','dist/timeline.js','dist/chat-policy.js','dist/notes.js','dist/chat-notes.js','dist/calculator-params.js','dist/calculator-core.js','dist/calculator-family.js','dist/calculator-other.js','dist/calculator-engine.js','backend/calculator-simulations.mjs','backend/monitor.mjs','backend/d1-store.mjs','backend/fabryka.mjs','backend/bielik.mjs','backend/api.mjs','worker/index.mjs']){
  const source=await readFile(resolve(root,name),'utf8');
  code+='\n'+source.replace(/^import .*;\r?\n/gm,'').replace(/^export (async function|function|const|class) /gm,'$1 ');
}
await mkdir(resolve(root,'dist/server'),{recursive:true});await writeFile(resolve(root,'dist/server/index.js'),code);
await mkdir(resolve(root,'dist/.openai'),{recursive:true});await writeFile(resolve(root,'dist/.openai/hosting.json'),await readFile(resolve(root,'.openai/hosting.json')));
console.log(`Worker: ${Object.keys(assets).length} plików, ${(Buffer.byteLength(code)/1048576).toFixed(2)} MB.`);
