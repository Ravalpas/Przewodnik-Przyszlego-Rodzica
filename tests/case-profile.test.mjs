import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeCaseProfile} from '../dist/case-profile.js';
import {calculatorInitial} from '../dist/calculator.js';
import {calculateIntegrated} from '../dist/calculator-engine.js';
import {suggestionsFromText,applyImportedFields,occupationFromZusCode} from '../dist/data-import.js';
import {buildBielikContext} from '../backend/bielik.mjs';
const rules=JSON.parse(await readFile(new URL('../dist/data/calculator-rules.json',import.meta.url),'utf8'));
const insured=(p={})=>({occupation:'employee',coverage:'compulsory',insuranceFrom:'2020-01-01',basis:6000,basisMode:'known',...p});
const fixture=p=>({eventDate:'2026-01-01',dateKind:'actual',parents:[insured(),insured()],parentalParts:[],...p});
const run=p=>calculateIntegrated(fixture(p),rules,'2026-11-21');

test('formal profiles migrate real dates without inventing a due date or adoption, and initialize the correct family path',()=>{
 const legacy=normalizeCaseProfile({mode:'child',anchor:'2026-11-01',parentRole:'father',completedTasks:['usc']});assert.equal(legacy.caseStage,'born');assert.equal(legacy.childBirthDate,'2026-11-01');assert.deepEqual(legacy.completedTasks,['usc']);
 const waiting=normalizeCaseProfile({formal:true,parentRole:'mother',caseStage:'pregnancy'});assert.equal(calculatorInitial(waiting).eventDate,'');
 const adoption=normalizeCaseProfile({formal:true,parentRole:'father',caseStage:'adopted',childBirthDate:'2020-05-02',placementDate:'2026-09-01',adoptionApplicationDate:'2026-09-15',adoptionCourtDate:'2026-11-01',childCount:2});const input=calculatorInitial(adoption);assert.equal(input.familyType,'adoption');assert.equal(input.eventDate,'2026-09-01');assert.equal(input.adoptionApplicationDate,'2026-09-15');assert.equal(input.count,2);
 assert.throws(()=>normalizeCaseProfile({...adoption,adoptionCourtDate:'2026-08-01'}),/przyjęcia/);
 const context=buildBielikContext(waiting,{catalog:{sources:[],events:[]}},'2026-11-21');assert.equal(context.stage,'Oczekiwanie narodzin');assert.ok(!context.age.includes('tydzień'));
});
test('import never maps pension contribution bases or empty PDF labels to money and preserves unrelated parent fields',()=>{
 const parsed=suggestionsFromText('Podstawa skladek emerytalnych: 9000\nStale wynagrodzenie brutto: 6000\nPodstawa zasilku:   \nData porodu: 01.11.2026');assert.equal(parsed.suggestions.length,2);assert.equal(parsed.suggestions[0].field,'salary');
 const original=calculatorInitial(normalizeCaseProfile({formal:true,parentRole:'mother',caseStage:'planning'}));original.parents[0].salary=8000;const result=applyImportedFields(original,parsed.suggestions,1,0);assert.equal(result.parents[0].salary,8000);assert.equal(result.parents[1].salary,6000);assert.equal(result.eventDate,'2026-11-01');assert.equal(original.parents[1].salary,null);
 assert.throws(()=>applyImportedFields(original,[{field:'__proto__',value:1}]),/Nieobsługiwane/);assert.throws(()=>applyImportedFields(original,[{field:'coverage',value:'nie wiadomo skąd'}]),/chorobowego/);
 assert.equal(occupationFromZusCode('01 10 00'),'employee');assert.equal(occupationFromZusCode('05 40 00'),'startup');assert.equal(occupationFromZusCode('05 99 00'),null);
});
test('prenatal entitlement starts with the actual insurance title, not retroactively on childbirth acquisition',()=>{
 const result=run({eventDate:'2026-11-01',prenatalDays:42,parents:[insured({insuranceFrom:'2026-10-01'}),insured()]});assert.equal(result.periods[0].gross,0);assert.equal(result.periods.find(p=>p.start==='2026-10-01').gross,6200);assert.equal(result.totals[0].gross,25800);
});
test('timely installment agreements do not block a benefit and late full payment only enables the remaining period',()=>{
 const installments=run({parents:[insured({occupation:'business',coverage:'voluntary',debt:1000,installmentAgreement:true,installmentsTimely:true,noDebtOutsideAgreement:true}),insured()]});assert.equal(installments.totals[0].gross,28000);
 const late=run({parents:[insured({occupation:'business',coverage:'voluntary',debt:1000,debtPaidDate:'2026-08-01'}),insured()],parentalParts:[{parent:0,weeks:32}]});assert.equal(late.totals[0].gross,21280);
 const sick=run({focus:'sickness',parents:[insured({occupation:'business',coverage:'voluntary',debt:1000,debtPaidDate:'2026-08-01'}),insured()],sickness:{start:'2026-01-01',days:270,pregnant:true,certificate:'yes'}});assert.equal(sick.totals[0].gross,11600);assert.equal(sick.periods.find(p=>p.start==='2026-08-01').days,58);
});
test('first-month business art49 and contract bases use their own verified formulas',()=>{
 const result=run({parents:[insured({occupation:'business',coverage:'voluntary',basisMode:'first-month',minimumBasis:5652,declaredBasis:10000,completedMonthBasis:true,priorTitleMonths:3,previousGap:10}),insured()]});assert.equal(result.parents[0].basis,6127.74);
 const contract=run({parents:[insured({occupation:'contract',coverage:'voluntary',basisMode:'first-month',contractMonthly:7000}),insured()]});assert.equal(contract.parents[0].basis,6040.3);
});
test('adoption requires both conditions and chooses the rules at actual commencement, not the earlier placement',()=>{
 assert.throws(()=>run({familyType:'adoption',childBirthDate:'2020-01-01'}),/datę wystąpienia/);
 const futureRules=structuredClone(rules);futureRules.versions=[{id:'future-test',validFrom:'2027-01-01',parameters:structuredClone(rules.parameters)}];futureRules.versions[0].parameters.rates.maternity=95;
 const input=fixture({familyType:'adoption',dateKind:'expected',eventDate:'2026-11-01',adoptionApplicationDate:'2027-01-01',childBirthDate:'2020-01-01'}),r=calculateIntegrated(input,futureRules,'2026-11-21');assert.equal(r.rulesVersion,'future-test');assert.equal(r.totals[0].gross,26600);assert.equal(r.periods[0].start,'2027-01-01');
 assert.throws(()=>calculateIntegrated({...input,dateKind:'actual'},futureRules,'2026-11-21'),/przyszła/);
});
test('transfer dates distinguish the death of an insured and uninsured mother',()=>{
 const insuredMother=run({transfer:'mother-death',transferDate:'2026-02-01'});assert.equal(insuredMother.periods.find(p=>p.parent===1).start,'2026-02-01');
 const uninsuredMother=run({transfer:'mother-death',transferDate:'2026-02-01',parents:[insured({coverage:'none'}),insured()]});assert.equal(uninsuredMother.periods.find(p=>p.parent===1).start,'2026-02-02');
});

test('adoption can start with the father and an averaged rate preserves the other parent reserve',()=>{
 const result=run({familyType:'adoption',primaryParent:1,eventDate:'2026-01-01',adoptionApplicationDate:'2026-01-01',childBirthDate:'2020-01-01',rateChoice:'averaged',applicationDate:'2026-01-10',parentalParts:[{parent:1,weeks:32},{parent:0,weeks:9}]});
 assert.equal(result.periods[0].parent,1);assert.equal(result.periods[0].rate,81.5);
 const reserve=result.periods.filter(p=>p.parent===0);assert.ok(reserve.length);assert.ok(reserve.every(p=>p.rate===70));
});
