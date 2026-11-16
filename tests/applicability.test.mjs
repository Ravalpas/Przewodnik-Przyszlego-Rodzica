import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {eventPolicy,taskDisposition,EVENT_GROUPS} from '../dist/event-policy.js';
import {normalizeProfile,completedStages} from '../dist/profile.js';
import {datedEvents} from '../dist/timeline.js';
const catalog=JSON.parse(await readFile(new URL('../dist/data/catalog.json',import.meta.url)));
const profile={mode:'child',anchor:'2026-11-01',dates:{birthCardDate:'2026-11-02'},completedTasks:[],notApplicableTasks:[]};
const event=id=>catalog.events.find(e=>e.id===id);
test('mandatory matters cannot be dismissed even with conflicting optional metadata',()=>{
  for(const id of ['usc','insurance','vaccine-newborn','vaccine-six-weeks']){
    const e={...event(id),obligation:'optional'};assert.equal(eventPolicy(e).required,true);assert.equal(eventPolicy(e).canMarkNotApplicable,false);
    assert.throws(()=>taskDisposition(profile,e,'not-applicable'));
  }
  assert.equal(eventPolicy({id:'new-duty',kind:'Obowiązek urzędowy'}).canMarkNotApplicable,false);
});
test('benefits are optional, exclusions and completion are exclusive, and restoring preserves other tasks',()=>{
  for(const id of ['800-newborn','800-renewal','krus-benefit','becikowe','parental-benefit'])assert.equal(eventPolicy(event(id)).canMarkNotApplicable,true);
  let p={...profile,completedTasks:['usc','krus-benefit']};
  p={...p,...taskDisposition(p,event('krus-benefit'),'not-applicable')};assert.deepEqual(p.completedTasks,['usc']);assert.deepEqual(p.notApplicableTasks,['krus-benefit']);
  p={...p,...taskDisposition(p,event('krus-benefit'),'pending')};assert.deepEqual(p.notApplicableTasks,[]);assert.deepEqual(p.completedTasks,['usc']);
  p={...p,...taskDisposition(p,event('krus-benefit'),'not-applicable')};p={...p,...taskDisposition(p,event('krus-benefit'),'done')};assert.deepEqual(p.notApplicableTasks,[]);assert.ok(p.completedTasks.includes('krus-benefit'));
});
test('saved exclusions survive normalization, suppress alerts, and cannot hide mandatory matters',()=>{
  const p=normalizeProfile({...profile,notApplicableTasks:['800-newborn','800-newborn','usc','insurance']},{now:'2026-11-16T12:00:00Z'});
  assert.deepEqual(p.notApplicableTasks,['800-newborn']);
  const events=datedEvents(catalog,p,'2027-01-28'),optional=events.find(e=>e.id==='800-newborn');
  assert.equal(optional.notApplicable,true);assert.equal(optional.important,false);assert.equal(optional.done,false);
  const required=datedEvents(catalog,{...p,notApplicableTasks:['usc']},'2026-11-16').find(e=>e.id==='usc');assert.equal(required.notApplicable,false);
  assert.equal(completedStages(p,'2026-11-16'),44);
});
test('the presentation order distinguishes mandatory actions, recommended care and optional benefits',()=>{
  assert.deepEqual(EVENT_GROUPS.map(g=>g.id),['required','recommended','optional']);
  assert.equal(eventPolicy(event('usc')).group,'required');assert.equal(eventPolicy(event('control-year')).group,'recommended');assert.equal(eventPolicy(event('800-newborn')).group,'optional');
});
