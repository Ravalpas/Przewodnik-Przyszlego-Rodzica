import {PROTECTED_EVENT_IDS} from './event-policy.js';
import {normalizeProfile,validateName} from './profile.js';
import {todayString,dayNumber} from './age.js';
export const CASE_STAGES={planning:'Planowanie narodzin dziecka',pregnancy:'Oczekiwanie narodzin',born:'Dziecko urodzone — bez adopcji i pieczy zastępczej','adoption-pending':'Planowanie lub postępowanie adopcyjne','adoption-placed':'Dziecko przyjęte na wychowanie — adopcja w toku',adopted:'Adopcja prawomocna',foster:'Niezawodowa rodzina zastępcza','related-foster':'Spokrewniona rodzina zastępcza',professional:'Zawodowa rodzina zastępcza','family-home':'Rodzinny dom dziecka','foster-unknown':'Przygotowanie do pieczy zastępczej — forma nieustalona','other-care':'Inna forma opieki',loss:'Wsparcie po stracie dziecka'};
export const CASE_ROLES={mother:'Mama / przyszła mama',father:'Tata / przyszły tata',caregiver:'Osoba sprawująca lub planująca opiekę',family:'Członek rodziny',prospective:'Osoba planująca adopcję',helper:'Osoba wspierająca bliskich',general:'Osoba szukająca informacji',unspecified:'Nie podano roli'};
export const isFosterStage=stage=>['foster','related-foster','professional','family-home','foster-unknown'].includes(stage);
const valid=value=>{if(!value)return '';dayNumber(value);return value;};
const safeId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(value)?value:'';
export const newSituationId=()=>globalThis.crypto?.randomUUID?.()||'s-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export function normalizeFamilySituation(raw){
 const legacy=!raw.formal,stage=Object.hasOwn(CASE_STAGES,raw.caseStage)?raw.caseStage:raw.planning?'planning':raw.mode==='child'?'born':'pregnancy';
 let children=Array.isArray(raw.children)?raw.children:[];if(children.length>20)throw new Error('W jednej sytuacji można zapisać do 20 profili dzieci. Dodaj kolejną sytuację w profilu.');
 children=children.map((c,i)=>({id:safeId(c.id)||'child-'+i,name:validateName(c.name||''),birthDate:valid(c.birthDate)}));
 const selectedChild=children.find(c=>c.id===raw.activeChildId)||children[0];
 const childBirthDate=valid(selectedChild?selectedChild.birthDate:raw.childBirthDate||(legacy&&raw.mode==='child'?raw.anchor:''));
 if(!children.length&&(['born','adoption-placed','adopted','foster','related-foster','professional','family-home','other-care','loss'].includes(stage))&&(childBirthDate||raw.name))children=[{id:'child-0',name:validateName(raw.name||''),birthDate:childBirthDate}];
 if([childBirthDate,...children.map(c=>c.birthDate)].some(d=>d&&d>todayString()))throw new Error('Rzeczywista data urodzenia nie może być przyszła.');
 const placementDate=valid(raw.placementDate),adoptedDate=valid(raw.adoptionCourtDate),applicationDate=valid(raw.adoptionApplicationDate);
 if(placementDate&&[childBirthDate,...children.map(c=>c.birthDate)].some(d=>d&&placementDate<d))throw new Error('Przyjęcie dziecka nie może poprzedzać jego urodzenia.');
 if(adoptedDate&&placementDate&&adoptedDate<placementDate)throw new Error('Prawomocność adopcji nie może poprzedzać przyjęcia dziecka.');
 if(adoptedDate&&applicationDate&&adoptedDate<applicationDate)throw new Error('Prawomocność adopcji nie może poprzedzać wystąpienia do sądu.');
 if([placementDate,adoptedDate,applicationDate].some(d=>d&&d>todayString()))throw new Error('Daty zdarzeń, które już nastąpiły, nie mogą być przyszłe. Datę planowaną podasz w kalkulatorze.');
 const count=Number(raw.childCount||1);if(!Number.isInteger(count)||count<1||count>12)throw new Error('Podaj liczbę dzieci od 1 do 12.');
 const week=raw.gestationWeek===''||raw.gestationWeek==null?null:Number(raw.gestationWeek);if(week!==null&&(!Number.isInteger(week)||week<1||week>45))throw new Error('Jeśli podajesz tydzień ciąży, wpisz pełną liczbę od 1 do 45.');
 const eventDate=valid(stage==='pregnancy'?raw.eventDate||raw.dueDate:stage==='born'?childBirthDate:placementDate);
 const taskIds=value=>Array.isArray(value)?[...new Set(value.filter(id=>typeof id==='string'&&/^[a-z0-9-]{1,60}$/.test(id)))]:[];
 const dates=Object.fromEntries(['birthCardDate','peselDate','parentalLeaveDate'].filter(key=>raw.dates?.[key]).map(key=>[key,valid(raw.dates[key])]));
 return {completedTasks:taskIds(raw.completedTasks),notApplicableTasks:taskIds(raw.notApplicableTasks).filter(id=>!PROTECTED_EVENT_IDS.has(id)),dates,situationId:safeId(raw.situationId)||'primary',caseStage:stage,parentRole:Object.hasOwn(CASE_ROLES,raw.parentRole)?raw.parentRole:'unspecified',activeChildId:selectedChild?.id||children[0]?.id||'',name:validateName(selectedChild?selectedChild.name:raw.name||''),childBirthDate,eventDate,dueDate:stage==='pregnancy'?eventDate:null,placementDate,adoptionApplicationDate:applicationDate,adoptionCourtDate:adoptedDate,childCount:count,children,life:raw.life===true,schoolDelayed:raw.schoolDelayed===true,adoptionStep:['considering','preparing','procedure','court','placed','unknown'].includes(raw.adoptionStep)?raw.adoptionStep:'unknown',fosterPlaced:['yes','no','unknown'].includes(raw.fosterPlaced)?raw.fosterPlaced:(placementDate?'yes':'unknown'),careStatus:['guardian','family','other','unknown'].includes(raw.careStatus)?raw.careStatus:'unknown',planningHorizon:['months','years','unknown'].includes(raw.planningHorizon)?raw.planningHorizon:'unknown',gestationWeek:week,gestationObservedDate:week?valid(raw.gestationObservedDate)||todayString():'',guideOnly:raw.guideOnly===true};
}
export function normalizeCaseProfile(raw,options={}){
 const situation=normalizeFamilySituation(raw),planning=['planning','adoption-pending','foster-unknown'].includes(situation.caseStage)||(isFosterStage(situation.caseStage)&&situation.fosterPlaced!=='yes');
 const base=normalizeProfile({...raw,name:situation.name,mode:situation.caseStage==='pregnancy'?'pregnancy':'child',anchor:situation.childBirthDate||todayString(),planning},options);
 const records=Array.isArray(raw.familySituations)?raw.familySituations:[];if(records.length>30)throw new Error('Można zapisać do 30 sytuacji rodzinnych.');
 const normalized=records.map(r=>normalizeFamilySituation({...r,formal:true}));if(new Set(normalized.map(r=>r.situationId)).size!==normalized.length)throw new Error('Powtarzające się identyfikatory sytuacji rodzinnych.');
 const familySituations=normalized.filter(r=>r.situationId!==situation.situationId);familySituations.push(situation);
 return {...base,...situation,formal:true,caseVersion:3,onboardingComplete:raw.onboardingComplete===true||raw.formal===true||raw.parentRole==='mother'||raw.parentRole==='father',familySituations,applicantName:validateName(raw.applicantName||''),applicantBirthDate:valid(raw.applicantBirthDate),identityOrigin:raw.identityOrigin==='demo'?'demo':'manual'};
}
export function selectFamilySituation(profile,id){const current=normalizeCaseProfile(profile),selected=current.familySituations.find(s=>s.situationId===id);if(!selected)throw new Error('Nie znaleziono sytuacji rodzinnej.');return normalizeCaseProfile({...current,...selected});}
export function caseProfileSummary(profile){return (CASE_ROLES[profile.parentRole]||CASE_ROLES.unspecified)+' · '+(CASE_STAGES[profile.caseStage]||'Ogólne informacje');}
