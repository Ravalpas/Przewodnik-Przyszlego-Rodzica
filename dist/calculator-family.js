import {dayNumber,shiftDate} from './age.js';
import {addMonths} from './timeline.js';
import {CalculatorError} from './calculator-params.js';
import {calcDays,calcMinDate,calcMaxDate,calcMergeIntervals,calcPeriod,calcParent} from './calculator-core.js';

export function calcSupplement(input){
  const birth=input.familyType==='birth'?input.eventDate:input.childBirthDate;
  if(!birth||!input.hospitals.length)return {days:0,weeks:0,hospitalDays:0,notes:[]};
  const early=input.gestation<28||input.birthWeight<=1000,preterm=input.gestation<37,windowDays=early?105:56,windowStart=preterm||early?birth:shiftDate(birth,4),windowEnd=shiftDate(birth,windowDays-1);
  const start=input.familyType==='birth'?windowStart:calcMaxDate(windowStart,input.eventDate),totals=[];
  for(let child=1;child<=input.count;child++){
    const stays=input.hospitals.filter(h=>h.child===child);
    if(stays.some(h=>h.end<h.start||h.start<birth))throw new CalculatorError('Sprawdź okres hospitalizacji: wypis nie może poprzedzać przyjęcia ani narodzin.','hospitals');
    const merged=calcMergeIntervals(stays,birth,shiftDate(birth,1000));
    const qualifies=early||preterm||merged.some(h=>{const first=calcMaxDate(h.start,shiftDate(birth,4));return first<=shiftDate(birth,27)&&h.end>=shiftDate(first,1);});
    const days=qualifies?calcMergeIntervals(stays,start,windowEnd).reduce((sum,h)=>sum+calcDays(h.start,h.end),0):0;totals.push(days);
  }
  const days=Math.max(...totals),weeks=Math.ceil(days/7);
  return {days:weeks*7,weeks,hospitalDays:days,windowStart:start,windowEnd,notes:[early?'Kategoria do 15 tygodni: przed ukończeniem 28. tygodnia lub masa do 1000 g włącznie.':preterm?'Kategoria wcześniacza do 8 tygodni.':'Poród o czasie: sprawdzono co najmniej 2 kolejne dni pobytu z początkiem między 5. a 28. dobą.',input.count>1?'Podaj najniższą masę z porodu; uwzględniono pobyt najdłużej hospitalizowanego dziecka, bez sumowania pobytów różnych dzieci.':'Dni połączono bez podwajania nakładających się pobytów; zaokrąglono dopiero łączną liczbę dni.']};
}
export function calcFamily(input,rules,parents){
  const p=rules.parameters,periods=[],deadlines=[],warnings=[],facts=[],event=input.familyType==='adoption'&&input.adoptionApplicationDate?calcMaxDate(input.eventDate,input.adoptionApplicationDate):input.eventDate,birth=input.familyType==='birth'?event:input.childBirthDate;
  const primary=input.familyType==='birth'?0:input.primaryParent,secondForRates=1-primary;
  const acquired=input.parents.map(parent=>calcParent(parent,event,rules));
  const add=(data)=>{const original=acquired[data.parent],end=shiftDate(data.start,data.days-1),cuts=[data.start,shiftDate(end,1),...input.parents[data.parent].extraTitles.concat(input.parents[data.parent]).map(t=>t.insuranceFrom).filter(d=>d&&d>data.start&&d<=end&&d<event),...original.titles.map(t=>t.paymentFrom).filter(d=>d&&d>data.start&&d<=end),...(data.start<event&&input.familyType==='birth'&&data.id.startsWith('maternity')?[event]:[])].sort();let first;for(let j=0;j<cuts.length-1;j++){if(cuts[j]===cuts[j+1])continue;const beforeBirth=cuts[j]<event&&input.familyType==='birth',at=beforeBirth?calcParent(input.parents[data.parent],cuts[j],rules):original.canPay?original:calcParent(input.parents[data.parent],cuts[j],rules);if(at.canPay&&!parents[data.parent].canPay)parents[data.parent]=at;const period=calcPeriod({...data,id:j?data.id+'-segment-'+j:data.id,start:cuts[j],days:dayNumber(cuts[j+1])-dayNumber(cuts[j])},at);if(period){if(at.status==='no'){period.daily=0;period.gross=0;period.monthly30=0;period.description='Brak prawa w tej części okresu według podanego tytułu i dat ubezpieczenia.';}if(at.titles.some(t=>t.paymentFrom)&&!at.titles.some(t=>['potential','conditional'].includes(t.status)&&(!t.paymentFrom||t.paymentFrom<=cuts[j]))){period.daily=0;period.gross=0;period.monthly30=0;period.eligibility='blocked';period.description='Okres przed późną spłatą zadłużenia — wypłata za tę część nie została odzyskana.';}periods.push(period);first??=period;}}return first;};
  const deadline=(id,title,date,source='calc-documents',detail='')=>{if(date)deadlines.push({id,title,start:date,end:date,source,kind:'deadline',description:detail});};
  if(input.familyType==='professional'){for(const parent of parents){parent.canPay=false;parent.status='no';parent.basis=null;parent.notes.push('Sama zawodowa piecza zastępcza nie daje prawa do zasiłku za okres na warunkach macierzyńskiego.');}return {periods,deadlines,warnings:['Zawodowa rodzina zastępcza nie ma tego uprawnienia na zasadach urlopu na warunkach macierzyńskiego. Sprawdź inne tytuły i wsparcie w ZUS.'],facts,supplement:{days:0},limits:{maternity:0,parental:0}};}
  if(input.familyType==='adoption'&&input.dateKind==='actual'&&!input.adoptionApplicationDate)throw new CalculatorError('Podaj datę wystąpienia do sądu o przysposobienie. Samo przyjęcie lub rozpoczęcie planów nie wystarcza.','adoptionApplicationDate');
  if(input.familyType!=='birth'&&!birth)throw new CalculatorError('Podaj datę urodzenia przyjmowanego dziecka.','childBirthDate');
  if(birth>event)throw new CalculatorError('Dziecko nie może urodzić się po przyjęciu na wychowanie.','childBirthDate');
  if(input.prenatalDays>p.limits.prenatal)throw new CalculatorError(`Przed porodem można wykorzystać najwyżej ${p.limits.prenatal} dni macierzyńskiego.`,'prenatalDays');
  let maternity=p.limits['maternity'+Math.min(input.count,5)]*7,parental=(input.life?(input.count>1?p.limits.lifeMany:p.limits.life1):(input.count>1?p.limits.parentalMany:p.limits.parental1))*7;
  let endAge=null;
  if(input.familyType!=='birth'){
    endAge=addMonths(birth,(input.familyType==='adoption'?14:input.schoolDelayed?10:7)*12);
    if(event>=endAge)throw new CalculatorError('Przyjęcie jest poza ustawową granicą wieku dla tej ścieżki.','eventDate');
    const remaining=dayNumber(endAge)-dayNumber(event);
    maternity=Math.max(p.limits.adoptionMinimum*7,Math.min(maternity,remaining));
    const short=remaining<=p.limits.adoptionMinimum*7;
    if(short){maternity=p.limits.adoptionMinimum*7;parental=(input.life?p.limits.adoptionLife:p.limits.adoptionShort)*7;facts.push('Zastosowano szczególną 9-tygodniową gwarancję. Nie jest to domyślna długość każdej adopcji.');}
      if(input.adoptionShort&&!short)warnings.push('Szczególna ścieżka 9 tygodni nie jest dowolnym skróceniem każdej adopcji. Przyjęto zwykły wymiar zgodnie z wiekiem.');
      if(input.count>1&&input.adoptionDifferentAges){if(!Number.isInteger(input.adoptionVerifiedDays)||input.adoptionVerifiedDays<1)throw new CalculatorError('Dzieci w różnym wieku mogą tracić prawo w różnych datach. Wpisz indywidualny wymiar ustalony przez płatnika/ZUS, zamiast przyjmować wspólną datę urodzenia.','adoptionVerifiedDays');maternity=input.adoptionVerifiedDays;warnings.push('Dla dzieci w różnym wieku użyto podanego wymiaru ustalonego przez płatnika. Rodzicielski i granicę wieku najstarszego dziecka trzeba potwierdzić odrębnie w ZUS.');}
      maternity=Math.max(0,maternity-input.previousMaternityDays);
    deadline('adoption-request','Złóż wniosek o urlop na warunkach macierzyńskiego',shiftDate(event,7),'calc-documents','Wniosek pracownika w ciągu 7 dni; początek urlopu najpóźniej w ciągu 21 dni od spełnienia właściwych warunków.');
  }
  const averageDeadline=shiftDate(event,p.deadlines.averaged),application=input.applicationDate;
  let averaged=input.rateChoice==='averaged'&&application&&application>=event&&application<=averageDeadline;
  if(input.rateChoice==='averaged'&&!averaged){if(input.dateKind==='expected'&&(!application||application<event)){averaged=true;warnings.push('Wariant uśredniony jest planem: właściwy wniosek trzeba złożyć po zdarzeniu, w ciągu 21 dni.');}else warnings.push('Nie potwierdzono wniosku w 21 dni. Obliczono wariant 100% / 70%, zamiast automatycznie przyznać 81,5%.');}
  if(averaged&&input.familyType==='birth'&&!acquired[0].canPay){averaged=false;warnings.push('Nie potwierdzono prawa matki do zasiłku w dniu porodu. Sam wniosek nie uruchamia wariantu 81,5% dla ojca; jego samodzielny rodzicielski liczymy według stawki 70%.');}
  deadline('average-request','Termin wniosku o wariant uśredniony',averageDeadline,'calc-rates','Znaczenie dla stawki 81,5%; to nie koniec prawa do zasiłku.');
  const maternityRate=averaged?p.rates.averaged:p.rates.maternity,parentRate=averaged?p.rates.averaged:p.rates.parental;
  let matStart=input.familyType==='birth'?shiftDate(event,-input.prenatalDays):event,matEnd=shiftDate(matStart,maternity-1);
  if(input.loss!=='none'){
    if(input.familyType!=='birth')warnings.push('Sytuacja utraty opieki przy przyjęciu wymaga indywidualnego ustalenia okresów w ZUS.');
    else{
      const lossDate=input.loss==='stillbirth'?event:input.lossDate;if(!lossDate)throw new CalculatorError('Podaj datę zdarzenia.','lossDate');
      if(lossDate<event)throw new CalculatorError('Sprawdź datę straty w stosunku do porodu.','lossDate');
      let end;
      if(input.surviving>=input.count&&input.loss!=='child-care-placement')throw new CalculatorError('Liczba pozostających przy życiu musi być mniejsza od liczby dzieci z tego porodu.','surviving');
      if(lossDate>matEnd)end=matEnd;
      else if(input.loss==='child-care-placement')end=calcMinDate(matEnd,calcMaxDate(shiftDate(event,55),lossDate));
      else if(input.surviving>0){const survivingWeeks=p.limits['maternity'+Math.min(input.surviving,5)];end=calcMaxDate(shiftDate(matStart,survivingWeeks*7-1),shiftDate(lossDate,6));}
      else end=dayNumber(lossDate)-dayNumber(event)<56?calcMaxDate(shiftDate(event,55),shiftDate(lossDate,6)):calcMinDate(matEnd,shiftDate(lossDate,6));
      matEnd=end;maternity=calcDays(matStart,matEnd);warnings.push('Wynik po stracie wymaga potwierdzenia okresu przez płatnika/ZUS. Nie wymagamy ustalonej płci dziecka ani aktu, jeżeli przepisy dopuszczają zaświadczenie medyczne.');
      if(input.loss!=='child-care-placement'){deadline('funeral','Sprawdź termin wniosku o pogrzebowe',addMonths(lossDate,12),'calc-funeral','Zasadniczo 12 miesięcy od śmierci; niezależna przeszkoda może uzasadniać termin liczony od pogrzebu.');facts.push(`Jeśli rodzic poniósł koszty pogrzebu, sprawdź prawo do pogrzebowego: w 2026 r. ${p.money.funeral} zł. Świadczenie wymaga spełnienia warunków i dokumentów.`);}
    }
  }
  const maternityName=input.familyType==='birth'?'Macierzyński':'Na warunkach macierzyńskiego';
  let donorEnd=matEnd,takeStart=null,takeEnd=null;
  if(input.transfer!=='none'){
    if(!parents[primary].canPay&&['ordinary','mother-hospital'].includes(input.transfer))throw new CalculatorError('Ta ścieżka wymaga uprawnienia matki. Przy braku jej ubezpieczenia sprawdź odrębne ustawowe zdarzenia, np. zgon, orzeczoną niesamodzielność albo podjęcie pracy.','transfer');
    if(input.transfer==='ordinary'){takeStart=shiftDate(event,input.motherPostWeeks*7);if(input.familyType==='birth'&&input.motherPostWeeks<14)throw new CalculatorError('Zwykłe przekazanie wymaga co najmniej 14 tygodni matki po porodzie.','motherPostWeeks');}
    else{
      if(!input.transferDate)throw new CalculatorError('Podaj datę przejęcia opieki lub zdarzenia.','transferDate');
      const insuredAtBirth=acquired[0].canPay;takeStart=input.transfer==='mother-death'&&insuredAtBirth?input.transferDate:input.transfer==='mother-incapacity'&&!insuredAtBirth?calcMaxDate(event,shiftDate(input.transferDate,1)):['mother-employed','mother-hospital','mother-incapacity'].includes(input.transfer)?input.transferDate:shiftDate(input.transferDate,1);
      const motherInsured=parents[primary].canPay;
      if(motherInsured&&['mother-hospital','mother-incapacity','abandonment'].includes(input.transfer))takeStart=calcMaxDate(takeStart,shiftDate(event,56));
      if(input.transfer==='mother-employed'&&acquired[0].canPay)throw new CalculatorError('Ta przesłanka dotyczy matki, która nie była uprawniona w dniu porodu. Dla uprawnionej matki wybierz właściwy rodzaj przejęcia.','transfer');
      if(input.transfer==='mother-employed'&&input.parents[0].fte<.5)throw new CalculatorError('Ta przesłanka wymaga pracy matki co najmniej na 1/2 pełnego etatu.','parents.0.fte');
    }
    if(takeStart<event||takeStart>matEnd)throw new CalculatorError('Przejęcie musi przypadać w niewykorzystanym okresie macierzyńskiego.','transferDate');
    if(input.parents[1-primary].occupation!=='employee'&&!input.otherParentStopsWork)throw new CalculatorError('Przy przejęciu przez niepracownika potwierdź przerwanie działalności zarobkowej dla osobistej opieki.','otherParentStopsWork');
    donorEnd=shiftDate(takeStart,-1);takeEnd=['mother-hospital','mother-employed'].includes(input.transfer)&&input.transferEnd?calcMinDate(matEnd,input.transferEnd):matEnd;
    if(takeEnd<takeStart)throw new CalculatorError('Sprawdź koniec przejętej opieki.','transferEnd');
    if(input.transfer==='ordinary'||input.transfer==='mother-incapacity'){deadline('mother-resigns','Wniosek matki o rezygnację z pozostałej części',shiftDate(takeStart,-7));deadline('father-transfer','Wniosek pracownika przejmującego macierzyński',shiftDate(takeStart,-14));}
    else facts.push('Nagłe przejęcie opieki ma odrębne dokumenty; nie stosujemy automatycznie 14-dniowego wyprzedzenia zwykłego przejęcia.');
  }
  const pause=input.motherPauseStart&&input.motherPauseEnd;
  if(pause&&input.transfer!=='none')throw new CalculatorError('Przerwę z powodu szpitala dziecka i przejęcie przez drugiego rodzica rozplanuj jako odrębne scenariusze do weryfikacji ZUS.','motherPauseStart');
  if(pause){
    if(input.motherPauseStart<shiftDate(event,56)||input.motherPauseEnd<input.motherPauseStart)throw new CalculatorError('Przerwa na szpital dziecka jest możliwa po 8 tygodniach po porodzie. Sprawdź daty.','motherPauseStart');
    if(input.motherPauseStart>matEnd)throw new CalculatorError('Nie ma już pozostałej puli macierzyńskiego do przerwania.','motherPauseStart');
    add({id:'maternity-before-pause',title:maternityName,parent:primary,start:matStart,days:dayNumber(input.motherPauseStart)-dayNumber(matStart),rate:maternityRate,source:'calc-maternity'});
    const remaining=calcDays(input.motherPauseStart,matEnd),resume=shiftDate(input.motherPauseEnd,1);matEnd=shiftDate(resume,remaining-1);
    add({id:'maternity-after-pause',title:maternityName+' po przerwie',parent:primary,start:resume,days:remaining,rate:maternityRate,source:'calc-maternity'});
  }else{
    add({id:'maternity-1',title:maternityName,parent:primary,start:matStart,days:calcDays(matStart,donorEnd),rate:maternityRate,source:'calc-maternity'});
    if(takeStart){add({id:'maternity-2',title:'Przejęty '+maternityName.toLowerCase(),parent:1-primary,start:takeStart,days:calcDays(takeStart,takeEnd),rate:maternityRate,source:'calc-maternity'});if(takeEnd<matEnd&&input.transfer==='mother-hospital')add({id:'maternity-return',title:maternityName+' po powrocie matki',parent:primary,start:shiftDate(takeEnd,1),days:dayNumber(matEnd)-dayNumber(takeEnd),rate:maternityRate,source:'calc-maternity'});}
  }
  const supplement=calcSupplement(input);
  if(supplement.days&&input.loss==='none'){
    const parent=input.supplementParent,start=shiftDate(matEnd,1),end=shiftDate(matEnd,supplement.days);
    add({id:'supplement',title:'Uzupełniający macierzyński',parent,start,days:supplement.days,rate:p.rates.maternity,source:'calc-supplement'});
    const employee=input.parents[parent].occupation==='employee',date=employee?shiftDate(matEnd,-p.deadlines.supplement):shiftDate(matEnd,-1);
    deadline('supplement-request','Wniosek o uzupełniający macierzyński',date,'calc-supplement',employee?'Co najmniej 21 dni przed zakończeniem macierzyńskiego.':'Wniosek przed zakończeniem podstawowego okresu zasiłku.');
    if(input.supplementApplication&&input.supplementApplication>date){warnings.push('Spóźniony wniosek uzupełniający wymaga ustalenia z pracodawcą/ZUS. Kwoty i prawa nie potwierdzamy.');for(const period of periods.filter(period=>period.id==='supplement'||period.id.startsWith('supplement-segment-'))){period.eligibility='assessment';period.conditional=true;period.daily=null;period.gross=null;period.monthly30=null;}}
    matEnd=end;facts.push(...supplement.notes);
  }
  const parentLimit=input.familyType==='birth'?`${Number(event.slice(0,4))+6}-12-31`:shiftDate(endAge,-1);
  const hasLoss=input.loss!=='none'&&!input.surviving;
  const use=hasLoss?[]:input.parentalParts.filter(part=>part.weeks>0),totals=[input.previousParent1Days,input.previousParent2Days];
  if(hasLoss&&(input.parentalParts.some(part=>part.weeks>0)||input.paternityDays))warnings.push('Przy braku dziecka pod opieką nie naliczamy przyszłego rodzicielskiego ani ojcowskiego. Zakończenie już trwającego urlopu po stracie trzeba potwierdzić z płatnikiem; zapis nie tworzy nowego prawa.');
  const previousTotal=input.previousParent1Days+input.previousParent2Days;
  if(input.previousParentDays!==previousTotal)throw new CalculatorError('Suma wykorzystanych dni obojga rodziców musi odpowiadać łącznej historii. Popraw wcześniejsze wykorzystanie.','previousParentDays');
  if(use.length+input.previousParts>p.limits.parentalParts)throw new CalculatorError('Przekroczono łączną liczbę części rodzicielskiego obojga rodziców.','parentalParts');
  for(const part of use)totals[part.parent]+=part.weeks*7;
  if(totals.some(total=>total>parental-p.limits.reserved*7))throw new CalculatorError(`Jeden rodzic nie może przejąć nieprzenoszalnej części drugiego. Jego limit to ${parental/7-p.limits.reserved} tygodni.`,'parentalParts');
  if(use.reduce((s,part)=>s+part.weeks*7,0)+input.previousParentDays>parental)throw new CalculatorError('Wspólna pula rodzicielskiego została przekroczona. Równoczesna opieka zużywa pulę obojga rodziców.','parentalParts');
  const cursor=[shiftDate(matEnd,1),shiftDate(matEnd,1)],reservedUsed=[input.previousParent1Days,input.previousParent2Days];
  for(let index=0;index<use.length;index++){
    const part=use[index],parent=part.parent,owner=input.parents[parent],start=part.start||cursor[parent],days=Math.round(part.weeks*7);
    if(!Number.isInteger(part.weeks*7))throw new CalculatorError('Podaj pełne dni rodzicielskiego: liczba tygodni musi odpowiadać całym dniom.','parentalParts');
    if(start<event)throw new CalculatorError('Rodzicielski nie może poprzedzać narodzin lub przyjęcia.','parentalParts');
    if(start<=matEnd&&periods.some(period=>period.parent===parent&&period.end>=start&&period.start<=shiftDate(start,days-1)))throw new CalculatorError('Rodzicielski tego rodzica nie może nakładać się na jego macierzyński.','parentalParts');
    if((part.work||part.extensionWork)&&owner.occupation!=='employee')throw new CalculatorError('Ustawowe wydłużenie za pracę dotyczy pracownika u pracodawcy udzielającego urlopu.','parentalParts');
    if(part.work>=owner.fte||part.extensionWork>=owner.fte)throw new CalculatorError('Wymiar pracy musi być mniejszy od etatu objętego urlopem.','parentalParts');
    const extra=Math.floor(days*part.work/(1-part.extensionWork));
    const reserved=parent===secondForRates?Math.max(0,Math.min(days,p.limits.reserved*7-reservedUsed[parent])):0;
    let segments=reserved?[{days:reserved,rate:p.rates.reserved},{days:days-reserved,rate:parentRate}]:[{days,rate:parentRate}],segmentStart=start;
    for(let s=0;s<segments.length;s++){const seg=segments[s];if(seg.days){add({id:`parental-${index}-${s}`,title:'Rodzicielski'+(parent===secondForRates&&seg.rate===p.rates.reserved?' — w tym część wyłączna':''),parent,start:segmentStart,days:seg.days,rate:seg.rate,work:part.work,fte:owner.fte,source:'calc-parental'});segmentStart=shiftDate(segmentStart,seg.days);}}
    if(extra){let remainingExtra=extra;for(let s=0;s<segments.length;s++){const seg=segments[s],extraForSegment=s===segments.length-1?remainingExtra:Math.floor(seg.days*part.work/(1-part.extensionWork));if(extraForSegment){const period=add({id:'extension-'+index+'-'+s,title:'Rodzicielski — wydłużenie za pracę',parent,start:segmentStart,days:extraForSegment,rate:seg.rate,work:part.extensionWork,fte:owner.fte,source:'calc-parental',description:'Zachowano stawkę części, z której pochodzi wydłużenie. Niepełny dzień pominięto.'});segmentStart=shiftDate(segmentStart,extraForSegment);remainingExtra-=extraForSegment;if(segments.length>1&&!Number.isInteger(seg.days*part.work/(1-part.extensionWork))){period.daily=null;period.gross=null;period.monthly30=null;period.eligibility='assessment';warnings.push('Zmiana stawki wewnątrz części łączonej z pracą daje niepełny dzień podziału wydłużenia. Kwota tej części wymaga potwierdzenia przez płatnika.');}}}}
    const end=shiftDate(start,days+extra-1);if(end>parentLimit)throw new CalculatorError('Plan przekracza granicę wieku. Przy szczególnej 9-tygodniowej gwarancji blisko urodzin potwierdź możliwy rodzicielski indywidualnie w ZUS, zamiast automatycznie przyznawać pełną pulę.','parentalParts');
    cursor[parent]=shiftDate(end,1);reservedUsed[parent]+=days;
    deadline('parental-request-'+index,'Złóż wniosek o część rodzicielskiego',shiftDate(start,owner.occupation==='employee'?-p.deadlines.parental:-1),'calc-parental','Pracownik: 21 dni przed rozpoczęciem. Inny ubezpieczony: przed rozpoczęciem okresu zasiłku.');
    if(part.work)deadline('work-request-'+index,'Wniosek o łączenie rodzicielskiego z pracą',shiftDate(start,-21),'calc-parental','Wniosek określa też sposób korzystania z wydłużenia. Pracodawca ocenia możliwość organizacyjną.');
  }
  if(input.paternityDays&&!hasLoss){
    if(![7,14].includes(input.paternityDays))throw new CalculatorError('Ojcowski zaplanuj jako 7 albo 14 dni.','paternityDays');
    if(input.paternityDays>p.limits.paternity||input.paternitySecondStart&&input.paternityDays!==14)throw new CalculatorError('Dwie części po 7 dni wymagają łącznego planu 14 dni.','paternityDays');
    if(input.familyType==='foster')throw new CalculatorError('Sama piecza zastępcza nie uruchamia ojcowskiego z tytułu prawomocnej adopcji.','paternityDays');
    const fatherLimit=input.familyType==='adoption'?calcMinDate(input.adoptionCourtDate?addMonths(input.adoptionCourtDate,12):null,addMonths(birth,14*12)):addMonths(event,12);
    if(input.familyType==='adoption'&&!input.adoptionCourtDate)throw new CalculatorError('Ojcowski adopcyjny wymaga daty prawomocności przysposobienia.','adoptionCourtDate');
    const start=input.paternityStart||event,firstDays=input.paternitySecondStart?7:input.paternityDays;
    for(const [i,date,days]of [[0,start,firstDays],...(input.paternitySecondStart?[[1,input.paternitySecondStart,7]]:[])]){
      if(date<(input.familyType==='adoption'?input.adoptionCourtDate:event)||shiftDate(date,days-1)>=fatherLimit)throw new CalculatorError('Ojcowski musi w całości zmieścić się przed odpowiednią granicą 12 miesięcy i wieku dziecka.','paternityStart');
      add({id:'paternity-'+i,title:'Ojcowski',parent:1,start:date,days,rate:p.rates.maternity,source:'calc-maternity'});deadline('paternity-request-'+i,'Wniosek o ojcowski',shiftDate(date,input.parents[1].occupation==='employee'?-p.deadlines.paternity:-1));
    }
  }
  for(const parent of [0,1]){const owned=periods.filter(period=>period.parent===parent).sort((a,b)=>a.start.localeCompare(b.start));for(let i=1;i<owned.length;i++)if(owned[i].start<=owned[i-1].end)throw new CalculatorError('Okresy świadczeń jednego rodzica nie mogą się nakładać. Zmień daty części lub ojcowskiego.','parentalParts');}
  if(input.loss!=='none'&&!input.surviving&&use.length)warnings.push('Po śmierci dziecka albo utracie osobistej opieki rodzicielski wymaga odrębnego zakończenia. Nie korzystaj z tego planu jak z potwierdzenia dalszej wypłaty.');
  facts.push(`Rodzicielski: wspólna pula ${parental/7} tygodni, w tym po ${p.limits.reserved} tygodni nieprzenoszalnych; nie dodajemy ich drugi raz.`,`Plan zużywa ${use.reduce((s,part)=>s+part.weeks,0)} tygodni rodzicielskiego; wcześniejsze wykorzystanie: ${input.previousParentDays} dni. Koniec wykorzystania: ${parentLimit}.`);
  if(averaged)facts.push('Uzupełniający i ojcowski pozostają 100%. Pierwsza wyłączna 9-tygodniowa część drugiego rodzica jest liczona po 70%.');
  return {periods,deadlines,warnings,facts,supplement,averaged,limits:{maternity,parental,parentLimit},unclaimedParentDays:Math.max(0,parental-input.previousParentDays-use.reduce((s,part)=>s+part.weeks*7,0))};
}
