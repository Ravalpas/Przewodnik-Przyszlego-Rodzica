export class CalculatorError extends Error {
  constructor(message,field=''){super(message);this.name='CalculatorError';this.field=field;}
}
export const CALCULATOR_PARAMETER_FIELDS=[
  ['rates.maternity','Macierzyński, ojcowski i uzupełniający (%)',0,100],
  ['rates.parental','Rodzicielski (%)',0,100],
  ['rates.averaged','Wariant uśredniony (%)',0,100],
  ['rates.reserved','Nieprzenoszalna część drugiego rodzica (%)',0,100],
  ['rates.pregnancy','Chorobowe i rehabilitacyjne w ciąży (%)',0,100],
  ['rates.sickness','Zwykłe chorobowe i opiekuńcze (%)',0,100],
  ['rates.rehabFirst','Rehabilitacyjne, pierwsze 90 dni (%)',0,100],
  ['rates.rehabLater','Rehabilitacyjne, dalszy okres (%)',0,100],
  ['rates.contributions','Typowe składki finansowane przez pracownika (%)',0,100],
  ['limits.maternity1','Macierzyński: jedno dziecko (tygodnie)',1,100],
  ['limits.maternity2','Macierzyński: dwoje dzieci (tygodnie)',1,100],
  ['limits.maternity3','Macierzyński: troje dzieci (tygodnie)',1,100],
  ['limits.maternity4','Macierzyński: czworo dzieci (tygodnie)',1,100],
  ['limits.maternity5','Macierzyński: pięcioro i więcej (tygodnie)',1,100],
  ['limits.parental1','Rodzicielski: jedno dziecko (tygodnie)',1,150],
  ['limits.parentalMany','Rodzicielski: wieloraczki (tygodnie)',1,150],
  ['limits.life1','Za życiem: jedno dziecko (tygodnie)',1,150],
  ['limits.lifeMany','Za życiem: wieloraczki (tygodnie)',1,150],
  ['limits.adoptionShort','Przyjęcie: szczególny rodzicielski (tygodnie)',1,150],
  ['limits.adoptionLife','Przyjęcie: szczególny Za życiem (tygodnie)',1,150],
  ['limits.adoptionMinimum','Gwarantowany na warunkach macierzyńskiego (tygodnie)',1,52],
  ['limits.reserved','Część nieprzenoszalna każdego rodzica (tygodnie)',0,52],
  ['limits.paternity','Ojcowski (dni)',1,90],
  ['limits.prenatal','Macierzyński przed porodem (dni)',0,100],
  ['limits.parentalParts','Liczba części rodzicielskiego',1,20],
  ['limits.pregnancySick','Chorobowe w ciąży: okres zasiłkowy (dni)',1,730],
  ['limits.sick','Zwykły okres zasiłkowy (dni)',1,730],
  ['limits.rehab','Maksimum rehabilitacyjnego (dni)',1,730],
  ['limits.waitCompulsory','Wyczekiwanie obowiązkowego chorobowego (dni)',0,365],
  ['limits.waitVoluntary','Wyczekiwanie dobrowolnego chorobowego (dni)',0,365],
  ['limits.care','Wspólny opiekuńczy (dni)',0,365],
  ['limits.careDisabled','Podlimit opieki nad niepełnosprawnym dzieckiem (dni)',0,365],
  ['limits.careAdult','Podlimit opieki nad starszym dzieckiem/dorosłym (dni)',0,365],
  ['deadlines.averaged','Wniosek o wariant uśredniony po zdarzeniu (dni)',0,90],
  ['deadlines.parental','Wniosek pracownika o rodzicielski (dni przed)',0,90],
  ['deadlines.supplement','Wniosek o uzupełniający przed końcem macierzyńskiego (dni)',0,90],
  ['deadlines.paternity','Wniosek pracownika o ojcowski (dni przed)',0,90],
  ['money.parentalFloor','Próg podwyższenia netto za pełny miesiąc (zł)',0,100000],
  ['money.debtPercent','Próg zadłużenia jako % minimum płacowego',0,100],
  ['money.funeral','Pogrzebowe dla członka rodziny w 2026 r. (zł)',0,100000],
  ['business.startMonths','Ulga na start: pełne miesiące',0,24],
  ['business.preferenceMonths','Preferencyjna podstawa: miesiące',0,60],
  ['business.lookbackMonths','Okres bez wcześniejszej działalności (miesiące)',0,120],
  ['business.smallRevenue','Limit rocznego przychodu Mały ZUS Plus (zł)',0,1000000],
  ['business.regularShare','Zwykła podstawa jako % prognozowanego wynagrodzenia',1,100],
  ['business.preferredShare','Preferencyjna podstawa jako % minimum płacowego',1,100],
  ['business.smallShare','Mały ZUS Plus: % przeciętnego dochodu miesięcznego',1,100],
  ['business.sicknessCapShare','Limit dobrowolnego chorobowego jako % prognozowanego wynagrodzenia',1,1000]
];
export const calcGet=(object,path)=>path.split('.').reduce((o,k)=>o?.[k],object);
export function calcSet(object,path,value){const keys=path.split('.');object[keys[0]][keys[1]]=value;}
export function validateCalculatorParameters(parameters){
  if(!parameters||typeof parameters!=='object'||Array.isArray(parameters))throw new CalculatorError('Nieprawidłowe parametry kalkulatora.');
  for(const [path,label,min,max]of CALCULATOR_PARAMETER_FIELDS){const n=calcGet(parameters,path);if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw new CalculatorError(`Sprawdź parametr: ${label}.`);}
  for(const n of Object.values(parameters.limits))if(!Number.isInteger(n))throw new CalculatorError('Limity dni i tygodni muszą być całkowite.');
  if(parameters.limits.reserved*2>Math.min(parameters.limits.parental1,parameters.limits.adoptionShort))throw new CalculatorError('Części wyłączne nie mogą przekroczyć wspólnej puli.');
  for(const [year,wage]of Object.entries(parameters.minimumWage||{}))if(!/^20\d\d$/.test(year)||typeof wage!=='number'||!Number.isFinite(wage)||wage<=0||wage>100000)throw new CalculatorError('Sprawdź minimalne wynagrodzenia i lata.');
  if(!Object.keys(parameters.minimumWage||{}).length)throw new CalculatorError('Dodaj minimalne wynagrodzenie z datą.');
  if(!parameters.forecastWage||Array.isArray(parameters.forecastWage)||Object.entries(parameters.forecastWage).some(([year,n])=>!/^20\d\d$/.test(year)||typeof n!=='number'||!Number.isFinite(n)||n<=0||n>1e6))throw new CalculatorError('Sprawdź roczne prognozowane wynagrodzenia.');
  if(!parameters.rehabIndex||Array.isArray(parameters.rehabIndex)||Object.entries(parameters.rehabIndex).some(([q,n])=>!/^20\d\d-[1-4]$/.test(q)||typeof n!=='number'||!Number.isFinite(n)||n<=0||n>500))throw new CalculatorError('Sprawdź kwartalne wskaźniki waloryzacji.');
  if(!Array.isArray(parameters.postInsuranceCap)||parameters.postInsuranceCap.length>100)throw new CalculatorError('Sprawdź limity podstawy po ustaniu.');
  const capDates=[];
  for(const cap of parameters.postInsuranceCap){const valid=s=>/^20\d\d-\d\d-\d\d$/.test(s||'')&&Number.isFinite(Date.parse(s))&&new Date(s+'T12:00Z').toISOString().slice(0,10)===s;if(!valid(cap.from)||cap.to&&!valid(cap.to)||cap.to&&cap.to<cap.from||typeof cap.amount!=='number'||!Number.isFinite(cap.amount)||cap.amount<=0||cap.amount>1e6)throw new CalculatorError('Każdy limit wymaga prawidłowych dat i dodatniej kwoty.');if(capDates.some(c=>cap.from<=(c.to||'9999')&&c.from<=(cap.to||'9999')))throw new CalculatorError('Okresy limitów podstawy nie mogą się nakładać.');capDates.push(cap);}
  return structuredClone(parameters);
}
export function calculatorRulesFor(bundle,date){
  if(!bundle?.parameters)throw new CalculatorError('Nie udało się wczytać zasad kalkulatora. Odśwież informacje.');
  const versions=[{id:bundle.version,validFrom:bundle.validFrom,parameters:bundle.parameters},...(bundle.versions||[])].filter(v=>v.validFrom<=date).sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
  const version=versions.at(-1);if(!version)throw new CalculatorError('Dla tej daty nie ma zweryfikowanej wersji zasad. Wybierz późniejszą datę lub skonsultuj ją z ZUS.','eventDate');
  return {...bundle,parameters:version.parameters,appliedVersion:version.id,appliedFrom:version.validFrom};
}
