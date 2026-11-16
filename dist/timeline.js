import { todayString,dayNumber,shiftDate } from './age.js';
import { eventPolicy } from './event-policy.js';
export function addMonths(value,months){const [y,m,d]=value.split('-').map(Number),target=new Date(Date.UTC(y,m-1+months,1));target.setUTCDate(Math.min(d,new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate()));return target.toISOString().slice(0,10);}
export function pregnancyStart(profile){return profile.mode==='pregnancy'?profile.anchor:profile.pregnancyStart||null;}
export function birthDate(profile){return profile.mode==='child'?profile.anchor:null;}
export function ruleDate(rule,profile){
  const anchors={pregnancy:pregnancyStart(profile),birth:birthDate(profile),dueDate:profile.dueDate,...profile.dates};
  const anchor=anchors[rule.anchor];if(!anchor)return null;
  return shiftDate(addMonths(anchor,rule.months||0),rule.days||0);
}
export function datedEvents(catalog,profile,today=todayString()) {
  return catalog.events.filter(e=>e.mode===profile.mode).map(original=>{
    const version=(original.versions||[]).filter(v=>v.validFrom<=today).sort((a,b)=>a.validFrom.localeCompare(b.validFrom)).at(-1);
    const event={...original,...version};
    let start=ruleDate(event.start,profile),end=ruleDate(event.end,profile);
    if(event.recurring==='800'){
      const birth=birthDate(profile),firstYear=Number(birth.slice(0,4)),currentYear=Number(today.slice(0,4));
      const year=today.slice(5)<='06-30'?currentYear:currentYear+1;
      start=`${Math.max(year,firstYear)}-02-01`;end=`${Math.max(year,firstYear)}-06-30`;
      if(start<birth)start=birth;
    }
    const sourceId=event.source==='vaccines'?(Number((start||today).slice(0,4))>=2027?'vaccines27':'vaccines26'):event.source;
    const source=catalog.sources.find(s=>s.id===sourceId);
    const policy=eventPolicy(event);
    const notApplicable=policy.canMarkNotApplicable&&(profile.notApplicableTasks?.includes(event.id)||false);
    const done=!notApplicable&&(profile.completedTasks?.includes(event.id)||false);
    const daysLeft=end?dayNumber(end)-dayNumber(today):null;
    return {...event,...policy,start,end,source,done,notApplicable,daysLeft,needsDate:!start||!end,important:!done&&!notApplicable&&daysLeft!==null&&daysLeft<=7&&daysLeft>=0};
  });
}
export function milestones(profile) {
  const list=[],pregnancy=pregnancyStart(profile),birth=birthDate(profile);
  if(pregnancy){
    list.push({id:'pregnancy-origin',title:'Początek liczenia ciąży',start:pregnancy,end:shiftDate(pregnancy,6),type:'pregnancy',description:'Tydzień początku liczenia wieku ciąży. To data odniesienia wieku ciążowego, a nie potwierdzona data zapłodnienia.'});
    list.push({id:'conception',title:profile.conceptionDate?'Podana data poczęcia':'Orientacyjny tydzień poczęcia',start:profile.conceptionDate||shiftDate(pregnancy,14),end:profile.conceptionDate||shiftDate(pregnancy,20),type:'conception',description:profile.conceptionDate?'Data podana przez rodzica.':'Schematyczne przybliżenie: tydzień około dwóch tygodni po początku liczenia ciąży. Nie ustala rzeczywistego dnia zapłodnienia ani nie obejmuje wszystkich możliwych dat. Owulacja i datowanie ciąży mogą się różnić.',url:'https://www2.hse.ie/pregnancy-birth/baby-development-pregnancy-stages/stages/0-8-weeks/'});
  }
  if(birth)list.push({id:'birth',title:`Narodziny${profile.birthTime?` · ${profile.birthTime}`:''}`,start:birth,end:birth,type:'birth',description:'Rzeczywista data urodzenia podana przez rodzica. Od niej liczymy wiek dziecka.'});
  else if(pregnancy){const due=profile.dueDate||shiftDate(pregnancy,280);list.push({id:'due',title:profile.dueDate?'Podany termin porodu':'Szacowany termin porodu',start:due,end:due,type:'birth',description:profile.dueDate?'Termin wpisany przez rodzica. Termin przewidywany nie jest gwarantowaną datą narodzin.':'Orientacyjnie 40 tygodni od początku liczenia ciąży. Możesz wpisać termin ustalony podczas opieki nad ciążą w ustawieniach dat.'});}
  if(birth)list.push({id:'birthday',title:'Pierwsze urodziny',start:addMonths(birth,12),end:addMonths(birth,12),type:'birth',description:'Pierwsza rocznica urodzin według daty kalendarzowej, niezależnie od 52 etapów mapy.'});
  return list;
}
export function weekOnDate(profile,date){
  const birth=birthDate(profile),pregnancy=pregnancyStart(profile),day=dayNumber(date);
  if(birth&&day>=dayNumber(birth)&&day-dayNumber(birth)<365+1)return {mode:'child',week:Math.floor((day-dayNumber(birth))/7)+1};
  if(pregnancy&&day>=dayNumber(pregnancy)&&day-dayNumber(pregnancy)<42*7&&(!birth||day<dayNumber(birth)))return {mode:'pregnancy',week:Math.floor((day-dayNumber(pregnancy))/7)+1};
  return null;
}
export const overlaps=(event,start,end)=>Boolean(event.start&&event.end&&event.start<=end&&event.end>=start);
export function sourceLink(source){return source.url+(source.quote?`#:~:text=${encodeURIComponent(source.quote)}`:'');}
