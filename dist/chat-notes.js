import {todayString,dayNumber} from './age.js';
import {quantity,calendarDate} from './polish.js';
import {NOTE_COLORS,validateNote,sortNotes,noteTitle} from './notes.js';
import {policyFold} from './chat-policy.js';

const notesTopic=/notat|szpil|zapisk|umowion|zaplanowan|moj.{0,20}wizyt|nasz.{0,20}wizyt|mam.{0,20}(?:wizyt|kalendarz)|kalendarz/;
const notesAdvice=/przygot|poradz|doradz|co zabrac|powinn|czy mus|obowiaz|nalezy|bezpiecz|co oznacz|wyjasn|przepis|uprawn|dawk|leczen|czy mog|czy moz|porownaj|zaleca|zinterpret|ocen/;
const noteShift=(date,days)=>new Date((dayNumber(date)+days)*86400000).toISOString().slice(0,10);
export function notesIntent(question,history=[]) {
  const text=policyFold(question),prior=[...history].reverse().find(m=>m.role==='user');
  const follow=/^(?:a |i )?(?:jutro|dzis|dzisiaj|pojutrze|wczoraj|w (?:tym|przyszlym) tygodniu|czerwone|zielone|zolte|pomaranczowe|niebieskie)[?!. ]*$/.test(text);
  const related=notesTopic.test(text)||follow&&notesTopic.test(policyFold(prior?.content));
  const mutation=/\b(?:dodaj|zapisz|usun|zmien|przenies|edytuj)\b/.test(text);
  return {related,read:related&&!notesAdvice.test(text)&&!mutation,mutation,query:follow?question+' '+prior.content:question};
}
export function selectChatNotes(question,snapshot,{today=todayString(),history=[]}={}) {
  const intent=notesIntent(question,history),text=policyFold(intent.query);
  if(!snapshot?.available)return {available:false,related:intent.related,notes:[],total:0,matched:0,partial:false};
  const all=sortNotes(snapshot.notes||[]);let notes=all,start=null,end=null;
  const iso=text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if(iso){try{dayNumber(iso);start=end=iso;}catch{}}
  if(!start){
    const numeric=text.match(/\b(\d{1,2})[./](\d{1,2})(?:[./](20\d{2}))?\b/);
    if(numeric){const candidate=`${numeric[3]||today.slice(0,4)}-${numeric[2].padStart(2,'0')}-${numeric[1].padStart(2,'0')}`;try{dayNumber(candidate);start=end=candidate;}catch{}}
  }
  if(!start){
    const months=['stycz','lut','marc','kwiet','maj','czerw','lip','sierp','wrzes','pazdz','listop','grud'];
    const date=text.match(/\b(\d{1,2})\.?\s+([a-z]+)(?:\s+(20\d{2}))?/);
    if(date){const m=months.findIndex(prefix=>date[2].startsWith(prefix));if(m>=0){const candidate=`${date[3]||today.slice(0,4)}-${String(m+1).padStart(2,'0')}-${date[1].padStart(2,'0')}`;try{dayNumber(candidate);start=end=candidate;}catch{}}}
  }
  if(!start){
    if(/pojutrze/.test(text))start=end=noteShift(today,2);
    else if(/jutro|jutrzej/.test(text))start=end=noteShift(today,1);
    else if(/wczoraj/.test(text))start=end=noteShift(today,-1);
    else if(/dzis/.test(text))start=end=today;
    else if(/(?:tym|ten|biezacym|przyszlym|nastepnym) tygodni/.test(text)){
      const weekday=(new Date(dayNumber(today)*86400000).getUTCDay()+6)%7;
      start=noteShift(today,-weekday+(/przyszlym|nastepnym/.test(text)?7:0));end=noteShift(start,6);
    }else {
      const weekdays=[/niedziel/,/poniedzial/,/wtorek|wtork/,/srod/,/czwart/,/piatek|piatk/,/sobot/],target=weekdays.findIndex(pattern=>pattern.test(text));
      if(target>=0){const weekday=new Date(dayNumber(today)*86400000).getUTCDay();let delta=(target-weekday+7)%7;if(!delta&&/przyszl|nastepn/.test(text))delta=7;start=end=noteShift(today,delta);}
      else if(/najbliz|nadchodz|przyszl|jeszcze|przed nami/.test(text))start=today;
    }
  }
  if(start)notes=notes.filter(n=>n.date>=start&&(!end||n.date<=end));
  const color=Object.keys(NOTE_COLORS).find(c=>({red:/czerwon/,green:/zielon/,yellow:/zolt/,orange:/pomarancz/,blue:/niebiesk/}[c]).test(text));
  if(color)notes=notes.filter(n=>n.color===color);
  const keywords=[...new Set(text.match(/[a-z]{4,}/g)||[])].filter(w=>! /^(?:notat|szpil|zapisk|pokaz|podaj|powiedz|przypom|odczyt|wymien|wszyst|moj|moich|nasz|mam|jakie|kiedy|ktore|ile|czy|jest|zapis|mamy|wizy|umowion|zaplanowan|kalendarz|dotycz|dzis|jutro|jutrzej|pojutrze|wczoraj|tygodn|przysz|nastepn|biezac|najbliz|nadchodz|czerwon|zielon|zolt|pomarancz|niebiesk|listop|stycz|kwiet|czerw|sierp|wrzes|pazdz|grud|lipiec|lutego|marca|roku|termin|godzin|mozesz|znajdz|sprawdz|zawart|informac|tekst|tresc|miesiac|przygot|prosze|pytan|podsum|pomoc|pomoz|poniedzial|wtorek|wtork|srod|czwart|piatek|piatk|sobot|niedziel)/.test(w));
  const stem=w=>w.slice(0,Math.max(4,w.length-3));
  if(keywords.length){const ranked=notes.map(n=>({note:n,score:keywords.filter(w=>policyFold(n.text).includes(stem(w))).length})).sort((a,b)=>b.score-a.score||a.note.date.localeCompare(b.note.date));notes=ranked.filter(n=>n.score).map(n=>n.note);}
  // Non-note questions get only matching notes, never a dump of unrelated entries.
  if(!intent.related&&!keywords.length)notes=[];
  const matched=notes.length,selected=notes.slice(0,8);
  return {available:true,related:intent.related,total:all.length,matched,partial:matched>selected.length,notes:selected};
}
export function localNotesAnswer(question,snapshot,options={}) {
  const intent=notesIntent(question,options.history);if(!intent.read)return null;
  const selected=selectChatNotes(question,snapshot,options);
  if(!selected.available)return {answer:'Nie mogę teraz odczytać Twoich notatek z tej przeglądarki. Otwórz kalendarz i sprawdź komunikat przy notatkach.',notes:[],local:true};
  if(!selected.matched)return {answer:selected.total?'Nie widzę notatek pasujących do tego pytania. Możesz sprawdzić inny dzień lub doprecyzować treść zapisku.':'Nie masz jeszcze notatek w kalendarzu. Wybierz dzień i naciśnij „Dodaj notatkę”.',notes:[],local:true};
  const answer='Według Twoich notatek w kalendarzu (liczba pasujących wpisów: '+selected.matched+'):\n\n'+selected.notes.map(n=>'• '+calendarDate(n.date,{long:true})+(n.time?', godz. '+n.time:'')+' ('+NOTE_COLORS[n.color].name+' szpilka):\n'+n.text.slice(0,500)+(n.text.length>500?'… [Pełna treść po otwarciu notatki]':'')).join('\n\n')+(selected.partial?'\n\nPokazuję '+quantity(selected.notes.length,'notes')+' z '+selected.matched+' pasujących wpisów. Zawęź pytanie do daty lub tematu.':'');
  return {answer,notes:selected.notes.map(n=>({id:n.id,title:noteTitle(n),date:n.date,time:n.time,color:n.color})),local:true};
}
export function chatNotesContext(question,snapshot,options={}) {
  const selected=selectChatNotes(question,snapshot,options);
  return {...selected,notes:selected.notes.map(n=>({id:n.id,date:n.date,time:n.time,color:n.color,text:n.text.slice(0,700),textTruncated:n.text.length>700}))};
}
export function validateChatNotes(raw) {
  if(raw===undefined)return {available:false,total:0,matched:0,partial:false,notes:[]};
  if(!raw||typeof raw.available!=='boolean'||!Array.isArray(raw.notes)||raw.notes.length>8||!Number.isInteger(raw.total)||raw.total<0||raw.total>500||!Number.isInteger(raw.matched)||raw.matched<0||raw.matched>raw.total)throw new Error('Nieprawidłowy kontekst notatek.');
  const notes=raw.notes.map(n=>{if(typeof n?.text!=='string'||n.text.length>700)throw new Error('Zbyt długa treść notatki.');const {id,date,time,color,text,textTruncated}=validateNote(n);return {id,date,time,color,text,textTruncated:textTruncated===true};});
  if(notes.length>raw.matched||new Set(notes.map(n=>n.id)).size!==notes.length||!raw.available&&notes.length)throw new Error('Niespójny kontekst notatek.');
  return {available:raw.available,total:raw.total,matched:raw.matched,partial:raw.partial===true||raw.matched>notes.length,notes};
}

// The API caps UTF-8 bytes, so non-ASCII text must count as several bytes.
export function chatRequestBody(payload) {
  const value={...payload,history:[...(payload.history||[])]};
  while(new TextEncoder().encode(JSON.stringify(value)).length>39000&&value.history.length)value.history.splice(0,2);
  if(new TextEncoder().encode(JSON.stringify(value)).length>39000)throw new Error('Pytanie z kontekstem jest zbyt długie. Skróć je lub zawęź temat notatek.');
  return JSON.stringify(value);
}
