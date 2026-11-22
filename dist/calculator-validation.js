import {calcDate,calcNumber} from './calculator-core.js';

// Step validation checks declared inputs only. It does not determine entitlement
// or require a user to invent facts which the legal engine can mark unknown.
export function calculatorStageIssue(input,stage){
 if(input.formalCase?.topic==='funeral')return null;
 const issue=(field,message)=>({field,message,step:stage});
 try{
  if(stage===0){
   calcDate(input.eventDate,'eventDate',true);
   if(input.focus==='family'){
    if(!['birth','adoption','foster','professional'].includes(input.familyType))return issue('familyType','Wybierz sytuację rodzinną właściwą dla tej sprawy.');
    const count=calcNumber(input.count,1,12,'count');if(count===null||!Number.isInteger(count))return issue('count','Podaj całkowitą liczbę dzieci przy jednym porodzie lub jednoczesnym przyjęciu.');
    if(input.familyType!=='birth'){
     if(!input.childBirthDate)return issue('childBirthDate','Podaj datę urodzenia przyjmowanego dziecka przed przejściem dalej.');
     calcDate(input.childBirthDate,'childBirthDate',true);
     if(input.childBirthDate>input.eventDate)return issue('childBirthDate','Data urodzenia dziecka nie może przypadać po przyjęciu na wychowanie.');
     if(input.familyType==='adoption'&&input.dateKind==='actual')calcDate(input.adoptionApplicationDate,'adoptionApplicationDate',true);
     if(['adoption','foster'].includes(input.familyType)&&count>1&&input.adoptionDifferentAges&&!(Number.isInteger(Number(input.adoptionVerifiedDays))&&Number(input.adoptionVerifiedDays)>0))return issue('adoptionVerifiedDays','Podaj wymiar ustalony przez płatnika dla przyjmowanych dzieci w różnym wieku.');
    }
   }
  }
  if(stage===1)for(const [parentIndex,parent]of (input.parents||[]).entries())for(const [titleIndex,title]of [parent,...(parent.extraTitles||[])].entries()){
   const prefix='parents.'+parentIndex+(titleIndex?'.extraTitles.'+(titleIndex-1):'');
   const from=calcDate(title.insuranceFrom,prefix+'.insuranceFrom'),to=calcDate(title.insuranceTo,prefix+'.insuranceTo');
   if(from&&to&&to<from)return issue(prefix+'.insuranceTo','Koniec ubezpieczenia nie może poprzedzać jego początku.');
  }
 }catch(e){return issue(e.field||'eventDate',e.field==='adoptionApplicationDate'?'Podaj datę wystąpienia do sądu o przysposobienie przed przejściem dalej.':e.message);}
 return null;
}

export function calculatorControlIssue(container,stage){
 const invalid=[...container.querySelectorAll('[data-calc-field]')].find(control=>!control.disabled&&!control.checkValidity());
 if(!invalid)return null;
 const label=invalid.closest('label')?.querySelector('span')?.textContent||'Wskazane pole';
 const message=invalid.validity.valueMissing?'Uzupełnij pole „'+label+'” przed przejściem dalej.':'Sprawdź pole „'+label+'” — wpisz poprawną wartość w podanym zakresie.';
 return {field:invalid.dataset.calcField,message,step:stage};
}
