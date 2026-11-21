import {dayNumber,todayString} from './age.js';
export const CALCULATOR_STORAGE_KEY='ppm-calculator-v1';
export function calculatorChatAnswer(question,snapshot){
  const folded=question.normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l').toLowerCase();
  const asksSaved=/kalkulator|scenariusz|zapisany.*plan|plan.*zapis/.test(folded),asksCalculation=/(oblicz|policz|wylicz|ile.*(?:otrzym|dostan|wynies|zasil|swiadczen))/.test(folded)&&/zasil|urlop|sklad|swiadczen|macierzyn|rodzicielsk|chorobow|rehabilit/.test(folded);
  if(!asksSaved&&!asksCalculation)return null;
  const tasks=[{id:'integrated-calculator',title:'Otwórz Zintegrowany Kalkulator',status:'information'}];
  if(!snapshot.available)return {answer:'Nie mogę teraz odczytać zapisanych scenariuszy. Otwórz Zintegrowany Kalkulator, aby sprawdzić zapis lub wprowadzić dane do wyliczenia.',tasks};
  if(asksCalculation)return {answer:'Sprawdźmy to w Zintegrowanym Kalkulatorze. Uwzględnia oddzielne ubezpieczenie i podstawę każdego rodzica, podział opieki oraz wybraną wersję zasad. Tam obliczysz i zapiszesz kwoty wraz z terminami w kalendarzu.',tasks};
  return {answer:snapshot.cases.length?'W zapisanych przez Was scenariuszach:\n'+snapshot.cases.slice(0,5).map(c=>{const periods=c.result.periods;const dates=periods.length?' · '+periods.map(p=>p.start).sort()[0]+' – '+periods.map(p=>p.end).sort().at(-1):'';return c.title+dates+' · '+(c.calendarEnabled?'terminy w kalendarzu':'terminy ukryte w kalendarzu')+'.';}).join('\n')+'\nTo zapisane symulacje, nie decyzje ZUS. Szczegóły i ponowne przeliczenie znajdziesz w kalkulatorze.':'Nie macie jeszcze zapisanych scenariuszy. W Zintegrowanym Kalkulatorze możecie przygotować pierwszy plan i dodać jego terminy do kalendarza.',tasks};
}
const calculatorId=()=>globalThis.crypto?.randomUUID?.()||'calc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export function createCalculatorStore({getStorage=()=>globalThis.localStorage,clock=()=>new Date().toISOString(),makeId=calculatorId}={}){
  function read(){
    let raw;try{raw=getStorage().getItem(CALCULATOR_STORAGE_KEY);}catch{throw new Error('Nie można odczytać zapisanych scenariuszy.');}
    if(!raw)return {version:1,cases:[],draft:null};
    let data;try{data=JSON.parse(raw);}catch{throw new Error('Zapis scenariuszy jest nieczytelny. Nie został usunięty.');}
    if(data.version!==1||!Array.isArray(data.cases)||data.cases.length>30)throw new Error('Nieprawidłowy zapis scenariuszy. Dotychczasowe dane pozostają zachowane.');
    for(const record of data.cases){if(!/^[a-zA-Z0-9_-]{1,100}$/.test(record.id)||typeof record.title!=='string'||record.title.length>160||!record.input||!record.result||!Array.isArray(record.result.periods)||record.result.periods.length>100)throw new Error('Nie udało się odczytać zapisanego scenariusza.');for(const period of [...record.result.periods,...(record.result.deadlines||[])]){dayNumber(period.start);dayNumber(period.end);if(period.start>period.end||typeof period.title!=='string')throw new Error('Nieprawidłowe daty zapisanego scenariusza.');}}
    if(new Set(data.cases.map(c=>c.id)).size!==data.cases.length)throw new Error('Powtarzające się identyfikatory scenariuszy.');return data;
  }
  function write(data){try{getStorage().setItem(CALCULATOR_STORAGE_KEY,JSON.stringify(data));}catch{throw new Error('Nie udało się zapisać scenariusza. Poprzednie zapisy pozostały zachowane.');}}
  return {
    read,snapshot:()=>{try{return {...read(),available:true};}catch(e){return {version:1,cases:[],draft:null,available:false,error:e.message};}},
    draft:input=>{const data=read();write({...data,draft:structuredClone(input)});},
    save:({id,title,input,result})=>{const data=read(),old=data.cases.find(c=>c.id===id);if(!old&&data.cases.length>=30)throw new Error('Masz już 30 scenariuszy. Usuń niepotrzebny przed zapisaniem kolejnego.');const record={id:old?.id||makeId(),title:String(title||result.title).trim().slice(0,160)||'Mój scenariusz',input:structuredClone(input),result:structuredClone(result),calendarEnabled:old?.calendarEnabled!==false,createdAt:old?.createdAt||clock(),updatedAt:clock()};write({...data,draft:input,cases:[record,...data.cases.filter(c=>c.id!==record.id)]});return record;},
    toggle:id=>{const data=read(),record=data.cases.find(c=>c.id===id);if(!record)throw new Error('Nie znaleziono scenariusza.');record.calendarEnabled=!record.calendarEnabled;write(data);return record;},
    remove:id=>{const data=read();write({...data,cases:data.cases.filter(c=>c.id!==id)});}
  };
}
export function calculatorCalendarEvents(snapshot,bundle,today=todayString()){
  const sources=bundle?.sources||[];
  return snapshot.cases.filter(c=>c.calendarEnabled).flatMap(record=>[...record.result.periods.filter(p=>p.kind==='information'||['potential','conditional'].includes(p.eligibility)),...(record.result.deadlines||[])].map(period=>({
    ...period,id:'calc-'+record.id+'-'+period.id,title:period.title,description:`${record.title}. ${period.description||''} Plan zapisany w kalkulatorze według zasad ${record.result.rulesVersion}. Nie jest decyzją ZUS ani potwierdzeniem udzielenia urlopu.`,source:sources.find(s=>s.id===period.source)||record.result.sources?.find(s=>s.id===period.source)||{id:'calc-documents',name:'ZUS',url:'https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty',section:'Niezbędne dokumenty'},mode:record.input.familyType==='birth'?'child':'planning',group:'optional',kind:period.kind==='deadline'?'Termin z zapisanej kalkulacji':'Plan z kalkulatora',required:false,canMarkNotApplicable:false,informational:true,done:false,notApplicable:false,needsDate:false,important:false,calculatorCase:record.id,calculatorVersion:record.result.rulesVersion,daysLeft:dayNumber(period.end)-dayNumber(today)
  })));
}
