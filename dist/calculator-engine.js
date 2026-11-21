import {dayNumber,shiftDate,todayString} from './age.js';
import {addMonths} from './timeline.js';
import {CalculatorError,calculatorRulesFor} from './calculator-params.js';
import {calcNormalizeInput,calcParent,calcRound,calcMonthly,calcDays,calcMergeIntervals} from './calculator-core.js';
import {calcFamily} from './calculator-family.js';
import {calcPregnancy,calcCare,calcBusiness} from './calculator-other.js';

export const CALCULATOR_LABELS={family:'Urlopy i zasiłek macierzyński',sickness:'Chorobowe w ciąży',rehab:'Świadczenie rehabilitacyjne',prebirth:'Świadczenie po utracie pracy przed porodem',care:'Opieka nad dzieckiem lub bliskim',business:'Działalność, składki i ulgi'};
export function calculatorDocuments(input,parents){
  const result=[],focus=input.focus;
  for(const index of focus==='family'?[0,1]:[focus==='care'?input.care.parent:0]){
    const owner=input.parents[index],employee=owner.occupation==='employee',recipient=employee?'Pracodawca — urlop; '+(owner.payer==='employer'?'pracodawca wypłaca zasiłek.':owner.payer==='zus'?'ZUS wypłaca po przekazaniu dokumentów przez płatnika.':'ustal z płatnikiem, kto wypłaca zasiłek.'):(owner.occupation==='contract'&&owner.payer==='employer'?'Uprawniony płatnik składek.':'ZUS — świadczenie za okres odpowiadający urlopowi, bez urlopu pracowniczego.');
    const items=[],forms=[];
    if(focus==='family'||focus==='prebirth'){
      forms.push({code:focus==='prebirth'?'ZAS-55':'ZAM',url:'https://www.zus.pl/wzory-formularzy/zasilki/zasilek-macierzynski'});
      items.push(employee?'Wniosek o właściwy urlop w postaci papierowej lub elektronicznej.':'Wniosek o zasiłek przed rozpoczęciem odpowiedniego okresu; sprawdź termin dla wybranej części.');
      items.push(owner.payer==='zus'||!employee?'Dane dziecka i rodzica do pobrania polskiego aktu przez ZUS; odpis dostarcz, jeśli ZUS wezwie.':'Do pracodawcy: skrócony akt urodzenia lub właściwy zagraniczny dokument, także dopuszczalna kopia.');
      if(input.familyType!=='birth')items.push('Data przyjęcia oraz dokument sądu/umowa ze starostą; przy adopcji potwierdzenie złożenia wniosku. Dla zasiłku ZUS możliwe również orzeczenie o zabezpieczeniu pieczy.');
      if(input.schoolDelayed)items.push('Prawomocna decyzja o odroczeniu obowiązku szkolnego.');
      if(input.life)items.push('Zaświadczenie „Za życiem” w ustawowym znaczeniu i wymagane oświadczenie/kopia dla właściwego adresata.');
      if(input.hospitals.length)items.push('Zaświadczenie szpitala: okresy hospitalizacji, tydzień ciąży i masa urodzeniowa; oświadczenie o niewykorzystaniu uzupełniającego przez drugiego rodzica.');
      if(input.parentalParts.length)items.push('Historia okresów i liczby części obojga rodziców, oświadczenie o równoległej opiece oraz wymiarze pracy i wydłużeniu.');
      if(input.transfer!=='none')items.push('Dokument/oświadczenie uzasadniające przejęcie (rezygnacja, pobyt i wypis ze szpitala, zgon, porzucenie, orzeczenie lub zatrudnienie matki); historia pobranego zasiłku i stawek.');
      if(input.loss==='stillbirth')items.push('Gdy nie sporządzono aktu: właściwe zaświadczenie medyczne o martwym urodzeniu. Ustalenie płci nie jest warunkiem tej ścieżki.');
      if(owner.insuranceTo&&owner.insuranceTo<input.eventDate)items.push('Dokumenty rozwiązania zatrudnienia, potwierdzenie ciąży w tym czasie oraz dokument szczególnej przyczyny; przy naruszeniu prawa — prawomocny wyrok.');
    }else if(focus==='sickness'){forms.push({code:'ZAS-53',url:'https://www.zus.pl/wzory-formularzy/zasilki/zasilek-chorobowy'});items.push('e-ZLA; kod B albo odrębne potwierdzenie ciąży. Brak kodu B sam nie przesądza braku ciąży.','Pracownik informuje pracodawcę o nieobecności zgodnie z zasadami zakładu. Przy wypłacie przez ZUS potrzebny jest właściwy wniosek i dokumenty płatnika.');if(owner.insuranceTo)items.push('Po ustaniu tytułu: oświadczenie Z-10 i sprawdzenie pozostałych tytułów/wyłączeń.');}
    else if(focus==='rehab'){forms.push({code:'ZNp-7 / OL-9',url:'https://www.zus.pl/wzory-formularzy/zasilki/swiadczenie-rehabilitacyjne'});items.push('ZNp-7 i zaświadczenie o stanie zdrowia OL-9; warunkowo wywiad zawodowy OL-10.','Dokumentacja potwierdzająca wyczerpanie chorobowego i dalszą niezdolność; o prawie rozstrzyga ZUS.');if(owner.insuranceTo)items.push('Po ustaniu ubezpieczenia dodatkowo Z-10.');}
    else if(focus==='care'){forms.push({code:'Z-15',url:'https://www.zus.pl/wzory-formularzy/zasilki/zasilek-opiekunczy'});items.push('Aktualny Z-15, dokument medyczny albo wymagane oświadczenie dotyczące zdarzenia.','Łączna historia opiekuńczego obojga rodziców i informacja o innych domownikach. Dodatkowy opiekuńczy wymaga dokumentów szczególnej sytuacji matki.');}
    if(focus!=='business'&&(employee&&owner.payer!=='employer'||owner.occupation==='contract'&&owner.payer!=='employer'))items.push(employee?'Płatnik przekazuje Z-3, a przy właściwej kontynuacji ZAS-12.':'Płatnik przekazuje Z-3a w przypadkach wymaganych przez ZUS.');
    if(owner.occupation==='business')items.push('Od 24.10.2026 Z-3b nie jest wymaganym załącznikiem JDG. Jego czasowa techniczna dostępność dla pełnomocników w eZUS nie oznacza przywrócenia obowiązku.');
    if(items.length)result.push({parent:index,recipient,forms,items});
  }
  return result;
}
function calculatorTopUps(input,periods,rules){
  if(!input.topUpMonth)return [];
  const start=input.topUpMonth+'-01',end=shiftDate(addMonths(start,1),-1),monthDays=calcDays(start,end),out=[];
  for(const parent of [0,1]){
    const net=parent?input.netReceived2:input.netReceived1;if(net===null)continue;
    const eligible=periods.filter(p=>p.parent===parent&&!p.id.startsWith('paternity')&&!p.id.startsWith('prebirth')&&p.kind==='benefit'&&['potential','conditional'].includes(p.eligibility));
    const ranges=calcMergeIntervals(eligible,start,end),days=ranges.reduce((s,r)=>s+calcDays(r.start,r.end),0);
    if(!days)continue;
    const floor=days===monthDays?rules.parameters.money.parentalFloor:Math.ceil((calcRound(rules.parameters.money.parentalFloor/monthDays)*days-1e-9)*10)/10;
    out.push({parent,month:input.topUpMonth,days,threshold:calcRound(floor),netReceived:net,topUp:calcRound(Math.max(0,floor-net)),source:'calc-rates'});
  }return out;
}
export function calculateIntegrated(raw,bundle,today=todayString()){
  const input=calcNormalizeInput(raw),effectiveEvent=['sickness','rehab','prebirth'].includes(input.focus)?input.sickness.start||input.eventDate:input.focus==='care'?input.care.start||input.eventDate:input.familyType==='adoption'&&input.adoptionApplicationDate&&input.adoptionApplicationDate>input.eventDate?input.adoptionApplicationDate:input.eventDate,rules=calculatorRulesFor(bundle,effectiveEvent);
  if(input.dateKind==='actual'&&effectiveEvent>today)throw new CalculatorError('Data rzeczywistego zdarzenia nie może być przyszła. Wybierz datę planowaną.','dateKind');
  const parents=input.parents.map(parent=>calcParent(parent,input.eventDate,rules));
  let calculation;
  if(input.focus==='family')calculation={...calcFamily(input,rules,parents),parents};
  else if(input.focus==='business')calculation=calcBusiness(input,rules);
  else if(input.focus==='care')calculation=calcCare(input,rules);
  else calculation=calcPregnancy(input,rules);
  const all=calculation.periods;
  const totals=[0,1].map(parent=>{const owned=all.filter(p=>p.parent===parent&&p.kind!=='information');return {parent,days:calcMergeIntervals(owned).reduce((s,p)=>s+calcDays(p.start,p.end),0),gross:owned.length&&owned.every(p=>p.gross!==null)?calcRound(owned.reduce((s,p)=>s+p.gross,0)):null};});
  const variants=[];
  if(input.focus==='family'&&input.loss==='none')for(const choice of ['standard','averaged']){const variant=calcFamily({...input,rateChoice:choice},rules,parents);variants.push({id:choice,label:choice==='standard'?'100% macierzyński + 70% rodzicielski':'81,5% po terminowym wniosku',available:choice==='standard'||variant.averaged,gross:[0,1].map(parent=>{const periods=variant.periods.filter(p=>p.parent===parent);return periods.length&&periods.every(p=>p.gross!==null)?calcRound(periods.reduce((s,p)=>s+p.gross,0)):null;})});}
  const facts=[...(calculation.facts||[])],warnings=[...(calculation.warnings||[])];
  if(input.focus!=='business')facts.push('Podane kwoty to zasiłek brutto. Miesięczny ekwiwalent 30-dniowy różni się od wypłaty za miesiąc 28- lub 31-dniowy. Nie dodajemy wynagrodzenia za pracę ani nie wyliczamy PIT.');
  if(input.loss!=='none'||input.transfer!=='none')warnings.push('Szczególna sytuacja wymaga sprawdzenia dokumentów i rzeczywistego wykorzystania przez płatnika/ZUS. W razie wątpliwości użyj przygotowanego zapytania do eZUS.');
  if(input.dateOrigin==='demo'||input.dataOrigin==='demo')warnings.unshift('Wynik wykorzystuje przykładowe dane z symulacji. Zastąp je swoimi przed podejmowaniem decyzji.');
  if(input.parents.some(parent=>parent.fteChanged))warnings.push('Wynik przy zmianie etatu zakłada, że podano właściwą podstawę dla nowego wymiaru.');
  const usedSources=[...new Set([...all,...calculation.deadlines].map(p=>p.source))];
  const affected=rules.sources.filter(s=>(usedSources.includes(s.id)||['calc-documents','calc-rates'].includes(s.id))&&['changed','missing','unavailable'].includes(s.status));
  if(affected.length)warnings.unshift('Nie potwierdzono bieżącej treści części źródeł: '+affected.map(s=>s.name).join('; ')+'. Obliczenia zachowują ostatnią zatwierdzoną wersję zasad. Przed decyzją sprawdź aktualne warunki w ZUS; sama zmiana strony nie zmienia automatycznie parametrów.');
  return {version:1,input,rulesVersion:rules.appliedVersion,rulesRevision:bundle.revision,reviewedAt:bundle.reviewedAt,calculatedOn:today,title:CALCULATOR_LABELS[input.focus],...calculation,totals,variants,monthly:calcMonthly(all.filter(p=>p.kind!=='information')),topUps:input.focus==='family'?calculatorTopUps(input,all,rules):[],facts:[...new Set(facts)],warnings:[...new Set(warnings)],documents:calculatorDocuments(input,calculation.parents||parents),sources:rules.sources.filter(s=>usedSources.includes(s.id)||['calc-documents','calc-forms','calc-rates','calc-base','calc-business-base','calc-postcap','calc-pip','calc-family','calc-business-ulga','calc-small2026','calc-z3b'].includes(s.id)),support:input.loss!=='none'||input.hospitals.length||input.life?rules.support:[],generalGuidance:[
    'Urlop pracowniczy i zasiłek to różne uprawnienia. ZUS albo uprawniony płatnik ustala prawo i dokładną wypłatę na podstawie dokumentów.',
    'Płatnik zgłaszający ponad 20 ubezpieczonych zasadniczo wypłaca zasiłki; przy 20 lub mniej wypłaca ZUS. Liczbę ustala się według właściwego dnia ustawowego. Wniosek o urlop kieruj do pracodawcy.',
    'Gdy dokumenty przekazuje płatnik do ZUS, ma na to nie więcej niż 7 dni od otrzymania. Termin wypłaty ZUS liczy się od wyjaśnienia ostatniej niezbędnej okoliczności, nie od naciśnięcia przycisku.',
    'Przy wielu tytułach podwyższenie do świadczenia rodzicielskiego ustala jeden płatnik na podstawie sumy kwot po zaliczce PIT. Nie porównuj z 1000 zł samej kwoty brutto.',
    'W ciąży i na właściwych urlopach pracownika obejmuje szczególna ochrona; istnieją ustawowe wyjątki. Umowa na zastępstwo nie jest automatycznie przedłużana jak właściwa umowa terminowa. Badania ciąży niemożliwe poza pracą mogą uzasadniać płatne zwolnienie.',
    'Pozorne zatrudnienie, nieprawidłowe dane o podstawie i niezgłoszenie do dobrowolnego chorobowego mogą zmienić prawo albo wysokość. Podwyższenie składek nie gwarantuje takiego samego wzrostu świadczenia.',
    'Od 24.10.2026 używaj aktualnego ZAM zamiast ZUR/ZAO i Z-15 zamiast Z-15A/B. Przy stracie dostępna jest ścieżka z właściwym zaświadczeniem medycznym.',
    'Po zasiłku macierzyńskim przy dobrowolnym chorobowym sprawdź ponowne zgłoszenie do ubezpieczenia. Samo dalsze prowadzenie JDG nie zastępuje zgłoszenia.',
    'Roszczenie o wypłatę zasiłku zasadniczo przedawnia się po 6 miesiącach od ostatniego dnia okresu; istnieją wyjątki przy niezależnej przeszkodzie lub błędzie płatnika/ZUS. Nie myl przedawnienia z terminem wniosku o konkretny urlop.',
    'Podczas osobistej opieki państwo może finansować składki, ale nie jest to wypłata dla rodzica. Zakres zależy m.in. od wcześniejszych 6 miesięcy ubezpieczenia i tytułu; przy zleceniu dochodzą granice wcześniejszej podstawy. Urlop wychowawczy wymaga osobnej oceny podstawy i innych tytułów.',
    'Zasiłek macierzyński przy kolejnym porodzie w trakcie wychowawczego może przysługiwać. Finansowanie składek z wychowawczego zmienia się, gdy powstaje inny obowiązkowy tytuł.',
    'Świadczenie rodzicielskie poza ZUS, 800+ i Aktywny Rodzic mają odrębne warunki. Brak zasiłku macierzyńskiego ZUS nie oznacza braku wszelkiego wsparcia. Sprawdź karty i wskazane instytucje.'
  ]};
}
