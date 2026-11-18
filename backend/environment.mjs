import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';

// Environment supplied by a container takes precedence over the local secret file.
export function loadBackendEnvironment(target=process.env,file=new URL('./.env',import.meta.url)) {
  try {
    const values=parseEnv(readFileSync(file,'utf8'));
    for(const [key,value] of Object.entries(values))if(target[key]===undefined)target[key]=value;
  } catch(error) {
    if(error.code!=='ENOENT')throw new Error('Nie udało się wczytać konfiguracji backendu.');
  }
  return target;
}
