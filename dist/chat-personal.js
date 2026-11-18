import {ageAt,ageText,todayString,dayNumber} from './age.js';
import {quantity,ordinal,calendarDate,periodText} from './polish.js';
import {addMonths} from './timeline.js';

import {assessChatRequest,policyFold} from './chat-policy.js';
export function childCalendarAge(anchor,today=todayString()) {
  const age=ageAt(anchor,today);
  if(!age.days)return 'Dziecko urodziło się dzisiaj.';
  const [by,bm]=anchor.split('-').map(Number),[ty,tm]=today.split('-').map(Number);
  let months=(ty-by)*12+tm-bm;
  if(addMonths(anchor,months)>today)months--;
  if(months<1)return `${quantity(age.weeks,'weeks')}${age.extraDays?` i ${quantity(age.extraDays,'days')}`:''}`.replace(/^0 tygodni i /,'');
  const years=Math.floor(months/12),rest=months%12,days=dayNumber(today)-dayNumber(addMonths(anchor,months));
  const parts=[years?quantity(years,'years'):'',rest?quantity(rest,'months'):'',days?quantity(days,'days'):''].filter(Boolean);
  return parts.length>1?parts.slice(0,-1).join(', ')+' i '+parts.at(-1):parts[0];
}

// Interpret requested fields against a schema shared with the backend policy.
// A missing field is an explicit unknown, never a reason to reject the topic.
export function personalProfileAnswer(question,profile,today=todayString(),options={}) {
  const assessment=options.assessment||assessChatRequest(question,{history:options.history||[]});
  if(['unrelated','restricted','clarify'].includes(assessment.route))return null;
  if(assessment.hasOtherNeeds&&!options.includeMixed)return null;
  const fields=assessment.profileOverview
    ?['name','age','gender',profile.mode==='pregnancy'?'dueDate':'birthDate']
    :assessment.profileFields;
  const text=policyFold(question),parts=[];
  try {
    const current=ageAt(profile.anchor,today);
    for(const field of [...new Set(fields)]){
      if(field==='name')parts.push(profile.name?'W profilu dziecko jest zapisane jako: '+profile.name+'.':'Nie wpisano jeszcze imienia dziecka w profilu. Możesz uzupełnić je w ustawieniach.');
      if(field==='age'){
        if(profile.mode==='pregnancy')parts.push('Czas ciąży: '+ageText(current)+'. Obecny etap: '+ordinal(current.stage,'weeks')+' ciąży. Wiek po narodzinach zaczniemy liczyć od daty urodzenia.');
        else parts.push(current.days===0?childCalendarAge(profile.anchor,today):'Wiek dziecka: '+childCalendarAge(profile.anchor,today)+(current.days<365?' ('+ordinal(current.stage,'weeks')+' życia)':'')+'.');
      }
      if(field==='stage'&&!fields.includes('age'))parts.push('Obecny etap: '+ordinal(current.stage,'weeks')+' '+(profile.mode==='pregnancy'?'ciąży.':'życia.'));
      if(field==='gender')parts.push('Płeć w profilu: '+({boy:'chłopiec',girl:'dziewczynka',unspecified:'nieoznaczono'}[profile.gender]||'nieoznaczono')+'.');
      if(field==='birthDate')parts.push(profile.mode==='child'?'Zapisana data urodzenia: '+calendarDate(profile.anchor,{long:true})+'.':'W profilu wybrano okres ciąży. Data urodzenia dziecka nie jest jeszcze podana.');
      if(field==='dueDate')parts.push(profile.dueDate?'Podany przewidywany termin porodu: '+calendarDate(profile.dueDate,{long:true})+'. Nie jest to potwierdzona data narodzin.':'Nie wpisano przewidywanego terminu porodu. Możesz uzupełnić go w ustawieniach dat.');
      if(field==='pregnancyStart'){const date=profile.mode==='pregnancy'?profile.anchor:profile.pregnancyStart;parts.push(date?'Zapisany początek liczenia ciąży: '+calendarDate(date,{long:true})+'. To nie jest potwierdzona data poczęcia.':'Nie wpisano początku liczenia ciąży.');}
      if(field==='conceptionDate')parts.push(profile.conceptionDate?'Podana data poczęcia: '+calendarDate(profile.conceptionDate,{long:true})+'.':'Nie wpisano ustalonej daty poczęcia. Nie wyznaczam jej jako pewnej daty na podstawie wieku ciąży.');
    }
    const stateQuestion=!assessment.requestsInstruction&&/oznacz|zaznacz|wykonan|zrobion|zaliczon|nie dotyczy|otwart|pozostal|zostal.{0,15}zrob|co (?:jeszcze )?czeka|co (?:mam|mamy).{0,15}zalatwic/.test(text);
    let related=[];
    if(stateQuestion&&Array.isArray(options.tasks)){
      const tasks=options.tasks.map(task=>({...task,status:task.notApplicable?'not-applicable':task.done?'done':task.needsDate?'needs-date':task.start>today?'waiting':task.end<today?'overdue':'pending'}));
      const excluded=/nie dotyczy/.test(text),todo=/niewykonan|nie.?zrobion|nie.?wykonan|pozostal|otwart|jeszcze|zalatwic/.test(text),done=!excluded&&!todo&&/wykonan|zrobion|zaliczon/.test(text);
      const keywords=(text.match(/[a-z0-9+]{3,}/g)||[]).filter(word=>!/^oznacz|^zaznacz|^wykonan|^zrobion|^zaliczon|^spraw|^aplikac|^profil|^mam$|^mamy$|^juz$|^czy$|^jako$|^jakie$|^moje|^nie$|^dotyczy$|^jest$|^zostalo$|^jeszcze$/.test(word));
      const named=tasks.filter(task=>keywords.some(word=>policyFold(task.title).includes(word.slice(0,Math.max(4,word.length-2)))));
      const selected=(named.length&&named.length<tasks.length?named:tasks.filter(task=>excluded?task.status==='not-applicable':done?task.status==='done':!['done','not-applicable'].includes(task.status))).sort((a,b)=>Number(a.group!=='required')-Number(b.group!=='required')||(a.end||'9999').localeCompare(b.end||'9999'));
      const labels={done:'oznaczone jako wykonane','not-applicable':'nie dotyczy',waiting:'okres jeszcze przed Wami',overdue:'okres w kalendarzu już minął','needs-date':'potrzebna data',pending:'otwarte w obecnym okresie'};
      parts.push(selected.length?'Według oznaczeń i dat w aplikacji:\n'+selected.slice(0,8).map(task=>'• '+task.title+' — '+labels[task.status]+'.').join('\n'):'W tej kategorii nie widzę obecnie spraw w aplikacji.');
      if(selected.length>8)parts.push('Pozostałe sprawy znajdziesz na mapie i w kalendarzu.');
      related=selected.slice(0,3).map(task=>({id:task.id,title:task.title,status:task.status,period:periodText(task,{long:true})}));
    }
    if(!parts.length)return null;
    return {kind:'profile',answer:parts.join('\n\n'),sources:[],tasks:related,local:true,fields};
  }catch{return null;}
}

