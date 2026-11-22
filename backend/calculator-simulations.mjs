import {shiftDate,dayNumber} from '../dist/age.js';
export function calculatorSimulation(body,today){
  const allowed=['login','insurance','debt','ezla','ezus','application','usc'];
  if(!allowed.includes(body?.operation))throw new Error('Nieznana symulacja.');
  const base={simulated:true,officiallyValid:false,sent:false,reference:'DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase(),date:today,operation:body.operation};
  if(body.operation==='login')return {...base,method:['mObywatel','login.gov.pl','eZUS'].includes(body.method)?body.method:'mObywatel',identity:{name:'Anna Przykładowa',birthDate:'1995-05-12'},name:'Przykładowa tożsamość',message:'Przykładowe dane tożsamości są gotowe do uzupełnienia profilu i formularza.'};
  if(body.operation==='insurance'){
    const variant=['employee','business-debt','uninsured'].includes(body.variant)?body.variant:'employee';
    return {...base,variant,parents:[{occupation:variant==='uninsured'?'uninsured':variant==='business-debt'?'business':'employee',coverage:variant==='uninsured'?'none':variant==='business-debt'?'voluntary':'compulsory',insuranceFrom:variant==='uninsured'?'':shiftDate(today,-400),basisMode:variant==='business-debt'?'known':'salary',salary:variant==='uninsured'?null:6000,basis:variant==='uninsured'?null:5177.4,debt:variant==='business-debt'?1450.75:0,payer:variant==='employee'?'employer':'zus',fte:1},{occupation:'employee',coverage:'compulsory',insuranceFrom:shiftDate(today,-500),basisMode:'salary',salary:9000,debt:0,payer:'zus',fte:1}],message:variant==='business-debt'?'Przykładowa JDG: dobrowolne chorobowe i 1450,75 zł zaległości w składkach społecznych.':'Przykładowy zakres ubezpieczenia i dane do ustalenia podstawy świadczenia.'};
  }
  if(body.operation==='debt'){
    const debt=body.debt==null||body.debt===''?1450.75:Number(body.debt),asOf=body.asOf||today;dayNumber(asOf);
    if(!Number.isFinite(debt)||debt<0||debt>1e8)throw new Error('Podaj prawidłową kwotę zadłużenia.');
    return {...base,debt,socialDebt:debt,healthDebt:275.40,labourFundDebt:110.25,totalDebt:Math.round((debt+385.65)*100)/100,asOf,period:{start:shiftDate(asOf,-60),end:asOf},rows:[{name:'Ubezpieczenia społeczne',amount:debt},{name:'Ubezpieczenie zdrowotne',amount:275.40},{name:'Fundusz Pracy',amount:110.25}],message:'Do kalkulatora prawa do zasiłku przenosimy zadłużenie w składkach społecznych. Pozostałe należności pokazujemy oddzielnie.'};
  }
  if(body.operation==='ezla'){
    const variant=['pregnancy','own-illness','child-care'].includes(body.variant)?body.variant:'pregnancy',days=variant==='child-care'?5:14;
    return {...base,variant,certificates:[{id:base.reference,start:today,end:shiftDate(today,days-1),days,code:variant==='pregnancy'?'B':'',reason:variant==='pregnancy'?'Niezdolność do pracy w okresie ciąży':variant==='child-care'?'Opieka nad chorym dzieckiem':'Niezdolność do pracy z powodu choroby',status:'Dane przykładowe',diagnosisShared:false}],childBirthDate:variant==='child-care'?shiftDate(today,-730):null,message:variant==='child-care'?'Okres opieki można przenieść do zasiłku opiekuńczego wraz z przykładową datą urodzenia dziecka.':'Daty i informację o ciąży można zastosować w scenariuszu chorobowego.'};
  }
  if(body.operation==='usc'){
    const birthDate=body.childBirthDate||shiftDate(today,-30);dayNumber(birthDate);if(birthDate>today)throw new Error('Data urodzenia nie może być przyszła.');
    return {...base,extract:{type:body.extractType==='full'?'Odpis zupełny aktu urodzenia':'Odpis skrócony aktu urodzenia',childName:String(body.childName||'Jan Przykładowy').slice(0,200),birthDate,birthPlace:'Warszawa',issuedAt:today},message:'Przygotowano przykładowy odpis z danymi urodzenia.'};
  }
  if(body.operation==='ezus'){
    const topic=['insurance','debt','maternity','care','other'].includes(body.topic)?body.topic:'maternity',lists={insurance:['Okresy i tytuły zgłoszone do ubezpieczeń','Daty objęcia chorobowym oraz zgłoszenia płatnika'],debt:['Saldo składek społecznych na dzień powstania prawa','Potwierdzenia wpłat oraz ewentualna umowa ratalna'],maternity:['Dane narodzin lub przyjęcia dziecka i dokument sądu, jeśli dotyczy','Historia okresów obojga rodziców oraz właściwy wniosek'],care:['Dokument potwierdzający potrzebę opieki','Wykorzystanie wspólnego limitu i możliwość opieki przez domowników'],other:['Chronologia zdarzeń i pisma otrzymane w sprawie','Informacje o ubezpieczeniu i dotychczasowych świadczeniach']};
    return {...base,topic,checklist:lists[topic],portalUrl:'https://www.zus.pl/ezus/logowanie?jezyk=pl',status:'Przygotowano',message:'Szkic sprawy jest gotowy wraz z listą danych do sprawdzenia w eZUS.'};
  }
  return {...base,status:'prepared',message:'Projekt przekazania dokumentów został przygotowany.'};
}
