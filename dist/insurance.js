import {dayNumber} from './age.js';
import {CalculatorError} from './calculator-params.js';
export const INSURANCE_ALGORITHM_VERSION='2026-11-22.2';
export const INSURANCE_LAW={basis:'art.6,8,9,11,14 ustawy o systemie ubezpieczeń społecznych',url:'https://www.zus.pl/pracujacy/system-ubezpieczen-spolecznych-w-polsce/zbieg-tytulow-do-ubezpieczen-spolecznych'};
export function insuranceFacts(raw){if(raw==null)return null;if(typeof raw!=='object'||Array.isArray(raw))throw new CalculatorError('Sprawdź dane ubezpieczenia.');const tri=v=>['yes','no','unknown'].includes(v)?v:'unknown',date=v=>{if(!v)return '';dayNumber(v);return v;},money=v=>{if(v===''||v==null)return null;const n=Number(v);if(!Number.isFinite(n)||n<0||n>1e8)throw new CalculatorError('Sprawdź podstawę składek.');return n;};const suspensions=(raw.suspensions||[]);if(!Array.isArray(suspensions)||suspensions.length>20)throw new CalculatorError('Dodaj najwyżej 20 okresów zawieszenia.');return {employmentConfirmed:tri(raw.employmentConfirmed),student:tri(raw.student),ownEmployer:tri(raw.ownEmployer),combinedBasis:tri(raw.combinedBasis),emrCompulsory:tri(raw.emrCompulsory),voluntaryRequested:tri(raw.voluntaryRequested),registered:tri(raw.registered),guaranteedPay:money(raw.guaranteedPay),contributionBase:money(raw.contributionBase),registeredAt:date(raw.registeredAt),returnAfterMaternity:date(raw.returnAfterMaternity),businessForm:['sole','cooperating','single-company','multi-company','partnership','unknown'].includes(raw.businessForm)?raw.businessForm:'unknown',suspensions:suspensions.map(s=>{const from=date(s.from),to=date(s.to);if(from&&to&&to<from)throw new CalculatorError('Sprawdź okres zawieszenia.');return {from,to};})};}
export function insuranceSuspended(title,date){return title.insuranceFacts?.suspensions?.some(s=>s.from<=date&&(!s.to||date<=s.to))||false;}
export function qualifyInsuranceParent(parent,date,rules){const copy=structuredClone(parent),titles=[copy,...(copy.extraTitles||[])],minimum=rules.parameters.minimumWage[date.slice(0,4)],active=t=>!t.insuranceFrom||t.insuranceFrom<=date&&(!t.insuranceTo||t.insuranceTo>=date),employees=titles.filter(t=>t.occupation==='employee'&&active(t)),guaranteed=employees.reduce((n,t)=>n+(t.insuranceFacts?.guaranteedPay||0),0),adequate=minimum!==undefined&&guaranteed>=minimum;
 const birthday=parent.birthDate,age=birthday?Number(date.slice(0,4))-Number(birthday.slice(0,4))-(date.slice(5)<birthday.slice(5)?1:0):null;
 let priorContractBase=0,contractUnknown=false;
 for(const [index,title]of titles.entries()){
  const f=title.insuranceFacts;if(!f)continue;const q={state:'declared',reason:'Dane wymagają potwierdzenia w dokumentach płatnika / eZUS.',basis:INSURANCE_LAW.basis,url:INSURANCE_LAW.url,algorithm:INSURANCE_ALGORITHM_VERSION};title.insuranceQualification=q;
  const deny=reason=>{title.coverage='none';q.state='excluded';q.reason=reason;},unknown=reason=>{title.coverage='unknown';q.state='unknown';q.reason=reason;};
  if(f.suspensions.some(s=>!s.from)){unknown('Uzupełnij początek każdego dodanego okresu zawieszenia.');continue;}
  if(insuranceSuspended(title,date)){deny('Wskazana data przypada na zawieszenie działalności. Nie przyznajemy nowego prawa z tego tytułu; wcześniej nabyte prawa wymagają odrębnej oceny.');continue;}
  if(title.occupation==='employee'){
   if(f.employmentConfirmed==='yes'){title.coverage='compulsory';q.state='derived';q.reason='Potwierdzona umowa o pracę jest obowiązkowym tytułem chorobowego. Nie jest potrzebny osobny wniosek o dobrowolne chorobowe.';}
   else if(title.coverage==='unknown')unknown('Potwierdź, że jest to stosunek pracy, oraz jego rzeczywisty okres.');
   continue;
  }
  if(['contract','student'].includes(title.occupation)){
   if(f.ownEmployer==='yes'){
    if(employees.length>1){for(const e of employees){e.basis=null;e.salary=null;}unknown('Przy kilku pracodawcach potrzebne jest przypisanie własnego zlecenia do konkretnej umowy i ustalenie jej łącznej podstawy. Nie przypisujemy go do pierwszego etatu.');continue;}
    const employer=employees[0];if(!employer){unknown('Praca na rzecz własnego pracodawcy wymaga powiązania z konkretną umową o pracę.');continue;}
    if(employer.basisMode==='salary'&&employer.salary!==null&&title.salary!==null){employer.salary=(employer.salary||0)+title.salary;q.reason='Stałe wynagrodzenie z własnego zlecenia włączono do podstawy pracowniczej, bez drugiego zasiłku z tego samego przychodu.';}
    else if(f.combinedBasis!=='yes'){employer.basis=null;employer.insuranceQualification={...q,state:'unknown-basis',reason:'Przy własnym zleceniu podaj łączną podstawę ustaloną przez pracodawcę, aby nie pominąć ani nie podwoić składników.'};}
    deny('Zlecenie z własnym pracodawcą / na jego rzecz rozliczane jest razem z pracowniczym tytułem, a nie jako drugi niezależny zasiłek.');continue;
   }
   if(f.student==='yes'&&age===null){unknown('Do oceny zlecenia studenta potrzebna jest data urodzenia.');continue;}
   if(f.student==='yes'&&age<26){deny('Student / uczeń przed 26. urodzinami: wskazane zlecenie poza własnym pracodawcą nie jest tytułem chorobowego.');continue;}
   if(title.occupation==='student'&&age!==null&&age>=26)title.occupation='contract';
   if(adequate){deny('Umowa o pracę zapewnia co najmniej minimum. Zewnętrzne zlecenie nie daje obowiązkowych emerytalnego i rentowych, więc nie można z niego wybrać dobrowolnego chorobowego.');continue;}
   if(!titles.some(t=>t.occupation==='business'&&active(t))&&f.ownEmployer==='no'&&f.student!=='unknown'){
    if(minimum===undefined&&f.emrCompulsory==='unknown'){unknown('Brak zweryfikowanego minimum dla wybranego roku; potwierdź obowiązek społecznych z każdego zlecenia.');continue;}
    if(priorContractBase>=minimum){deny('Wcześniejsze wskazane zlecenia osiągają wymagane minimum. Ten dalszy tytuł nie daje dobrowolnego chorobowego bez obowiązkowych emerytalnego i rentowych.');continue;}
    if(parent.insuranceComplete&&employees.every(t=>t.insuranceFacts?.guaranteedPay!==null&&t.insuranceFacts?.guaranteedPay!==undefined))f.emrCompulsory='yes';
    if(contractUnknown){unknown('Nie znamy podstaw wcześniejszych zleceń. Potwierdź kolejność i obowiązek emerytalnego/rentowych.');continue;}
   }
   if(f.contributionBase===null)contractUnknown=true;else priorContractBase+=f.contributionBase;
  }
  if(title.occupation==='business'){
   if(adequate){deny('Etat z co najmniej minimalnym wynagrodzeniem wyłącza obowiązek społecznych z tej działalności. Samo zgłoszenie do chorobowego nie tworzy go przy braku właściwego obowiązku emerytalnego i rentowych.');continue;}
   if(['multi-company','partnership','unknown'].includes(f.businessForm)&&f.emrCompulsory==='unknown'){unknown('Forma działalności / spółki i ewentualne zbiegi wymagają potwierdzenia obowiązku emerytalnego i rentowych.');continue;}
  }
  if(['contract','business'].includes(title.occupation)){
   if(f.emrCompulsory==='no'){deny('Dobrowolne chorobowe z tego tytułu wymaga obowiązkowych emerytalnego i rentowych.');continue;}
   if(f.emrCompulsory==='yes'&&f.voluntaryRequested==='yes'&&f.registered==='yes'){
    const effective=f.registeredAt||title.insuranceFrom;if(!effective){unknown('Podaj datę objęcia dobrowolnym chorobowym.');continue;}
    title.coverage='voluntary';title.insuranceFrom=effective;q.state='derived';q.reason='Potwierdzono obowiązek emerytalnego/rentowych, wniosek oraz objęcie dobrowolnym chorobowym. Daty nadal podlegają ocenie wyczekiwania.';
   }else if(f.voluntaryRequested==='no'||f.registered==='no')deny('Brak dobrowolnego objęcia chorobowym z tego tytułu. Składka zdrowotna nie zastępuje chorobowego.');
   else if(title.coverage==='unknown')unknown('Ustal w eZUS / u płatnika obowiązkowe emerytalne i rentowe oraz datę dobrowolnego chorobowego.');
   if(f.returnAfterMaternity&&(!f.registeredAt||f.registeredAt<f.returnAfterMaternity)){unknown('Po macierzyńskim potrzebne jest ustalenie ponownego objęcia chorobowym. Nie zakładamy go z samego dalszego prowadzenia firmy.');}
  }
 }
 return copy;
}
