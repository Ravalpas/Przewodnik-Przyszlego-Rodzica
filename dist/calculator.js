import {todayString,shiftDate} from './age.js';
import {calculatorRulesFor} from './calculator-params.js';
import {calcNormalizeInput} from './calculator-core.js';
import {calculateIntegrated} from './calculator-engine.js';
import {calcEscape as esc,calcIcon,calculatorResultHtml,calcMoney} from './calculator-view.js';
import {calculatorSituationHtml,calculatorParentsHtml,calculatorPlanHtml} from './calculator-forms.js';
import {createCalculatorTools,calcDownload,calculatorExport} from './calculator-tools.js';
import {calendarDate} from './polish.js';

export {calcIcon};
function calculatorInitial(profile){
  const title={occupation:'employee',coverage:'unknown',insuranceFrom:'',insuranceTo:'',previousDays:0,previousGap:0,waitException:'none',endReason:'none',courtConfirmed:false,parentalLeave:false,otherEmploymentOffered:false,externalExclusion:false,unpaidLeave:false,debt:0,debtPaidDate:'',basisMode:'known',basis:null,salary:null,previousBasis:null,basisContinuous:false,fteChanged:false,monthlyBonus:0,quarterBonuses:0,annualBonus:0,benefitRetainedComponents:0,minimumBasis:null,priorTitleMonths:0,history:[],fte:1,payer:'unknown',extraTitles:[]};
  return {focus:'family',familyType:'birth',eventDate:profile.planning?'':profile.mode==='child'?profile.anchor:profile.dueDate||shiftDate(profile.anchor,280),dateKind:profile.mode==='child'&&!profile.planning?'actual':'expected',count:1,childBirthDate:profile.mode==='child'&&!profile.planning?profile.anchor:'',adoptionCourtDate:'',schoolDelayed:false,life:false,adoptionShort:false,parents:[{...structuredClone(title),role:'mother'},{...structuredClone(title),role:'father'}],parentalParts:[{parent:0,weeks:32,start:'',work:0,extensionWork:0},{parent:1,weeks:9,start:'',work:0,extensionWork:0}],rateChoice:'standard',applicationDate:'',prenatalDays:0,transfer:'none',motherPostWeeks:14,transferDate:'',transferEnd:'',otherParentStopsWork:false,motherPauseStart:'',motherPauseEnd:'',loss:'none',lossDate:'',surviving:0,hospitals:[],gestation:40,birthWeight:3500,supplementParent:0,supplementApplication:'',paternityDays:0,paternityStart:'',paternitySecondStart:'',previousMaternityDays:0,previousParentDays:0,previousParent1Days:0,previousParent2Days:0,previousParts:0,topUpMonth:'',netReceived1:null,netReceived2:null,sickness:{start:'',days:30,usedDays:0,usedEmployerDays:0,usedAfterEndDays:0,previousEnd:'',previousPregnant:false,pregnant:true,certificate:'unknown',rehabExhausted:false,prognosis:false,rehabGranted:false,rehabAlreadyIndexed:false,otherBenefit:false,workingDuring:false},care:{start:'',days:10,type:'sick-child',reason:'closure',sameHousehold:false,ageMonths:0,disabled:false,noOtherCarer:false,qualifyingReason:false,closureNotice:0,usedAll:0,usedDisabled:0,usedAdult:0,onlyOlderDisabled:false,parent:profile.parentRole==='father'?1:0},business:{start:'',previousEnd:'',previousBusiness:false,previousCEIDG:true,formerEmployer:false,parentalLeave:false,monthsUsed:0,previousYearDays:365,revenue:0,income:0,tax:'normal',socialInCosts:0,otherExclusion:false,activeLastYear:true},dataOrigin:'manual'};
}
function calculatorSet(input,path,value){const keys=path.split('.');let target=input;for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)]=value;}
export function createIntegratedCalculator({getProfile,store,sheetContent,notify,onChange,openCalendar}){
  let root=null,input=null,result=null,currentId=null,step=0,bundle=null,error='',busy=false,draftTimer=null,loadPromise=null;
  const tools=createCalculatorTools({sheetContent,notify,getInput:()=>input,getResult:()=>result,getProfile,onImport:patch=>{input={...input,...patch};step=patch.focus?2:1;result=null;saveDraft();draw();}});
  async function rules(){
    if(bundle)return bundle;
    if(!loadPromise)loadPromise=(async()=>{try{const r=await fetch('/api/calculator/rules',{cache:'no-store'});if(!r.ok)throw new Error();const data=await r.json();if(!data?.parameters)throw new Error();bundle=data;}catch{bundle=await (await fetch('data/calculator-rules.json')).json();}return bundle;})().finally(()=>loadPromise=null);
    return loadPromise;
  }
  function saveDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(()=>{try{store.draft(input);}catch(e){notify(e.message);}},350);}
  async function mount(container,id){
    root=container;root.className='calculator-view';
    if(!input){const snapshot=store.snapshot();input=snapshot.draft||calculatorInitial(getProfile());if(!snapshot.available)error=snapshot.error;}
    if(id){const record=store.snapshot().cases.find(c=>c.id===id);if(record){input=structuredClone(record.input);result={...structuredClone(record.result),caseTitle:record.title};currentId=id;step=3;}}
    root.innerHTML='<div class="calc-loading">'+calcIcon()+'<p>Przygotowujemy Wasz kalkulator…</p></div>';
    try{await rules();if(root?.isConnected)draw();}catch{error='Nie udało się wczytać zweryfikowanych zasad. Spróbuj ponownie.';draw();}
  }
  function draw(){
    if(!root?.isConnected)return;
    const snapshot=store.snapshot(),steps=['Sytuacja','Dane','Plan','Wynik'];
    root.innerHTML=`<div class="calc-page-header"><div><span class="calc-heading-icon">${calcIcon()}</span><div><span class="eyebrow">Wasze uprawnienia, jeden plan</span><h1>Zintegrowany Kalkulator</h1><p>Sprawdźcie okresy, kwoty i dokumenty w swojej sytuacji.</p></div></div><div class="calc-header-actions"><button class="secondary" id="calc-tools">Dokumenty i połączenia</button><button class="secondary" id="calc-start-new">Nowy scenariusz</button></div></div><div class="calc-workspace"><aside class="calc-sidebar"><h2>Krok po kroku</h2><nav class="calc-steps" aria-label="Etapy kalkulatora">${steps.map((label,index)=>`<button data-calc-step="${index}" aria-current="${step===index?'step':'false'}"><span>${index+1}</span>${label}</button>`).join('')}</nav><section class="calc-saved"><h3>Zapisane scenariusze</h3>${snapshot.available?snapshot.cases.length?snapshot.cases.map(record=>`<article class="calc-saved-case ${record.id===currentId?'selected':''}"><button data-open-case="${record.id}"><strong>${esc(record.title)}</strong><small>${calendarDate(record.result.input.eventDate)} · ${record.result.rulesVersion}</small></button><div><button data-calendar-case="${record.id}" aria-pressed="${record.calendarEnabled}">${record.calendarEnabled?'W kalendarzu':'Dodaj do kalendarza'}</button><button data-delete-case="${record.id}">Usuń</button></div></article>`).join(''):'<p>Zapisz wynik, żeby wrócić do niego i zobaczyć terminy w kalendarzu.</p>':`<p class="calc-error">${esc(snapshot.error)}</p>`}</section><div class="calc-rules-caption"><p>Zasady zweryfikowane ${bundle?calendarDate(bundle.reviewedAt):'—'}.</p><a href="https://www.zus.pl/pl/swiadczenia/zasilki" target="_blank" rel="noopener noreferrer">Oficjalne informacje ZUS</a></div></aside><div class="calc-main">${input.dataOrigin==='demo'?'<div class="calc-demo-banner"><strong>Dane przykładowe</strong><span>Scenariusz wykorzystuje symulację pobrania. Zastąpcie wartości swoimi.</span><button id="calc-own-data">Wprowadzone dane są już moje</button></div>':''}<div id="calc-error" class="calc-error" role="alert" ${error?'':'hidden'}>${error?esc(error):''}</div>${step===3&&result?(result.rulesRevision!==bundle?.revision?'<div class="calc-notice">Zasady kalkulatora zostały zaktualizowane. Otwórz Plan i przelicz scenariusz przed użyciem zapisanych kwot i dat.</div>':'')+calculatorResultHtml(result,currentId):`<form id="integrated-calculator-form" novalidate>${step===0?calculatorSituationHtml(input):step===1?`<div class="calc-import-banner"><p>Możecie wprowadzić własne dane lub przećwiczyć pobranie danych z systemu.</p><button type="button" class="secondary" id="calc-import">Przykładowe dane ZUS</button></div>`+calculatorParentsHtml(input):calculatorPlanHtml(input,bundle?calculatorRulesFor(bundle,input.eventDate):null)}<div class="calc-wizard-actions">${step?'<button type="button" class="secondary" id="calc-prev">Wstecz</button>':''}<button class="primary" type="submit">${step===2?'Oblicz mój scenariusz':'Dalej'}</button></div></form>`}</div></div>`;
    root.querySelector('#calc-tools').onclick=tools.open;
    root.querySelector('#calc-start-new').onclick=()=>{currentId=null;input=calculatorInitial(getProfile());result=null;step=0;error='';saveDraft();draw();};
    root.querySelector('#calc-own-data')?.addEventListener('click',()=>{input.dataOrigin='manual';if(result)result=null;step=Math.min(step,2);saveDraft();draw();});
    root.querySelector('#calc-import')?.addEventListener('click',tools.open);
    root.querySelectorAll('[data-calc-step]').forEach(button=>button.onclick=()=>go(Number(button.dataset.calcStep)));
    root.querySelectorAll('[data-calc-focus]').forEach(button=>button.onclick=()=>{input.focus=button.dataset.calcFocus;error='';result=null;saveDraft();draw();});
    root.querySelectorAll('[data-calc-field]').forEach(control=>{
      const apply=()=>{let value=control.type==='checkbox'?control.checked:control.type==='number'?control.value===''?null:Number(control.value):control.value;if(['care.parent','supplementParent'].includes(control.dataset.calcField)||control.dataset.calcField.endsWith('.parent'))value=Number(value);calculatorSet(input,control.dataset.calcField,value);input.previousParentDays=Number(input.previousParent1Days||0)+Number(input.previousParent2Days||0);result=null;error='';root.querySelector('#calc-error').hidden=true;saveDraft();};
      control.oninput=apply;control.onchange=()=>{apply();if(control.tagName==='SELECT'){
        const path=control.dataset.calcField;if(path.endsWith('.occupation')){const base=path.slice(0,-11),title=base.split('.').reduce((o,k)=>o[k],input);if(title.occupation!=='employee'&&['salary','history'].includes(title.basisMode))title.basisMode='known';}draw();root.querySelector('[data-calc-field="'+control.dataset.calcField+'"]')?.focus();}};
    });
    const form=root.querySelector('#integrated-calculator-form');if(form)form.onsubmit=e=>{e.preventDefault();go(step+1);};
    root.querySelector('#calc-prev')?.addEventListener('click',()=>go(step-1));
    root.querySelectorAll('[data-add-history]').forEach(button=>button.onclick=()=>{const title=button.dataset.addHistory.split('.').reduce((o,k)=>o[k],input);title.history??=[];if(title.history.length>=12){notify('Możesz dodać najwyżej 12 miesięcy.');return;}title.history.push({gross:null,deducted:null,minimum:null,worked:20,scheduled:20,excused:true});saveDraft();draw();});
    root.querySelectorAll('[data-add-title]').forEach(button=>button.onclick=()=>{const p=input.parents[Number(button.dataset.addTitle)];p.extraTitles??=[];if(p.extraTitles.length>=3){notify('Możesz porównać do 4 tytułów jednego rodzica.');return;}const title=structuredClone(calculatorInitial(getProfile()).parents[0]);delete title.extraTitles;p.extraTitles.push(title);saveDraft();draw();});
    root.querySelector('#calc-add-part')?.addEventListener('click',()=>{if(input.parentalParts.length>=5){notify('Wspólna liczba części to maksymalnie 5.');return;}input.parentalParts.push({parent:0,weeks:0,start:'',work:0,extensionWork:0});saveDraft();draw();});
    root.querySelectorAll('[data-remove-part]').forEach(button=>button.onclick=()=>{input.parentalParts.splice(Number(button.dataset.removePart),1);saveDraft();draw();});
    root.querySelector('#calc-add-hospital')?.addEventListener('click',()=>{input.hospitals.push({child:1,start:input.eventDate||todayString(),end:input.eventDate||todayString()});saveDraft();draw();});
    root.querySelectorAll('[data-remove-hospital]').forEach(button=>button.onclick=()=>{input.hospitals.splice(Number(button.dataset.removeHospital),1);saveDraft();draw();});
    root.querySelectorAll('[data-open-case]').forEach(button=>button.onclick=()=>mount(root,button.dataset.openCase));
    root.querySelectorAll('[data-calendar-case]').forEach(button=>button.onclick=()=>{try{store.toggle(button.dataset.calendarCase);onChange();draw();}catch(e){showError(e);}});
    root.querySelectorAll('[data-delete-case]').forEach(button=>button.onclick=()=>{sheetContent('Usunąć scenariusz?','<p>Jego terminy znikną również z kalendarza. Pozostałe notatki zostaną zachowane.</p><button class="primary" id="calc-delete-confirm">Usuń scenariusz</button><button class="secondary" id="calc-delete-cancel">Zostaw</button>');document.querySelector('#calc-delete-cancel').onclick=()=>document.querySelector('#sheet').close();document.querySelector('#calc-delete-confirm').onclick=()=>{try{store.remove(button.dataset.deleteCase);if(currentId===button.dataset.deleteCase)currentId=null;document.querySelector('#sheet').close();onChange();draw();}catch(e){showError(e);}};});
    root.querySelector('#calc-save')?.addEventListener('click',()=>{try{const title=root.querySelector('#calc-case-title').value,record=store.save({id:currentId,title,input,result});currentId=record.id;result.caseTitle=record.title;onChange();notify('Zapisano scenariusz i powiązane terminy.');draw();}catch(e){showError(e);}});
    root.querySelector('#calc-export')?.addEventListener('click',()=>calcDownload('moj-scenariusz.html',calculatorExport(result)));
    root.querySelector('#calc-applications')?.addEventListener('click',tools.openApplication);
  }
  function showError(e){error=e.message||'Sprawdź wprowadzone dane.';const el=root?.querySelector('#calc-error');if(el){el.hidden=false;el.textContent=error;el.scrollIntoView({block:'center',behavior:'smooth'});}if(e.field){const field=root?.querySelector('[data-calc-field="'+e.field+'"]');if(field){field.closest('details')?.setAttribute('open','');field.setAttribute('aria-invalid','true');field.focus();}}}
  async function go(next){
    if(busy)return;
    if(next<0)return;
    if(next<3){if(next>step&&!input.eventDate){showError({message:'Podaj datę zdarzenia lub datę planowaną.',field:'eventDate'});return;}step=next;error='';draw();root.scrollTop=0;return;}
    busy=true;root.querySelectorAll('button[type=submit]').forEach(b=>{b.disabled=true;b.textContent='Obliczamy…';});
    try{
      await rules();input=calcNormalizeInput(input);let computed;
      try{const r=await fetch('/api/calculator/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input})}),data=await r.json();if(!r.ok){const e=new Error(data.error||'Sprawdź dane kalkulatora.');e.field=data.field;throw e;}computed=data;}catch(e){if(e instanceof TypeError){computed=calculateIntegrated(input,bundle);computed.warnings.unshift('Brak połączenia z serwerem. Użyto zachowanej wersji zasad; przed decyzją sprawdź jej aktualność.');}else throw e;}
      result=computed;step=3;error='';saveDraft();draw();root.scrollTop=0;
    }catch(e){showError(e);root.querySelectorAll('button[type=submit]').forEach(b=>{b.disabled=false;b.textContent='Oblicz mój scenariusz';});}finally{busy=false;}
  }
  return {mount,invalidateRules:()=>bundle=null,openCase:id=>{if(root?.isConnected)mount(root,id);}};
}
