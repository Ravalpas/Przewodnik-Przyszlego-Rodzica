import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ageAt,anchorFromAge,subtractMonths,validateProfile,dayNumber,shiftDate } from '../dist/age.js';
test('week boundaries are exactly seven civil days',()=>{
  assert.deepEqual(ageAt('2026-11-10','2026-11-10'),{days:0,weeks:0,extraDays:0,stage:1});
  assert.equal(ageAt('2026-11-04','2026-11-10').stage,1);
  assert.equal(ageAt('2026-11-03','2026-11-10').stage,2);
  assert.deepEqual(ageAt('2026-08-15','2026-11-10'),{days:87,weeks:12,extraDays:3,stage:13});
});
test('age input in each unit generates one canonical date',()=>{
  assert.equal(anchorFromAge(12,'weeks','2026-11-10'),'2026-08-18');
  assert.equal(anchorFromAge(84,'days','2026-11-10'),'2026-08-18');
  assert.equal(anchorFromAge(3,'months','2026-11-10'),'2026-08-10');
  for(let d=0;d<400;d++) assert.equal(ageAt(anchorFromAge(d,'days','2026-11-10'),'2026-11-10').days,d);
});
test('calendar months handle leap years and short months',()=>{
  assert.equal(subtractMonths('2024-03-31',1),'2024-02-29');
  assert.equal(subtractMonths('2025-03-31',1),'2025-02-28');
  assert.equal(subtractMonths('2026-01-31',2),'2025-11-30');
});
test('calendar days cross daylight saving boundaries without losing days',()=>{
  assert.equal(ageAt('2026-03-28','2026-03-30').days,2);
  assert.equal(ageAt('2026-10-24','2026-10-26').days,2);
  assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');
});
test('invalid and future inputs cannot replace saved ages',()=>{
  for(const n of ['',-1,1.5,'abc',Infinity]) assert.throws(()=>anchorFromAge(n,'days','2026-11-10'));
  assert.throws(()=>dayNumber('2026-02-30'));
  assert.throws(()=>ageAt('2026-11-11','2026-11-10'));
  assert.throws(()=>validateProfile({mode:'pregnancy',anchor:'2025-01-01'},'2026-11-10'));
  assert.throws(()=>validateProfile({mode:'bad',anchor:'2026-11-10'},'2026-11-10'));
  assert.doesNotThrow(()=>validateProfile({mode:'child',anchor:'2025-01-01'},'2026-11-10'));
});
test('both reference maps retain every numbered point in original vertical order',async()=>{
  const maps=JSON.parse(await readFile(new URL('../dist/assets/map-points.json',import.meta.url)));
  for(const [mode,count] of [['pregnancy',42],['child',52]]){
    const m=maps[mode];assert.equal(m.points.length,count);
    for(let i=0;i<count;i++){assert.ok(m.points[i].x>0 && m.points[i].x<m.width);assert.ok(m.points[i].y>0 && m.points[i].y<m.height);if(i)assert.ok(m.points[i].y>m.points[i-1].y);}
  }
});
