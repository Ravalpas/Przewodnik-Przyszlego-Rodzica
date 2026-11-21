import {shiftDate} from '../dist/age.js';
export function calculatorSimulation(body,today){
  const allowed=['login','insurance','debt','ezla','ezus','application','usc'];
  if(!allowed.includes(body?.operation))throw new Error('Nieznana symulacja.');
  const base={simulated:true,officiallyValid:false,sent:false,reference:'DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase(),date:today,operation:body.operation};
  if(body.operation==='login')return {...base,method:['mObywatel','login.gov.pl','eZUS'].includes(body.method)?body.method:'mObywatel',identity:{name:'Anna Przykładowa',birthDate:'1995-05-12'},name:'Profil demonstracyjny',message:'Symulacja logowania zakończona. Nie zalogowano do mObywatela i nie pobrano tożsamości.'};
  if(body.operation==='insurance'){
    const variant=['employee','business-debt','uninsured'].includes(body.variant)?body.variant:'employee';
    return {...base,variant,parents:[{occupation:variant==='uninsured'?'uninsured':variant==='business-debt'?'business':'employee',coverage:variant==='uninsured'?'none':variant==='business-debt'?'voluntary':'compulsory',insuranceFrom:shiftDate(today,-400),basisMode:variant==='business-debt'?'known':'salary',salary:6000,basis:5177.4,debt:variant==='business-debt'?500:0,payer:variant==='employee'?'employer':'zus',fte:1},{occupation:'employee',coverage:'compulsory',insuranceFrom:shiftDate(today,-500),basisMode:'salary',salary:9000,debt:0,payer:'zus',fte:1}],message:'To przykładowy zestaw danych, a nie odczyt konta ZUS.'};
  }
  if(body.operation==='debt'){const debt=Number(body.debt);if(!Number.isFinite(debt)||debt<0||debt>1e8)throw new Error('Podaj kwotę zadłużenia.');return {...base,debt,message:'Symulacja zaświadczenia według podanej kwoty. Nie potwierdza stanu konta ani prawa do świadczenia.'};}
  if(body.operation==='ezla')return {...base,certificates:[{id:'DEMO-EZLA-1',start:today,end:shiftDate(today,13),code:'B',status:'Przykładowe',diagnosisShared:false}],message:'Przykładowe e-ZLA; nie jest zwolnieniem lekarskim.'};
  return {...base,message:body.operation==='usc'?'Przygotowano symulację wniosku o odpis aktu. Nie wysłano jej do USC.':body.operation==='ezus'?'Zapisano demonstracyjny podgląd zapytania. Nie wysłano wiadomości do ZUS.':'Przygotowano demonstracyjny podgląd przekazania dokumentów. Nie wysłano nic do pracodawcy ani ZUS.'};
}
