import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {calculateIntegrated} from '../dist/calculator-engine.js';
import {calcSupplement} from '../dist/calculator-family.js';
import {calcNormalizeInput,calcBasis} from '../dist/calculator-core.js';
import {createCalculatorStore,calculatorCalendarEvents} from '../dist/calculator-storage.js';
import {validateCalculatorParameters,calculatorRulesFor} from '../dist/calculator-params.js';
import {createMonitor,publicCalculatorRules} from '../backend/monitor.mjs';
import {handleApi} from '../backend/api.mjs';
const rules=JSON.parse(await readFile(new URL('../dist/data/calculator-rules.json',import.meta.url),'utf8'));
const parent=(extra={})=>({occupation:'employee',coverage:'compulsory',insuranceFrom:'2020-01-01',basisMode:'known',basis:6000,fte:1,payer:'zus',...extra});
const fixture=(extra={})=>({formalCase:{currentLeave:'maternity',stillbirthCertificate:'yes',careCertificate:'yes',careOtherBenefit:'no',otherCarer:'unavailable'},familyType:'birth',focus:'family',eventDate:'2026-01-01',dateKind:'actual',count:1,parents:[parent(),parent()],parentalParts:[],...extra});
const run=input=>calculateIntegrated(fixture(input),rules,'2026-11-21');
const sum=result=>result.periods.filter(p=>p.gross!==null).reduce((s,p)=>s+p.gross,0);

