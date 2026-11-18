import {ageAt,ageText,todayString,dayNumber} from './age.js';
import {quantity,ordinal} from './polish.js';
import {addMonths} from './timeline.js';

const personalFold=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l').toLowerCase();
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

// Answers about facts already held by the app need neither a medical source
// nor an inference request. Names remain local, including in later AI history.
export function personalProfileAnswer(question,profile,today=todayString()) {
  const text=personalFold(question);
  if(text.length>450||/wniosk|zglos|swiadcz|szczep|badani|lecz|goracz|objaw|boli|chorob|podat|ubezpiec|program|napisz kod|ignoruj|instrukcj|system prompt|api key/.test(text))return null;
  const child=/dziec|maluch|moj(?:ego|a)? syn|moj(?:ej|a)? cork/.test(text);
  const name=/imie|imiona|nazywa|nazwisk/.test(text);
  const age=/\bwiek\b|\blat\b|\blata\b|miesiac|miesiec|tygodni|tydzien|\bdni\b|\bdzien\b/.test(text);
  const summary=/co (?:wiesz|pamietasz).{0,35}(?:dzieck|maluch)|jakie (?:dane|informacje).{0,30}(?:dzieck|profil)/.test(text);
  if(!summary&&!(name&&child)&&!(age&&(child||/ile ma\b|ciaz/.test(text))))return null;
  try {
    const current=ageAt(profile.anchor,today),parts=[];
    if(name||summary)parts.push(profile.name?`W profilu dziecko jest zapisane jako: ${profile.name}.`:'Nie wpisano jeszcze imienia dziecka w profilu. Możesz uzupełnić je w ustawieniach.');
    if(age||summary){
      if(profile.mode==='pregnancy')parts.push(`Czas ciąży: ${ageText(current)}. Obecny etap: ${ordinal(current.stage,'weeks')} ciąży. Wiek po narodzinach zaczniemy liczyć od daty urodzenia.`);
      else parts.push(current.days===0?childCalendarAge(profile.anchor,today):`Wiek dziecka: ${childCalendarAge(profile.anchor,today)}${current.days<365?` (${ordinal(current.stage,'weeks')} życia)`:''}.`);
    }
    return {kind:'profile',answer:parts.join('\n\n'),sources:[],tasks:[],local:true};
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
