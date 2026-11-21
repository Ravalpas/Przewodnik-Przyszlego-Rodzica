import {dayNumber,shiftDate} from './age.js';
import {addMonths} from './timeline.js';
import {CalculatorError} from './calculator-params.js';
import {calcDays,calcRound,calcPeriod,calcParent,calcEligibility,calcBasis} from './calculator-core.js';

export function calcPregnancy(input,rules){
  const p=rules.parameters,s=input.sickness,start=s.start||input.eventDate,prebirth=input.focus==='prebirth',rehab=input.focus==='rehab',warnings=[],facts=[],periods=[],deadlines=[];
  const parentInput=input.parents[0],parents=[calcParent(parentInput,start,rules),calcParent(input.parents[1],input.eventDate,rules)],results=[];
  const titleList=[parentInput,...parentInput.extraTitles];
  for(let index=0;index<titleList.length;index++){
    const title=titleList[index],eligibility=calcEligibility(title,start,rules,{sickness:!prebirth&&!rehab,prebirth,rehab}),basisInfo=calcBasis(title,rules,start,parentInput.fte);
    let state={...eligibility,...basisInfo,notes:[eligibility.reason,...eligibility.notes,...basisInfo.notes],canPay:['potential','conditional'].includes(eligibility.status)};
    let paidStart=start,used=s.usedDays;
    if(s.previousEnd){const gap=dayNumber(start)-dayNumber(s.previousEnd)-1;if(gap<0)throw new CalculatorError('Poprzednia choroba nakłada się na nową.','sickness.previousEnd');if(gap>60||gap>0&&s.pregnant)used=0;}
    if(!rehab&&!prebirth&&eligibility.status==='waiting'){
      if(title.insuranceTo&&eligibility.availableFrom>shiftDate(title.insuranceTo,1)){state.status='no';state.canPay=false;state.notes.push('Ubezpieczenie ustało przed ukończeniem okresu wyczekiwania. Nie nabywa się go przez dalszy upływ czasu po ustaniu.');}
      else{paidStart=eligibility.availableFrom;const afterWait=calcEligibility(title,paidStart,rules,{sickness:true});state={...state,...afterWait,notes:[...state.notes,afterWait.reason,...afterWait.notes],canPay:['potential','conditional'].includes(afterWait.status)};}
    }
    if(!prebirth){
      if(s.otherBenefit||s.workingDuring){state.canPay=false;state.status='assessment';state.notes.push('Inne świadczenie lub wykonywanie pracy wymaga indywidualnej oceny wyłączeń.');}
      if(rehab){if(!s.rehabExhausted||!s.prognosis){state.canPay=false;state.status='assessment';state.notes.push('Potwierdź wyczerpanie chorobowego i rokowanie odzyskania zdolności.');}if(!s.rehabGranted){state.status='conditional';warnings.push('Rehabilitacyjne jest planem, nie przyznaniem świadczenia. Prawo i rzeczywisty okres ustala ZUS.');}}
      else if(s.certificate!=='yes'){state.canPay=false;state.status='assessment';state.notes.push('Potrzebne jest e-ZLA, a dla stawki ciążowej kod B lub odrębne potwierdzenie ciąży.');}
    }
    if(!rehab&&!prebirth&&title.insuranceTo&&start>title.insuranceTo&&s.days<30){state.canPay=false;state.status='no';state.notes.push('Nowa choroba po ustaniu wymaga co najmniej 30 nieprzerwanych dni.');}
    let days=prebirth?dayNumber(input.eventDate)-dayNumber(start):Math.max(0,s.days-(dayNumber(paidStart)-dayNumber(start)));
    if(prebirth&&days<=0)throw new CalculatorError('Szczególne świadczenie musi poprzedzać poród.','sickness.start');
    const max=rehab?p.limits.rehab:s.pregnant?p.limits.pregnancySick:p.limits.sick;
    if(!prebirth)days=Math.min(days,Math.max(0,max-(rehab?0:used)));
    if(!rehab&&!prebirth&&!s.pregnant&&title.insuranceTo){const pre=Math.max(0,dayNumber(title.insuranceTo)-dayNumber(paidStart)+1);days=Math.min(days,pre+Math.max(0,91-(s.usedAfterEndDays||0)));}
    let base=state.basis;
    if(rehab&&!s.rehabAlreadyIndexed){const q=Math.floor((Number(start.slice(5,7))-1)/3)+1,v=p.rehabIndex[start.slice(0,4)+'-'+q];if(v===undefined){base=null;warnings.push('Brak wskaźnika waloryzacji dla początku rehabilitacyjnego. Podaj podstawę już zwaloryzowaną.');}else if(base!==null)base=calcRound(base*Math.max(1,v/100));}
    let employerUsed=s.usedEmployerDays,lastYear=paidStart.slice(0,4),benefitContinues=false,last=null;
    for(let offset=0;offset<days;offset++){
      const date=shiftDate(paidStart,offset),ended=title.insuranceTo&&date>title.insuranceTo,year=Number(date.slice(0,4)),fiftieth=parentInput.birthDate?Number(parentInput.birthDate.slice(0,4))+50:null,employerLimit=fiftieth!==null&&year>fiftieth?14:33;
      if(date.slice(0,4)!==lastYear){if(!benefitContinues)employerUsed=0;lastYear=date.slice(0,4);}
      const wage=!prebirth&&!rehab&&title.occupation==='employee'&&!ended&&!benefitContinues&&employerUsed<employerLimit;
      if(wage)employerUsed++;else if(!rehab&&!prebirth)benefitContinues=true;
      let dailyBase=base;
      if(ended&&!prebirth){const cap=p.postInsuranceCap.find(c=>c.from<=date&&(!c.to||c.to>=date));if(cap&&dailyBase!==null)dailyBase=Math.min(dailyBase,cap.amount);else if(title.basisMode!=='known'){dailyBase=null;warnings.push('Po ustaniu ubezpieczenia potrzebny jest właściwy limit podstawy chorobowego/rehabilitacyjnego. Bez niego podaj podstawę już ustaloną przez płatnika; nie pokazujemy niepewnej kwoty.');}}
      const rate=prebirth?p.rates.maternity:s.pregnant?p.rates.pregnancy:rehab?(offset<90?p.rates.rehabFirst:p.rates.rehabLater):p.rates.sickness;
      const titleText=prebirth?'Zasiłek w wysokości macierzyńskiego przed porodem':rehab?'Świadczenie rehabilitacyjne':wage?'Wynagrodzenie chorobowe od pracodawcy':'Zasiłek chorobowy'+(ended?' po ustaniu ubezpieczenia':'');
      const signature=[titleText,rate,dailyBase,state.canPay].join('|');
      if(last&&last.signature===signature){last.days++;last.end=date;if(last.daily!==null)last.gross=calcRound(last.daily*last.days);}
      else{const period=calcPeriod({id:'pregnancy-'+index+'-'+offset,title:titleText+(titleList.length>1?' — tytuł '+(index+1):''),parent:0,start:date,days:1,rate,source:prebirth?'calc-maternity':rehab?'calc-rehab':'calc-sickness'},{...state,basis:dailyBase,titles:[{...state,basis:dailyBase}]});last={...period,signature,titleIndex:index};periods.push(last);}
    }
    if(!prebirth&&!rehab){const end=shiftDate(paidStart,Math.max(0,max-used-1));deadlines.push({id:'sick-end-'+index,title:'Granica okresu chorobowego — tytuł '+(index+1),start:end,end,kind:'reminder',source:'calc-sickness',description:'Granica z wpisanej historii, bez dni wyczekiwania. Po ustaniu zwykle dodatkowy limit 91 dni; ciąża jest wyjątkiem.'});}
    results.push({index,occupation:title.occupation,...state,basis:base});
  }
  const eligible=results.filter(t=>t.canPay),known=eligible.every(t=>t.basis!==null);
  parents[0]={titles:results,basis:eligible.length&&known?calcRound(eligible.reduce((sum,t)=>sum+t.basis,0)):null,canPay:eligible.length>0,status:eligible.length?eligible.some(t=>t.status==='conditional')?'conditional':'potential':results[0].status,notes:results.flatMap(t=>t.notes)};
  if(rehab)facts.push('Waloryzacja działa raz według pierwszego dnia świadczenia, nie jest ponawiana co kwartał. Maksimum 360 dni nie jest automatycznym przyznaniem.');
  else if(!prebirth)facts.push('Tytuły ubezpieczenia rozliczono osobno. Wyczekiwanie nie zużywa okresu zasiłkowego. Przy przerwie i nowej chorobie w ciąży działa szczególny reset okresu. Wynagrodzenie pracodawcy kończy się najpóźniej z zatrudnieniem.');
  return {periods,deadlines,warnings:[...new Set(warnings)],facts,parents};
}