test('parallel insurance titles sum daily money without multiplying calendar days and cannot finish waiting after termination',()=>{
 const r=run({focus:'sickness',sickness:{start:'2026-01-01',days:10,certificate:'yes'},parents:[parent({extraTitles:[parent({occupation:'contract',coverage:'voluntary',basis:3000})]}),parent()]});
 assert.equal(r.totals[0].days,10);assert.equal(r.monthly[0].days,10);assert.equal(r.totals[0].gross,3000);assert.equal(r.monthly[0].gross,3000);
 const no=run({focus:'sickness',sickness:{start:'2026-01-01',days:90,certificate:'yes'},parents:[parent({insuranceFrom:'2026-01-01',insuranceTo:'2026-01-20'}),parent()]});assert.equal(no.parents[0].canPay,false);assert.ok(no.periods.every(p=>p.gross===null));
});
test('parental leave at childbirth, exact extra-care newborn boundary and selected care applicant are respected',()=>{
 const birth=run({parents:[parent({coverage:'none',parentalLeave:true}),parent()]});assert.equal(birth.parents[0].status,'conditional');assert.notEqual(birth.periods[0].gross,null);
 const care=run({focus:'care',childBirthDate:'2026-01-01',care:{start:'2026-02-20',type:'extra-newborn',parent:1,days:20,qualifyingReason:true,noOtherCarer:true}});assert.equal(care.periods[0].days,6);assert.equal(care.documents[0].parent,1);
 assert.throws(()=>run({focus:'care',care:{type:'extra-newborn',qualifyingReason:true}}),/dokładnej daty/);
 const otherReason=run({focus:'care',childBirthDate:'2023-01-01',care:{type:'healthy-child',ageMonths:36,qualifyingReason:true,noOtherCarer:true,reason:'carer-hospital',closureNotice:90}});assert.notEqual(otherReason.periods[0].gross,null);
 const adult=run({focus:'care',care:{type:'adult',noOtherCarer:true}});assert.equal(adult.parents[0].canPay,false);
});
test('debt threshold is exact and invalid histories, malformed parameters or mixed-age assumptions cannot grant money',()=>{
 for(const [debt,canPay]of [[48.06,true],[48.07,false]])assert.equal(run({parents:[parent({occupation:'business',coverage:'voluntary',debt}),parent()]}).parents[0].canPay,canPay);
 assert.throws(()=>run({parents:[parent({insuranceTo:'2019-01-01'}),parent()]}),/Koniec ubezpieczenia/);
 assert.throws(()=>run({parents:[parent({coverage:'voluntary'}),parent()]}),/obowiązkowe/);
 const complex=run({familyType:'adoption',adoptionApplicationDate:'2026-01-01',count:2,childBirthDate:'2021-01-01',adoptionDifferentAges:true});assert.equal(complex.formalDecision.state,'information-needed');assert.equal(complex.totals[0].gross,null);assert.ok(complex.formalDecision.nextSteps.length);
 const bad=structuredClone(rules.parameters);bad.postInsuranceCap=[{from:'2026-02-30',amount:10000}];assert.throws(()=>validateCalculatorParameters(bad),/prawidłowych dat/);
 const overlap=structuredClone(rules.parameters);overlap.postInsuranceCap=[{from:'2026-01-01',to:'2026-03-31',amount:10000},{from:'2026-03-31',amount:11000}];assert.throws(()=>validateCalculatorParameters(overlap),/nakładać/);
});
test('all childbirth counts preserve exact maternity limits, calendar days and own parent bases',()=>{
  for(const [count,days]of [[1,140],[2,217],[3,231],[4,245],[5,259],[6,259]]){const r=run({count});assert.equal(r.periods[0].days,days);assert.equal(r.periods[0].gross,days*200);}
  const r=run({parents:[parent({basisMode:'salary',salary:6000}),parent({basisMode:'salary',salary:9000})],parentalParts:[{parent:0,weeks:32},{parent:1,weeks:9}]});
  assert.equal(r.parents[0].basis,5177.4);assert.equal(r.parents[1].basis,7766.1);
  assert.equal(r.periods.find(p=>p.id==='parental-1-0').gross,11416.23);
  assert.equal(r.limits.parental,287);assert.equal(r.unclaimedParentDays,0);
});
test('reserved weeks cannot transfer, are within the pool and Za życiem changes both appropriate limits',()=>{
  assert.throws(()=>run({parentalParts:[{parent:0,weeks:41}]}),/nieprzenoszalnej/);
  const r=run({life:true,parentalParts:[{parent:0,weeks:56},{parent:1,weeks:9}]});assert.equal(r.limits.parental,455);
  assert.throws(()=>run({previousParent1Days:200,previousParent2Days:200,previousParentDays:0,parentalParts:[{parent:0,weeks:3}]}),/Suma wykorzystanych/);
  assert.throws(()=>run({previousParts:5,parentalParts:[{parent:0,weeks:1}]}),/liczbę części/);
});
test('averaged payment is timely, excludes supplementary/paternity and preserves second-parent reserve at 70%',()=>{
  const r=run({rateChoice:'averaged',applicationDate:'2026-01-22',parents:[parent({basisMode:'salary',salary:6000}),parent()],parentalParts:[{parent:0,weeks:32},{parent:1,weeks:9}],paternityDays:14});
  assert.equal(r.periods[0].daily,140.65);assert.equal(r.periods.find(p=>p.parent===1&&p.id.startsWith('parental')).rate,70);assert.equal(r.periods.find(p=>p.id==='paternity-0').rate,100);
  const late=run({rateChoice:'averaged',applicationDate:'2026-01-23'});assert.equal(late.periods[0].rate,100);assert.equal(late.averaged,false);
  const uninsuredMother=run({rateChoice:'averaged',applicationDate:'2026-01-10',parents:[parent({coverage:'none'}),parent()],parentalParts:[{parent:1,weeks:32}]});assert.equal(uninsuredMother.averaged,false);assert.ok(uninsuredMother.periods.filter(p=>p.parent===1).every(p=>p.rate===70));
});
test('prenatal weeks consume the same pool and ordinary transfer requires insured maternity and 14 postnatal weeks',()=>{
  const r=run({prenatalDays:42});assert.equal(r.periods[0].start,'2025-11-20');assert.equal(r.periods.reduce((sum,p)=>sum+p.days,0),140);assert.equal(r.periods.at(-1).end,'2026-04-08');
  assert.throws(()=>run({transfer:'ordinary',motherPostWeeks:13}),/14 tygodni/);
  assert.throws(()=>run({transfer:'ordinary',parents:[parent({coverage:'none'}),parent()]}),/uprawnienia matki/);
  assert.throws(()=>run({transfer:'mother-hospital',transferDate:'2026-03-01',parents:[parent({coverage:'none'}),parent()]}),/uprawnienia matki/);
});
test('insurance ending after birth does not erase acquired parental payment; father can become insured after birth',()=>{
  const r=run({parents:[parent({insuranceTo:'2026-02-01',endReason:'ordinary'}),parent({insuranceFrom:'2026-03-01'})],parentalParts:[{parent:0,weeks:32},{parent:1,weeks:9}]});
  assert.notEqual(r.periods.find(p=>p.id==='parental-0-0').gross,null);assert.notEqual(r.periods.find(p=>p.id==='parental-1-0').gross,null);
});
test('supplement merges stays, handles 1000g inclusively, term stays from birth and longest child rather than summed children',()=>{
  const make=extra=>calcSupplement(calcNormalizeInput(fixture(extra)));
  assert.equal(make({gestation:27,birthWeight:1200,hospitals:[{child:1,start:'2026-01-01',end:'2026-01-01'}]}).weeks,1);
  assert.equal(make({gestation:30,birthWeight:1000,hospitals:[{child:1,start:'2026-01-01',end:'2026-03-11'}]}).weeks,10);
  assert.equal(make({gestation:30,birthWeight:1001,hospitals:[{child:1,start:'2026-01-01',end:'2026-03-11'}]}).weeks,8);
  assert.equal(make({gestation:38,hospitals:[{child:1,start:'2026-01-01',end:'2026-01-06'}]}).weeks,1);
  assert.equal(make({gestation:38,hospitals:[{child:1,start:'2026-01-29',end:'2026-02-02'}]}).weeks,0);
  assert.equal(make({gestation:35,hospitals:[{child:1,start:'2026-01-01',end:'2026-01-03'},{child:1,start:'2026-01-03',end:'2026-01-08'}]}).hospitalDays,8);
  assert.equal(make({count:2,gestation:30,birthWeight:900,hospitals:[{child:1,start:'2026-01-01',end:'2026-01-08'},{child:2,start:'2026-01-01',end:'2026-01-08'}]}).weeks,2);
  const late=run({formalCase:{gestationWeek:35,gestationDay:0},gestation:35,hospitals:[{start:'2026-01-01',end:'2026-01-07'}],supplementApplication:'2026-05-20'}).periods.find(p=>p.id==='supplement');assert.equal(late.gross,null);assert.equal(late.eligibility,'assessment');
});
test('work extension uses full-time fraction; benefit reduction uses original employment fraction; mixed rates retain origin',()=>{
  const half=run({parentalParts:[{parent:0,weeks:32,work:.5,extensionWork:.5}]});assert.equal(half.periods.filter(p=>p.id.startsWith('parental')||p.id.startsWith('extension')).reduce((s,p)=>s+p.days,0),448);
  const part=run({parents:[parent({fte:.5}),parent()],parentalParts:[{parent:0,weeks:32,work:.25,extensionWork:0}]});assert.equal(part.periods.find(p=>p.id.startsWith('extension')).days,56);assert.equal(part.periods.find(p=>p.id.startsWith('parental')).daily,70);
  const mixed=run({rateChoice:'averaged',applicationDate:'2026-01-10',parentalParts:[{parent:1,weeks:20,work:.5,extensionWork:.5}]});assert.equal(mixed.periods.filter(p=>p.parent===1).reduce((s,p)=>s+p.gross,0),21371);
  assert.throws(()=>run({parentalParts:[{parent:0,weeks:2,work:.75}]}),/prawidłowym zakresie/);
});
test('loss never produces future parental/paternity, does not resurrect exhausted maternity and validates surviving children',()=>{
  const r=run({loss:'stillbirth',parentalParts:[{parent:0,weeks:32}],paternityDays:14});assert.equal(r.periods.reduce((s,p)=>s+p.days,0),56);assert.equal(r.periods.length,1);
  assert.throws(()=>run({loss:'child-death',lossDate:'2026-02-01',surviving:5}),/mniejsza/);
  const placement=run({loss:'child-care-placement',lossDate:'2027-01-01'});assert.equal(placement.periods[0].days,140);
});
test('sickness waiting is per title, cannot complete after termination and does not consume the benefit period',()=>{
  const r=run({focus:'sickness',parents:[parent({insuranceFrom:'2026-01-01'}),parent()],sickness:{start:'2026-01-01',days:300,pregnant:true,certificate:'yes'}});
  assert.equal(r.periods[0].start,'2026-01-31');assert.equal(r.periods.reduce((s,p)=>s+p.days,0),270);assert.equal(sum(r),54000);assert.equal(r.periods.at(-1).end,'2026-10-27');
  const no=run({focus:'sickness',parents:[parent({insuranceFrom:'2026-01-01',insuranceTo:'2026-01-29',endReason:'ordinary'}),parent()],sickness:{start:'2026-01-31',days:40,pregnant:true,certificate:'yes'}});assert.equal(no.parents[0].canPay,false);assert.equal(sum(no),0);
  const multi=run({focus:'sickness',parents:[parent({basis:3000,extraTitles:[parent({insuranceFrom:'2026-01-15',basis:2000})]}),parent()],sickness:{start:'2026-01-20',days:60,pregnant:true,certificate:'yes'}});assert.equal(sum(multi),8333.45);
});
test('post-insurance sickness has the 91-day limit, no employer salary, pregnancy exception and correct reset after a break',()=>{
  const r=run({focus:'sickness',parents:[parent({insuranceTo:'2026-05-31',endReason:'ordinary'}),parent()],sickness:{start:'2026-06-01',days:150,pregnant:false,certificate:'yes'}});assert.equal(r.periods.reduce((s,p)=>s+p.days,0),91);assert.equal(sum(r),14560);assert.ok(r.periods.every(p=>!p.title.startsWith('Wynagrodzenie')));
  const pregnant=run({focus:'sickness',parents:[parent({insuranceTo:'2026-05-31',endReason:'ordinary'}),parent()],sickness:{start:'2026-06-01',days:150,pregnant:true,certificate:'yes'}});assert.equal(pregnant.periods.reduce((s,p)=>s+p.days,0),150);
  const reset=run({focus:'sickness',sickness:{start:'2026-06-03',days:30,pregnant:true,certificate:'yes',usedDays:260,previousEnd:'2026-06-01',previousPregnant:true}});assert.equal(reset.periods.reduce((s,p)=>s+p.days,0),30);
});
test('rehab after ordinary termination is possible, has indexed basis/cap and is not automatically awarded',()=>{
  const r=run({focus:'rehab',parents:[parent({insuranceTo:'2026-05-31',endReason:'ordinary'}),parent()],sickness:{start:'2026-06-01',days:30,pregnant:true,rehabExhausted:true,prognosis:true,rehabGranted:true,rehabAlreadyIndexed:true}});assert.equal(r.parents[0].canPay,true);assert.equal(sum(r),6000);
  const missingCap=run({focus:'rehab',parents:[parent({insuranceTo:'2026-05-31',endReason:'ordinary',basisMode:'salary',salary:100000}),parent()],sickness:{start:'2026-06-01',days:30,pregnant:true,rehabExhausted:true,prognosis:true,rehabGranted:true}});assert.equal(missingCap.periods[0].basis,9562.88);assert.equal(missingCap.periods[0].gross,9562.8);
  const b=structuredClone(rules);b.parameters.postInsuranceCap=[{from:'2026-06-01',to:'2026-08-31',amount:10000}];const capped=calculateIntegrated(fixture({focus:'rehab',parents:[parent({insuranceTo:'2026-05-31',endReason:'ordinary',basisMode:'salary',salary:100000}),parent()],sickness:{start:'2026-06-01',days:30,pregnant:true,rehabExhausted:true,prognosis:true,rehabGranted:true}}),b,'2026-11-21');assert.equal(capped.periods[0].basis,10000);
});
test('employee history and short business insurance use different formulas',()=>{
  const employee=calcNormalizeInput(fixture({parents:[parent({basisMode:'history',history:[{gross:6000,worked:20,scheduled:20},{gross:3000,worked:10,scheduled:20},{gross:1000,worked:3,scheduled:20}]}),parent()]})).parents[0];assert.equal(calcBasis(employee,rules,'2026-01-01').basis,5177.4);
  const business=calcNormalizeInput(fixture({parents:[parent({occupation:'business',coverage:'voluntary',basisMode:'business-history',history:[{gross:10000,minimum:5652,worked:30,scheduled:30}]}),parent()]})).parents[0];assert.equal(calcBasis(business,rules,'2026-01-01').basis,5189.77);
  assert.throws(()=>calcBasis({...business,basisMode:'salary',salary:100000},rules,'2026-01-01'),/zamiast wynagrodzenia/);
  assert.equal(calcBasis({...business,basisMode:'first-month',minimumBasis:5652,priorTitleMonths:0},rules,'2026-01-01').basis,4877.11);
});
test('three named guide examples: Adam, Krzysztof, Maria',()=>{
  const adam=run({focus:'business',eventDate:'2026-05-07',business:{start:'2026-05-07'}});assert.equal(adam.business.startEnd,'2026-11-30');
  const krzysztof=run({focus:'business',eventDate:'2026-03-01',business:{start:'2026-03-01',previousBusiness:true,previousEnd:'2024-02-10'}});assert.equal(krzysztof.business.startEligible,false);assert.equal(krzysztof.business.preferentialBasis,null);
  const maria=run({focus:'business',eventDate:'2026-01-01',business:{start:'2026-01-01',parentalLeave:true}});assert.ok(maria.facts.some(f=>f.includes('wychowawczego')&&f.includes('tytuł')));
});
test('top-up compares actual net sum, uses calendar-month days and excludes paternity',()=>{
  const r=run({topUpMonth:'2026-02',netReceived1:800});assert.equal(r.topUps[0].threshold,1000);assert.equal(r.topUps[0].topUp,200);
  const partial=run({eventDate:'2025-09-24',topUpMonth:'2026-02',netReceived1:300});assert.equal(partial.topUps[0].days,10);assert.equal(partial.topUps[0].threshold,357.1);assert.equal(partial.topUps[0].topUp,57.1);
});
test('saved cases update without duplicate calendar periods, toggle and delete independently of other app data',()=>{
  const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},store=createCalculatorStore({getStorage:()=>storage,makeId:()=> 'case1'}),r=run({});
  const saved=store.save({title:'Nasz plan',input:r.input,result:r});const count=calculatorCalendarEvents(store.snapshot(),rules).length;assert.ok(count>0);
  store.save({id:saved.id,title:'Poprawiony plan',input:r.input,result:r});assert.equal(store.read().cases.length,1);assert.equal(calculatorCalendarEvents(store.snapshot(),rules).length,count);
  store.toggle(saved.id);assert.equal(calculatorCalendarEvents(store.snapshot(),rules).length,0);store.toggle(saved.id);store.remove(saved.id);assert.equal(store.read().cases.length,0);
});
test('versioned parameters apply by effective date and admin requires authorization, review and revision match',async()=>{
  let data=null;const monitor=createMonitor({catalog:{version:'v1',sources:[],events:[]},calculatorRules:rules,store:{read:async()=>structuredClone(data),write:async s=>data=structuredClone(s)},clock:()=>new Date('2026-11-21T12:00:00Z')});
  const parameters=structuredClone(rules.parameters);parameters.rates.maternity=95;
  await assert.rejects(()=>monitor.updateCalculator({parameters,validFrom:'2027-01-01',previousRevision:rules.revision,verified:false}));
  const updated=await monitor.updateCalculator({parameters,validFrom:'2027-01-01',previousRevision:rules.revision,verified:true,reviewer:'Test reviewer',legalBasis:'Synthetic regression fixture',sourceUrl:'https://www.zus.pl/',transitionNote:'Future version only; isolated test.',note:'Test przyszłej zmiany'});
  assert.equal(calculatorRulesFor(updated,'2026-12-31').parameters.rates.maternity,100);assert.equal(calculatorRulesFor(updated,'2027-01-01').parameters.rates.maternity,95);
  await assert.rejects(()=>monitor.updateCalculator({parameters,validFrom:'2027-02-01',previousRevision:rules.revision,verified:true}));
  const req=new Request('https://app.example/api/calculator/rules',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal((await handleApi(req,monitor,{adminToken:'test-admin-secret'})).status,403);
  assert.throws(()=>validateCalculatorParameters({...parameters,rates:{...parameters.rates,parental:200}}));
});
test('government service operations are explicitly simulated and never send real applications or credentials',async()=>{
  const monitor={read:async()=>({calculatorRules:rules})};
  for(const operation of ['login','insurance','debt','ezla','ezus','application','usc']){const request=new Request('https://app.example/api/calculator/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,debt:500})}),r=await handleApi(request,monitor),body=await r.json();assert.equal(r.status,200);assert.equal(body.simulated,true);assert.equal(body.officiallyValid,false);assert.equal(body.sent,false);}
});

test('changed official pages surface in calculations without automatically replacing approved numeric parameters',()=>{
 const state={calculatorRules:structuredClone(rules),sources:{'calc-maternity':{status:'changed',lastCheckedAt:'2026-11-21T12:00:00Z'}}};
 const visible=publicCalculatorRules(state),r=calculateIntegrated(fixture(),visible,'2026-11-21');assert.equal(r.periods[0].rate,100);assert.equal(r.periods[0].days,140);assert.match(r.warnings[0],/ostatnią zatwierdzoną wersję/);assert.equal(visible.sources.find(s=>s.id==='calc-maternity').status,'changed');
 assert.equal(state.calculatorRules.sources.find(s=>s.id==='calc-maternity').status,undefined);
});
