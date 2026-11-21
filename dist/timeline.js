import {scopeCatalog} from './source-scope.js';
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
  catalog=scopeCatalog(catalog,catalog.activeScope||'all');
  const definitions=catalog.events.map(original=>{
    const version=(original.versions||[]).filter(v=>v.validFrom<=today).sort((a,b)=>a.validFrom.localeCompare(b.validFrom)).at(-1);
    return {...original,...version};
  });
  if(profile.formal){
    const isBirth=profile.caseStage==='born'&&profile.childBirthDate,isPregnancy=profile.caseStage==='pregnancy';
    return definitions.filter(e=>isBirth?e.mode==='child':isPregnancy?e.mode==='pregnancy':false).map(event=>{
      const known={birth:profile.childBirthDate||null,dueDate:isPregnancy?profile.eventDate||null:null,...profile.dates};
      const date=rule=>{const anchor=known[rule?.anchor];return anchor?shiftDate(addMonths(anchor,rule.months||0),rule.days||0):null;};
      let start=date(event.start),end=date(event.end);
      if(event.recurring==='800'&&isBirth){const window=event.calendarWindow||{start:'02-01',end:'06-30'},year=Number(today.slice(0,4))+(today.slice(5)>window.end?1:0);start=year+'-'+window.start;end=year+'-'+window.end;if(start<profile.childBirthDate)start=profile.childBirthDate;}
      const source=catalog.sources.find(s=>s.id===event.source);if(!source)return null;
      const policy=eventPolicy(event),notApplicable=policy.canMarkNotApplicable&&profile.notApplicableTasks?.includes(event.id)||false,done=!notApplicable&&profile.completedTasks?.includes(event.id)||false,daysLeft=end?dayNumber(end)-dayNumber(today):null;
      return {...event,...policy,source,start,end,done,notApplicable,daysLeft,preview:!start&&!end,needsDate:(!start||!end)&&event.timing!=='preparation',important:!done&&!notApplicable&&daysLeft!==null&&daysLeft>=0&&daysLeft<=7};
    }).filter(Boolean);
  }
  if(profile.planning){
    const previews=definitions.map(event=>({...event,...eventPolicy(event),preview:true,source:catalog.sources.find(s=>s.id===(event.source==='vaccines'?(Number(today.slice(0,4))>=2027?'vaccines27':'vaccines26'):event.source)),start:null,end:null,done:false,notApplicable:false,needsDate:false})).filter(e=>e.source);
    const annual=definitions.find(e=>e.recurring==='800'),source=catalog.sources.find(s=>s.id===annual?.source);
    if(annual&&source){const window=annual.calendarWindow||{start:'02-01',end:'06-30'},year=today.slice(0,4);
      previews.push({id:'planning-800-cycle',informational:true,title:'800+ — coroczny cykl wniosków',description:annual.description+' To informacja na przyszłość dla osób spełniających warunki. Samo planowanie dziecka nie daje prawa do 800+ i nie oznacza obowiązku składania wniosku.',mode:'planning',kind:'Informacja na przyszłość',group:'optional',required:false,canMarkNotApplicable:false,source,start:year+'-'+window.start,end:year+'-'+window.end,done:false,notApplicable:false,needsDate:false});
    }
    return previews;
  }
  return definitions.filter(e=>e.mode===profile.mode).map(event=>{
    let start=ruleDate(event.start,profile),end=ruleDate(event.end,profile);
    if(event.recurring==='800'){
      const birth=birthDate(profile),firstYear=Number(birth.slice(0,4)),currentYear=Number(today.slice(0,4));
      const window=event.calendarWindow||{start:'02-01',end:'06-30'},year=today.slice(5)<=window.end?currentYear:currentYear+1;
      start=`${Math.max(year,firstYear)}-${window.start}`;end=`${Math.max(year,firstYear)}-${window.end}`;
      if(start<birth)start=birth;
    }
    const sourceId=event.source==='vaccines'?(Number((start||today).slice(0,4))>=2027?'vaccines27':'vaccines26'):event.source;
    const source=catalog.sources.find(s=>s.id===sourceId);
    const policy=eventPolicy(event);
    const notApplicable=policy.canMarkNotApplicable&&(profile.notApplicableTasks?.includes(event.id)||false);
    const done=!notApplicable&&(profile.completedTasks?.includes(event.id)||false);
    const daysLeft=event.timing==='preparation'?null:end?dayNumber(end)-dayNumber(today):null;
    return {...event,...policy,start,end,source,done,notApplicable,daysLeft,needsDate:!start||!end,important:!done&&!notApplicable&&daysLeft!==null&&daysLeft<=7&&daysLeft>=0};
  });
}
export function milestones(profile) {
  if(profile.planning)return [];
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
  if(profile.planning)return null;
  const birth=birthDate(profile),pregnancy=pregnancyStart(profile),day=dayNumber(date);
  if(birth&&day>=dayNumber(birth)&&day-dayNumber(birth)<365+1)return {mode:'child',week:Math.floor((day-dayNumber(birth))/7)+1};
  if(pregnancy&&day>=dayNumber(pregnancy)&&day-dayNumber(pregnancy)<42*7&&(!birth||day<dayNumber(birth)))return {mode:'pregnancy',week:Math.floor((day-dayNumber(pregnancy))/7)+1};
  return null;
}
export const overlaps=(event,start,end)=>Boolean(event.start&&event.end&&event.start<=end&&event.end>=start);
export function sourceLink(source){return source.url+(source.quote?`#:~:text=${encodeURIComponent(source.quote)}`:'');}
