import {readdir,mkdir,copyFile,stat,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),target=resolve(root,'.cloudflare/assets');
let count=0,largest=0;
async function copy(source,destination){await mkdir(destination,{recursive:true});for(const e of await readdir(source,{withFileTypes:true})){
 if(e.name.startsWith('.')||e.name==='server')continue;
 if(e.isSymbolicLink())throw new Error('Dowiązanie w zasobach.');
 const from=resolve(source,e.name),to=resolve(destination,e.name);
 if(e.isDirectory())await copy(from,to);else{const size=(await stat(from)).size;if(size>25*1024*1024)throw new Error('Zasób przekracza 25 MiB: '+e.name);await copyFile(from,to);count++;largest=Math.max(largest,size);}
}}
if(target!==resolve(root,'.cloudflare','assets'))throw new Error('Nieprawidłowy katalog wyjściowy.');
await rm(target,{recursive:true,force:true});
await copy(resolve(root,'dist'),target);
if(count>20000)throw new Error('Przekroczony limit plików Free.');
console.log(JSON.stringify({assets:count,largestBytes:largest,embeddedAssets:false}));
