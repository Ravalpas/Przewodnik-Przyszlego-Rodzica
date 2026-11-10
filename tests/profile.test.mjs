import { test } from 'node:test';
import assert from 'node:assert/strict';
import {cleanName,validateName,normalizeProfile,completedStages,usageDays} from '../dist/profile.js';
import { resetForFreshStart,RESET_KEY,RESET_REVISION } from '../dist/reset.js';
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
  assert.equal(p.firstUsedAt,null);assert.equal(p.statsStartedAt,now);assert.equal('openedStages' in p,false);
});
test('new profiles record first use and identity survives mode and age corrections',()=>{
  const p=normalizeProfile({mode:'pregnancy',anchor:'2026-10-01',name:'Rafał',gender:'boy'},{now,isNew:true});
  assert.equal(p.firstUsedAt,now);
  const changed=normalizeProfile({...p,mode:'child',anchor:'2026-11-10'},{now});
  assert.equal(changed.name,'Rafał');assert.equal(changed.gender,'boy');assert.equal(changed.firstUsedAt,now);
});
test('completed stages follow elapsed weeks and include all pregnancy points after birth',()=>{
  assert.equal(completedStages({mode:'pregnancy',anchor:'2026-11-10'},'2026-11-10'),0);
  assert.equal(completedStages({mode:'pregnancy',anchor:'2026-10-20'},'2026-11-10'),3);
  assert.equal(completedStages({mode:'child',anchor:'2026-11-10'},'2026-11-10'),42);
  assert.equal(completedStages({mode:'child',anchor:'2026-10-20'},'2026-11-10'),45);
  assert.equal(completedStages({mode:'child',anchor:'2024-01-01'},'2026-11-10'),94);
  const p=normalizeProfile({mode:'child',anchor:'2026-10-20',openedStages:['child:1']},{now});
  assert.equal('openedStages' in p,false);assert.equal(completedStages(p,'2026-11-10'),45);
  assert.equal(usageDays({...p,statsStartedAt:'2026-11-09T12:00:00Z'},'2026-11-10'),2);
});
test('the authorized reset clears only the app profile and runs once',()=>{
  const values=new Map([['ppm-profile-v1','old profile'],['unrelated','keep']]);
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  assert.equal(resetForFreshStart(storage),true);assert.equal(values.has('ppm-profile-v1'),false);
  assert.equal(values.get('unrelated'),'keep');assert.equal(values.get(RESET_KEY),RESET_REVISION);
  storage.setItem('ppm-profile-v1','new profile');assert.equal(resetForFreshStart(storage),false);
  assert.equal(storage.getItem('ppm-profile-v1'),'new profile');
});
