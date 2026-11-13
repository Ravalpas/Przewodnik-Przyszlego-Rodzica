import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {addMonths,datedEvents,milestones,weekOnDate,sourceLink,overlaps} from '../dist/timeline.js';
const catalog=JSON.parse(await readFile(new URL('../dist/data/catalog.json',import.meta.url)));
const child={mode:'child',anchor:'2026-11-01',dates:{birthCardDate:'2026-11-03',peselDate:'2026-11-05'},completedTasks:[]};
test('formal dates use real triggers and calendar months, not weekly approximations',()=>{
  const events=datedEvents(catalog,child,'2026-11-13');
  assert.equal(events.find(e=>e.id==='usc').end,'2026-11-24');
  assert.equal(events.find(e=>e.id==='insurance').end,'2026-11-12');
  assert.equal(events.find(e=>e.id==='800-newborn').end,'2027-02-01');
  assert.equal(addMonths('2026-11-30',3),'2027-02-28');
  assert.equal(datedEvents(catalog,{...child,dates:{}},'2026-11-13').find(e=>e.id==='usc').end,null);
});
test('weeks and milestones distinguish gestational origin, estimated conception and real birthday',()=>{
  const p={mode:'pregnancy',anchor:'2026-09-01',dates:{}};
  const items=milestones(p);assert.equal(items.find(m=>m.id==='conception').start,'2026-09-15');assert.equal(items.find(m=>m.id==='conception').end,'2026-09-21');
  assert.equal(weekOnDate(p,'2026-11-10').week,11);assert.equal(weekOnDate(p,'2026-08-31'),null);
  const baby={...child,pregnancyStart:'2026-02-01',birthTime:'04:32'};
  assert.equal(milestones(baby).find(m=>m.id==='birth').title,'Narodziny · 04:32');assert.equal(milestones(baby).find(m=>m.id==='birthday').start,'2027-11-01');
  assert.equal(weekOnDate(baby,'2026-11-01').week,1);
});
test('source links target fragments, periods are inclusive, future approved versions wait for effective date',()=>{
  assert.ok(sourceLink(catalog.sources[0]).includes('#:~:text='));
  assert.equal(overlaps({start:'2026-01-01',end:'2026-01-21'},'2026-01-21','2026-01-21'),true);
  const clone=structuredClone(catalog);clone.events.find(e=>e.id==='800-newborn').versions=[{validFrom:'2027-01-01',end:{anchor:'birth',months:4}}];
  assert.equal(datedEvents(clone,child,'2026-11-13').find(e=>e.id==='800-newborn').end,'2027-02-01');
  assert.equal(datedEvents(clone,child,'2027-01-01').find(e=>e.id==='800-newborn').end,'2027-03-01');
});
