import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseEnv} from 'node:util';
const secretRoot=resolve(import.meta.dirname,'..');
let secret;
try{secret=parseEnv(await readFile(resolve(secretRoot,'backend/.env'),'utf8')).FABRYKA_API_KEY;}catch(error){if(error.code!=='ENOENT')throw error;}
if(!secret){console.log('Kontrola sekretów: lokalny klucz nie jest ustawiony.');process.exit(0);}
const patterns=[secret,Buffer.from(secret).toString('base64'),encodeURIComponent(secret)].map(s=>Buffer.from(s));
const files=new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:secretRoot,encoding:'utf8'}).split('\0').filter(Boolean));
async function staticFiles(dir,prefix='dist') {for(const item of await readdir(dir,{withFileTypes:true})){const name=`${prefix}/${item.name}`;if(item.isDirectory())await staticFiles(resolve(dir,item.name),name);else files.add(name);}}
await staticFiles(resolve(secretRoot,'dist'));
for(const file of files){let data;try{data=await readFile(resolve(secretRoot,file));}catch(error){if(error.code==='ENOENT')continue;throw error;}if(patterns.some(value=>data.includes(value)))throw new Error(`Wykryto klucz w pliku przeznaczonym do publikacji: ${file}`);}
const tracked=execFileSync('git',['ls-files','--','backend/.env'],{cwd:secretRoot,encoding:'utf8'}).trim();
if(tracked)throw new Error('Plik backend/.env nie może być śledzony przez Git.');
console.log('PASS: klucz nie występuje w źródłach Git, plikach frontendu ani paczce serwera.');