export function chatSuggestions(profile,today=todayString()) {
  const age=ageAt(profile.anchor,today);
  if(profile.mode==='pregnancy'){
    if(age.weeks<14)return ['Jakie sprawy i badania zaplanować na początku ciąży?','Jak przygotować się do pierwszej wizyty u lekarza?','O jakich prawach w pracy warto teraz pamiętać?','Jakie dokumenty zachowywać podczas ciąży?'];
    if(age.weeks<28)return ['Co warto załatwić w drugim trymestrze?','Jakie badania omówić na najbliższej wizycie?','Jak przygotować się do edukacji przedporodowej?','Jak zaplanować urlopy i świadczenia po porodzie?'];
    if(age.weeks<37)return ['Jakie dokumenty przygotować do porodu?','Jak zaplanować formalności po narodzinach?','O co zapytać położną przed porodem?','Co ustalić w sprawie urlopów rodzicielskich?'];
    return ['Jakie sprawy warto domknąć przed porodem?','Co załatwić w pierwszych dniach po narodzinach?','Jak zorganizować opiekę po wyjściu ze szpitala?','Jakie dokumenty będą potrzebne do zgłoszenia urodzenia?'];
  }
  if(age.days<28)return ['Jakie formalności zostały po narodzinach dziecka?','Jak zgłosić dziecko do ubezpieczenia zdrowotnego?','Jak przygotować się do pierwszej wizyty w POZ?','Jakie świadczenia po narodzinach warto sprawdzić?'];
  if(age.days<180)return ['Jakie sprawy są teraz do załatwienia?','Jak przygotować się do wizyty kontrolnej dziecka?','Gdzie sprawdzić plan kolejnych szczepień?','Jakie terminy świadczeń jeszcze nas dotyczą?'];
  if(age.days<365)return ['O czym pamiętać przed pierwszymi urodzinami?','Jak zaplanować kontrolę zdrowia i rozwoju dziecka?','Jakie sprawy związane z opieką warto przygotować?','Jak sprawdzić uprawnienia do programu Aktywny Rodzic?'];
  return ['Jakie sprawy dotyczą obecnego wieku dziecka?','Jak przygotować się do bilansu zdrowia dziecka?','Gdzie sprawdzić aktualny program szczepień?','Jakie świadczenia i formy opieki warto sprawdzić?'];
}