export function calcCare(input,rules){
  const c=input.care,p=rules.parameters,parentIndex=c.parent,start=c.start||input.eventDate,parents=input.parents.map(parent=>calcParent(parent,start,rules)),parent=parents[parentIndex],warnings=[],facts=[],deadlines=[];
  const underTwo=c.ageMonths<24;
  let qualifies=true,limit=p.limits.care;
  if(c.type==='sick-child'){if(c.ageMonths>=168)limit=p.limits.careAdult;}
  if(c.type==='healthy-child'){if(c.ageMonths>=96||!c.qualifyingReason)qualifies=false;if(c.reason==='closure'&&c.closureNotice>=7){qualifies=false;warnings.push('Przy zamknięciu placówki nieprzewidziane zawiadomienie oznacza mniej niż 7 dni wcześniej.');}}
  if(c.type==='disabled-child'){if(!c.disabled||c.ageMonths>=216)qualifies=false;limit=p.limits.careDisabled;}
  if(c.type==='adult')limit=p.limits.careAdult;
  if(c.type==='extra-newborn'){limit=56;if(!input.childBirthDate)throw new CalculatorError('Dodatkowy opiekuńczy wymaga dokładnej daty urodzenia dziecka.','childBirthDate');const elapsed=dayNumber(start)-dayNumber(input.childBirthDate);if(!c.qualifyingReason||elapsed<0||elapsed>=56)qualifies=false;limit=Math.max(0,56-Math.max(0,elapsed));facts.push('Dodatkowy opiekuńczy w ustawowej sytuacji matki podczas pierwszych 8 tygodni jest odrębny od zwykłego rocznego limitu. Okres ograniczono do końca 56. dnia od narodzin.');}
  if(c.type==='adult'&&!c.sameHousehold)qualifies=false;
  if(!c.noOtherCarer&&!(c.type==='sick-child'&&underTwo))qualifies=false;
  if(!qualifies){parent.canPay=false;parent.status='no';warnings.push('Nie potwierdzono warunków tego rodzaju opiekuńczego. Dostępny zdolny domownik, wiek i powód opieki mają znaczenie; dla chorego dziecka do 2 lat istnieje wyjątek.');}
  let remaining=limit;
  if(c.type!=='extra-newborn'){const aggregate=c.onlyOlderDisabled?p.limits.careDisabled:p.limits.care;remaining=Math.max(0,Math.min(aggregate-c.usedAll,limit-(c.type==='adult'||c.type==='sick-child'&&c.ageMonths>=168?c.usedAdult:c.type==='disabled-child'?c.usedDisabled:c.usedAll)));}
  const days=Math.min(c.days,remaining),period=calcPeriod({id:'care',title:c.type==='extra-newborn'?'Dodatkowy zasiłek opiekuńczy':'Zasiłek opiekuńczy',parent:parentIndex,start,days,rate:p.rates.sickness,source:'calc-care'},parent);
  facts.push('Opiekuńczy nie ma wyczekiwania chorobowego. Limity roczne są wspólne dla uprawnionych członków rodziny, a nie osobno po 60 dni dla mamy i taty.',`Pozostało w tej konfiguracji do ${remaining} dni, z czego zaplanowano ${days}.`);
  if(days<c.days)warnings.push('Wnioskowany okres przekracza pozostały limit; wynik został ograniczony.');
  if(days&&shiftDate(start,days-1).slice(0,4)!==start.slice(0,4)&&c.type!=='extra-newborn')throw new CalculatorError('Opiekę przekraczającą koniec roku rozdziel na dwa zapisane scenariusze z właściwymi rocznymi limitami.','care.days');
  return {periods:period?[period]:[],deadlines,warnings,facts,parents};
}

