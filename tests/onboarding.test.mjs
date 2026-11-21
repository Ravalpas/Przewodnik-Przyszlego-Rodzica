import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SITUATION_OPTIONS,roleQuestion,caseDetailsHtml,buildCaseAnswers} from '../dist/case-onboarding.js';
import {normalizeCaseProfile,selectFamilySituation} from '../dist/case-profile.js';
import {calculatorInitial} from '../dist/calculator.js';
import {calculateIntegrated} from '../dist/calculator-engine.js';
import {explanationsHtml} from '../dist/terms.js';
import {readFile} from 'node:fs/promises';
const profile=d=>normalizeCaseProfile({...buildCaseAnswers(d),onboardingComplete:true});
test('seven explicit family paths ask a relevant role and allow unknown dates without authentication',()=>{
 assert.equal(SITUATION_OPTIONS.length,7);
 for(const [category] of SITUATION_OPTIONS){const role=roleQuestion(category);assert.ok(role.title);assert.ok(role.options.length>=3);const p=profile({category,parentRole:role.options[0][0]});assert.ok(p.onboardingComplete);assert.equal(p.childBirthDate,'');assert.equal(p.eventDate,'');assert.equal(p.identityOrigin,'manual');}
 assert.equal(roleQuestion('adoption').options[0][0],'prospective');assert.equal(roleQuestion('adopted').options[0][0],'mother');assert.ok(roleQuestion('foster').options.some(([id])=>id==='related-foster'));assert.ok(roleQuestion('other').options.some(([id])=>id==='guardian'));
});
test('legal statuses stay distinct; caregiver or unknown care is never initialized as childbirth entitlement',async()=>{
 for(const fosterType of ['related-foster','foster','professional','family-home','foster-unknown']){const p=profile({category:'foster',fosterType,fosterPlaced:'no'});assert.equal(p.caseStage,fosterType);assert.equal(p.parentRole,'caregiver');const initial=calculatorInitial(p);assert.equal(initial.familyType,['related-foster','foster'].includes(fosterType)?'foster':fosterType==='professional'?'professional':'unknown');assert.equal(initial.eventDate,'');}
 const guardian=profile({category:'other',careStatus:'guardian'});assert.equal(guardian.careStatus,'guardian');assert.equal(calculatorInitial(guardian).familyType,'unknown');
 const rules=JSON.parse(await readFile(new URL('../dist/data/calculator-rules.json',import.meta.url),'utf8'));assert.throws(()=>calculateIntegrated({...calculatorInitial(guardian),eventDate:'2026-11-01'},rules),/sytuację prawną/);
 const adopted=profile({category:'adopted',parentRole:'father'});assert.equal(adopted.parentRole,'father');assert.equal(calculatorInitial(adopted).familyType,'adoption');
});
test('questions request only dates relevant to the selected procedure and no earnings during welcome',()=>{
 const planning=caseDetailsHtml({category:'planning'});assert.ok(!planning.includes('type="date"'));const pregnancy=caseDetailsHtml({category:'pregnancy'});assert.ok(pregnancy.includes('gestationWeek'));assert.ok(!pregnancy.includes('adoptionApplicationDate'));
 const earlier=caseDetailsHtml({category:'adoption',adoptionStep:'preparing'});assert.ok(!earlier.includes('name="placementDate"'));assert.ok(!earlier.includes('name="childBirth0"'));
 const placed=caseDetailsHtml({category:'adoption',adoptionStep:'placed'});assert.ok(placed.includes('name="placementDate"'));assert.ok(placed.includes('name="adoptionApplicationDate"'));
 assert.ok(!caseDetailsHtml({category:'foster',fosterPlaced:'no'}).includes('name="childBirth0"'));assert.ok(caseDetailsHtml({category:'foster',fosterPlaced:'yes'}).includes('name="childBirth0"'));
 for(const [category] of SITUATION_OPTIONS)assert.ok(!caseDetailsHtml({category}).includes('salary'));
 const cleared=buildCaseAnswers({category:'planning',placementDate:'2026-01-01',adoptionCourtDate:'2026-02-01',childBirthDate:'2025-01-01',children:[{name:'Anna',birthDate:'2025-01-01'}]});assert.equal(cleared.placementDate,'');assert.equal(cleared.adoptionCourtDate,'');assert.equal(cleared.childBirthDate,'');
});
test('different children and concurrent situations retain dates, tasks and independent calculator context across storage reload',()=>{
 let p=profile({category:'born',parentRole:'father',situationId:'born',children:[{id:'a',name:'Anna',birthDate:'2018-05-01'},{id:'b',name:'Jan',birthDate:'2023-01-02'}],completedTasks:['zus-insurance']});assert.equal(p.children.length,2);
 p=normalizeCaseProfile({...p,activeChildId:'b'});assert.equal(p.name,'Jan');assert.equal(calculatorInitial(p).eventDate,'2023-01-02');
 const next=buildCaseAnswers({category:'adoption',parentRole:'prospective',situationId:'adoption',adoptionStep:'preparing'});p=normalizeCaseProfile({...p,...next});assert.equal(p.familySituations.length,2);assert.equal(p.completedTasks.length,0);assert.equal(p.childBirthDate,'');assert.equal(p.parentRole,'prospective');
 p=selectFamilySituation(JSON.parse(JSON.stringify(p)),'born');assert.equal(p.children.length,2);assert.equal(p.activeChildId,'b');assert.equal(p.name,'Jan');assert.deepEqual(p.completedTasks,['zus-insurance']);assert.equal(p.familySituations.find(s=>s.situationId==='adoption').parentRole,'prospective');
});
test('optional pregnancy week stays an explicitly declared observation and never invents a due date',()=>{
 const p=profile({category:'pregnancy',parentRole:'mother',gestationWeek:11});assert.equal(p.gestationWeek,11);assert.equal(p.eventDate,'');assert.equal(p.dueDate,'');assert.equal(calculatorInitial(p).eventDate,'');
 assert.throws(()=>profile({category:'pregnancy',gestationWeek:99}),/tydzień ciąży/);
});
test('dates are internally coherent and contextual definitions are collapsed',()=>{
 assert.throws(()=>profile({category:'adopted',placementDate:'2020-01-01',children:[{birthDate:'2021-01-01'}]}),/urodzenia/);
 assert.throws(()=>profile({category:'adopted',placementDate:'2020-01-01',adoptionApplicationDate:'2021-01-01',adoptionCourtDate:'2020-02-01'}),/wystąpienia/);
 const html=explanationsHtml(['adoption','guardian']);assert.ok(html.includes('Przykład'));assert.ok(!html.includes(' open'));assert.ok(!html.includes('Ubezpieczenie chorobowe'));assert.ok(html.includes('data-term="guardian"'));
});

test('selecting a child with missing details never copies a sibling name or date',()=>{
 const p=normalizeCaseProfile({...buildCaseAnswers({category:'born',parentRole:'mother',children:[{id:'a',name:'Anna',birthDate:'2020-01-01'},{id:'b',name:'',birthDate:''}]}),activeChildId:'b'});assert.equal(p.childBirthDate,'');assert.equal(p.name,'');assert.equal(calculatorInitial(p).eventDate,'');
});
