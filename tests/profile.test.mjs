import { test } from 'node:test';
import assert from 'node:assert/strict';
import {cleanName,validateName,normalizeProfile,markOpened,usageDays} from '../dist/profile.js';
const now='2026-11-10T12:00:00.000Z';
test('names support Polish and international letters, multiple names, hyphens and apostrophes',()=>{
  for(const name of ['Rafał','Anna Maria Żółć-Kowalska','Jean-Luc O’Neill','D’Arcy','李 小明','Zofia ʼAla',''])assert.equal(validateName(name),name);
  assert.equal(validateName('  Anna   Maria  '),'Anna Maria');
  assert.equal(validateName('a'.repeat(200)).length,200);
  assert.throws(()=>validateName('a'.repeat(201)));
  for(const name of ['Rafał1','A@B','Ola!','<script>','🙂','---'])assert.throws(()=>validateName(name));
  assert.equal(cleanName('Rafał1@! – Anna'),'Rafał  Anna');
});
test('migration preserves existing ages without inventing a first-use date',()=>{
  const p=normalizeProfile({mode:'child',anchor:'2026-10-01'},{now});
  assert.equal(p.anchor,'2026-10-01');assert.equal(p.gender,'unspecified');assert.equal(p.name,'');
  assert.equal(p.firstUsedAt,null);assert.equal(p.statsStartedAt,now);assert.deepEqual(p.openedStages,[]);
});
test('new profiles record first use and identity survives mode and age corrections',()=>{
  const p=normalizeProfile({mode:'pregnancy',anchor:'2026-10-01',name:'Rafał',gender:'boy'},{now,isNew:true});
  assert.equal(p.firstUsedAt,now);
  const changed=normalizeProfile({...p,mode:'child',anchor:'2026-11-10'},{now});
  assert.equal(changed.name,'Rafał');assert.equal(changed.gender,'boy');assert.equal(changed.firstUsedAt,now);
});
test('opened points count once per route, regardless of repeat visits',()=>{
  let p=normalizeProfile({mode:'pregnancy',anchor:'2026-10-01'},{now,isNew:true});
  p=markOpened(p,1);p=markOpened(p,1);p=markOpened(p,2);
  p=markOpened({...p,mode:'child'},1);assert.equal(p.openedStages.length,3);
  const cleaned=normalizeProfile({...p,openedStages:[...p.openedStages,'child:53','pregnancy:0','pregnancy:43','child:1']},{now});
  assert.equal(cleaned.openedStages.length,3);
  assert.equal(usageDays({...p,statsStartedAt:'2026-11-09T12:00:00Z'},'2026-11-10'),2);
});