export function calcBusiness(input,rules){
  const b=input.business,p=rules.parameters,start=b.start||input.eventDate,periods=[],deadlines=[],warnings=[],facts=[],values={};
  const noPrevious=!b.previousBusiness||b.previousEnd&&addMonths(b.previousEnd,p.business.lookbackMonths)<=start,eligible=noPrevious&&!b.formerEmployer&&!b.otherExclusion,startEligible=(!b.previousBusiness||!b.previousCEIDG||noPrevious)&&!b.formerEmployer&&!b.otherExclusion;
  const monthStart=start.slice(0,8)+'01',fullStart=start.slice(8)==='01'?start:addMonths(monthStart,1),end=shiftDate(addMonths(fullStart,p.business.startMonths),-1);
  values.startEligible=!!startEligible;values.startEnd=startEligible?end:null;
  if(startEligible){periods.push({id:'business-start',title:'Ulga na start — bez chorobowego z tego tytułu',parent:0,start,end,days:calcDays(start,end),rate:0,daily:null,gross:null,source:'calc-contributions',kind:'information',description:'Opłacanie samej składki zdrowotnej nie daje prawa do zasiłków chorobowego ani macierzyńskiego z tej działalności.'});deadlines.push({id:'business-register',title:'Koniec ulgi na start — sprawdź zgłoszenie do ubezpieczeń',start:shiftDate(end,1),end:shiftDate(end,1),source:'calc-contributions',kind:'reminder'});}else warnings.push('Nie potwierdzono warunków ulgi na start/preferencji: wcześniejsza działalność w 60 miesiącach, usługi dla byłego pracodawcy lub inna przesłanka wyłączenia.');
  const year=start.slice(0,4),minimum=p.minimumWage[year],forecast=p.forecastWage?.[year]??(year==='2026'?p.business.forecast2026:null);
  values.preferentialBasis=eligible&&minimum!==undefined?calcRound(minimum*p.business.preferredShare/100):null;
  if(eligible){const preferenceStart=shiftDate(end,1),preferenceEnd=shiftDate(addMonths(preferenceStart,p.business.preferenceMonths),-1);periods.push({id:'business-preference',title:'Preferencyjna podstawa składek — plan po pełnej uldze na start',parent:0,start:preferenceStart,end:preferenceEnd,days:calcDays(preferenceStart,preferenceEnd),rate:0,daily:null,gross:null,source:'calc-business-ulga',kind:'information',description:'Plan zakłada wykorzystanie całej ulgi na start, brak wyłączeń i prawidłowe zgłoszenie do społecznych. Wcześniejsza rezygnacja z ulgi zmienia daty.'});}
  values.regularBasis=forecast!==null?calcRound(forecast*p.business.regularShare/100):null;values.sicknessCap=forecast!==null?calcRound(forecast*p.business.sicknessCapShare/100):null;
  const revenue=b.revenue,annualLimit=p.business.smallRevenue*b.previousYearDays/(Number(year)-1===2024?366:365),income=b.tax==='lump'?revenue*.5:b.income+b.socialInCosts;
  const smallEligible=b.activeLastYear&&b.previousYearDays>=60&&revenue<=annualLimit&&!b.formerEmployer&&!b.otherExclusion&&b.monthsUsed<36&&!eligible;
  values.smallEligible=smallEligible;values.smallBasis=smallEligible&&minimum!==undefined&&forecast!==null?calcRound(Math.min(forecast*p.business.regularShare/100,Math.max(minimum*p.business.preferredShare/100,Math.round(income/b.previousYearDays*30*100)/100*p.business.smallShare/100))):null;
  if(eligible)facts.push('Prawo do preferencyjnej podstawy wyłącza w tym okresie Mały ZUS Plus. Pokazany dalszy plan zakłada pełne wykorzystanie ulgi na start.');
  if(smallEligible&&values.smallBasis===null)warnings.push('Dla wybranego roku nie mamy pełnego zestawu zweryfikowanych wskaźników Małego ZUS Plus. Przed użyciem kwoty trzeba uzupełnić je w zasadach.');
  facts.push('Od 2026 r. Mały ZUS Plus ma nową pulę 36 miesięcy w każdym 60-miesięcznym okresie. Miesiące wykorzystane do końca 2025 r. nie pomniejszają nowej puli.');
  if(b.parentalLeave)facts.push('Rozpoczęcie obowiązkowo ubezpieczonej działalności podczas wychowawczego zmienia tytuł składek: nie są nadal finansowane z wychowawczego, gdy istnieje inny obowiązkowy tytuł.');
  facts.push('Preferencja dotyczy podstawy składek, nie automatycznie podstawy zasiłku. Chorobowe na JDG jest dobrowolne przy spełnieniu warunków i wymaga zgłoszenia.','Ulga na start obejmuje 6 pełnych miesięcy; rozpoczęcie w środku miesiąca nie zużywa pełnego miesiąca ulgi. Preferencyjna podstawa może przysługiwać przez kolejne 24 miesiące.','Zbiegi etatu, zlecenia, spółek i działalności wymagają oceny tytułu. Etat z co najmniej minimum płacowym może wyłączyć społeczne z JDG i możliwość dobrowolnego chorobowego z niej.');
  return {periods,deadlines,warnings,facts,business:values,parents:[]};
}
