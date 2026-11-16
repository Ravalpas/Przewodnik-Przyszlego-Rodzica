export const PROTECTED_EVENT_IDS=new Set(['usc','insurance','vaccine-newborn','vaccine-six-weeks']);
const optionalKinds=new Set(['Warunek świadczenia','Uprawnienia pracownicze','Termin finansowy','Termin wyrównania','Świadczenie warunkowe','Uprawnienie pracownicze','Termin kalendarzowy']);
const recommendedKinds=new Set(['Opieka zdrowotna','Zalecane badania','Przysługująca opieka','Zalecana profilaktyka']);
export const EVENT_GROUPS=[
  {id:'required',title:'Obowiązkowe — ważne',description:'Formalności i obowiązkowe szczepienia. Sprawdź je w pierwszej kolejności.'},
  {id:'recommended',title:'Zalecane — zdrowie i opieka',description:'Badania i opieka, które warto zaplanować odpowiednio do swojej sytuacji.'},
  {id:'optional',title:'Dodatkowe — świadczenia i uprawnienia',description:'Możesz z nich skorzystać, jeśli spełniasz warunki. Złożenie wniosku jest Twoim wyborem.'}
];
export function eventPolicy(event){
  const required=PROTECTED_EVENT_IDS.has(event.id)||event.obligation==='required'||/^Obowiązek\b/u.test(event.kind||'');
  const group=required?'required':optionalKinds.has(event.kind)||event.obligation==='optional'?'optional':'recommended';
  return {group,required,canMarkNotApplicable:!required&&(optionalKinds.has(event.kind)||recommendedKinds.has(event.kind)||event.obligation==='optional')};
}
export function taskDisposition(profile,event,status){
  if(!['pending','done','not-applicable'].includes(status))throw new Error('Nieprawidłowy stan sprawy.');
  if(status==='not-applicable'&&!eventPolicy(event).canMarkNotApplicable)throw new Error('Obowiązkowej sprawy nie można oznaczyć jako „Nie dotyczy”.');
  const completed=(profile.completedTasks||[]).filter(id=>id!==event.id),excluded=(profile.notApplicableTasks||[]).filter(id=>id!==event.id);
  if(status==='done')completed.push(event.id);
  if(status==='not-applicable')excluded.push(event.id);
  return {completedTasks:[...new Set(completed)],notApplicableTasks:[...new Set(excluded)]};
}
export function sortTasks(events){return [...events].sort((a,b)=>Number(a.done)-Number(b.done)||(a.end||'9999-12-31').localeCompare(b.end||'9999-12-31')||a.title.localeCompare(b.title,'pl'));}
