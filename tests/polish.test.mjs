import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quantity,ordinal,ageUnitLabel,periodText} from '../dist/polish.js';
import {ageText} from '../dist/age.js';
import {sourceLink} from '../dist/timeline.js';

test('Polish quantities distinguish singular, few and many, including teen exceptions',()=>{
  for(const [n,week,month] of [
    [0,'tygodni','miesięcy'],[1,'tydzień','miesiąc'],[2,'tygodnie','miesiące'],
    [3,'tygodnie','miesiące'],[4,'tygodnie','miesiące'],[5,'tygodni','miesięcy'],
    [11,'tygodni','miesięcy'],[12,'tygodni','miesięcy'],[13,'tygodni','miesięcy'],
    [14,'tygodni','miesięcy'],[21,'tygodni','miesięcy'],[22,'tygodnie','miesiące'],
    [24,'tygodnie','miesiące'],[25,'tygodni','miesięcy'],[101,'tygodni','miesięcy'],
    [112,'tygodni','miesięcy']
  ]){
    assert.equal(quantity(n,'weeks'),`${n} ${week}`);
    assert.equal(quantity(n,'months'),`${n} ${month}`);
  }
  assert.equal(quantity(1,'days'),'1 dzień');
  assert.equal(quantity(2,'days'),'2 dni');
  assert.equal(quantity(1.5,'weeks'),'1,5 tygodnia');
  assert.equal(quantity(1,'matters'),'1 sprawa');
  assert.equal(quantity(3,'matters'),'3 sprawy');
  assert.equal(quantity(12,'matters'),'12 spraw');
});

test('onboarding unit labels follow the typed number without preselecting a value',()=>{
  assert.equal(ageUnitLabel('','weeks'),'Tygodnie');
  assert.equal(ageUnitLabel(1,'weeks'),'pełny tydzień');
  assert.equal(ageUnitLabel(2,'weeks'),'pełne tygodnie');
  assert.equal(ageUnitLabel(5,'weeks'),'pełnych tygodni');
  assert.equal(ageUnitLabel(1,'months'),'pełny miesiąc');
  assert.equal(ageUnitLabel(3,'months'),'pełne miesiące');
  assert.equal(ageUnitLabel(12,'months'),'pełnych miesięcy');
  assert.equal(ageUnitLabel(1,'days'),'dzień');
  assert.equal(ageText({weeks:1,extraDays:1}),'1 tydzień i 1 dzień');
  assert.equal(ageText({weeks:22,extraDays:3}),'22 tygodnie i 3 dni');
});

test('ordinal positions use the Polish dot notation and differ from quantities',()=>{
  assert.equal(ordinal(1,'weeks'),'1. tydzień');
  assert.equal(ordinal(3,'months'),'3. miesiąc');
  assert.equal(quantity(3,'months'),'3 miesiące');
  assert.throws(()=>ordinal(0,'months'));
});

test('calendar periods explain both endpoints and source quotes remain URL anchors',()=>{
  assert.equal(periodText({start:'2026-11-16',end:'2027-02-16'},{long:true}),'Od 16 listopada 2026 do 16 lutego 2027');
  assert.equal(periodText({start:'2026-11-16',end:'2026-11-16'},{long:true}),'16 listopada 2026');
  assert.match(periodText({start:null,end:null}),/Uzupełnij datę/);
  assert.equal(sourceLink({url:'https://example.gov.pl',quote:'3 miesięcy'}),'https://example.gov.pl#:~:text=3%20miesi%C4%99cy');
});
