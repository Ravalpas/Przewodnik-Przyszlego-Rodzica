import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
// Read-only filesystem check; no Git operations or external calls.
async function inspect(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
 if(entry.name==='vendor')continue;const path=resolve(dir,entry.name);
 if(entry.isDirectory()){await inspect(path);continue;}
 if(/^\.env(?:\.|$)/.test(entry.name))throw new Error('Plik konfiguracyjny nie może trafić do zasobów aplikacji.');
 if(!/\.(?:js|mjs|html|json)$/.test(entry.name))continue;
 const text=await readFile(path,'utf8');
 if(/\b(?:sk|gsk)-[A-Za-z0-9_-]{24,}\b/.test(text))throw new Error('Wykryto potencjalny sekret w zasobach aplikacji.');
}}
await inspect(resolve(root,'dist'));
console.log('PASS: zasoby aplikacji nie zawierają plików .env ani rozpoznanych wzorców kluczy.');
