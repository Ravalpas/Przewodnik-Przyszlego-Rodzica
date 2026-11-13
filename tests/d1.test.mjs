import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {d1Store} from '../backend/d1-store.mjs';
test('the exact hosted SQL migration, persistent store and multi-instance lease work in SQLite',async()=>{
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(await readFile(new URL('../drizzle/0000_source_monitor.sql',import.meta.url),'utf8'));
  const db={prepare:sql=>({bind:(...args)=>({first:async()=>sqlite.prepare(sql).get(...args),run:async()=>sqlite.prepare(sql).run(...args)})})};
  const first=d1Store(db),second=d1Store(db);assert.equal(await first.read(),null);
  await first.write({catalog:{version:'1'},history:[]});assert.equal((await second.read()).catalog.version,'1');
  const lease=await first.acquire();assert.ok(lease);assert.equal(await second.acquire(),null);
  await second.release('wrong');assert.equal(await second.acquire(),null);
  await first.release(lease);const lease2=await second.acquire();assert.ok(lease2);await second.release(lease2);sqlite.close();
});
