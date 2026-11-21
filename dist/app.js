import {onboardingHtml,parentRoleLabel} from './parent-onboarding.js';
import {importantIcon} from './planner.js';
import { STORAGE_KEY, todayString, anchorFromAge, ageAt, completedWeeksText, validateProfile } from './age.js';
import { cleanName, validateName, normalizeProfile, completedStages, usageDays } from './profile.js';
import { resetForFreshStart } from './reset.js';
import { avatar, genderLabel } from './avatars.js';
import { createPlanner,refreshIcon } from './planner.js';
import { ageUnitLabel, pluralWord, quantity, ordinal, calendarDate, periodText } from './polish.js';
import {createBielikChat,doctorPortrait,chatIcon} from './chat.js';
import {createNotesStore,NOTES_KEY} from './notes.js';
import {createCalculatorStore,CALCULATOR_STORAGE_KEY} from './calculator-storage.js';
import {createIntegratedCalculator,calcIcon} from './calculator.js';

const app = document.querySelector('#app');
const sheet = document.querySelector('#sheet');
const icons = {
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back:'<path d="m14 6-6 6 6 6"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  route:'<path d="M8 4h8a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h8"/><circle cx="6" cy="4" r="2"/><circle cx="18" cy="20" r="2"/>',
  target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  doctor:'<path d="M8 3H5v7a5 5 0 0 0 10 0V3h-3M10 15v2a4 4 0 0 0 8 0v-3"/><circle cx="18" cy="11" r="3"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="white"/><circle cx="15" cy="17" r="3" fill="white"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.target}</svg>`;
const brand = () => '<div class="brand"><img src="assets/logo.png" alt="Logo aplikacji"><div class="brand-copy"><b><span>Przewodnik</span><span>Przyszłej Mamy</span></b><small>Blisko Ciebie. Krok po kroku.</small></div></div>';
const stageName = mode => mode==='pregnancy'?'ciąży':'życia';
const modeName = mode => mode==='pregnancy'?'Droga ciąży':'Pierwsze kroki razem';
const maxWeeks = mode => mode==='pregnancy'?42:52;
const escape = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile = null, selectedMode = 'pregnancy', maps, resizeObserver, lastToday = todayString(), toastTimer, storageAvailable = true;
let activeTab='map',previewMode='pregnancy';
const onboarding={role:null,stage:null,gender:null};
let updateJourneyLayout=()=>{};
const sessionStartedAt=new Date().toISOString();
try { resetForFreshStart(localStorage);const raw = localStorage.getItem(STORAGE_KEY); if(raw){profile=normalizeProfile(JSON.parse(raw));localStorage.setItem(STORAGE_KEY,JSON.stringify(profile));} } catch { storageAvailable=false; }
const notesStore=createNotesStore();
const calculatorStore=createCalculatorStore();
const planner=createPlanner({getProfile:()=>profile,persist,sheetContent,notify,notesStore,calculatorStore,openCalculator:showCalculator});
const integratedCalculator=createIntegratedCalculator({getProfile:()=>profile,store:calculatorStore,sheetContent,notify,onChange:()=>{if(profile)renderJourney(false);},openCalendar:showCalendar});
const bielikChat=createBielikChat({openCalculator:showCalculator,getCalculator:()=>calculatorStore.snapshot(),getProfile:()=>profile,getTasks:()=>planner.events(),getNotes:()=>notesStore.snapshot(),openNote:id=>planner.openNote(id),openTask:id=>planner.openEvent(id),onBack:showMap});
planner.setOnChange(()=>{integratedCalculator.invalidateRules();if(profile)renderJourney(false);});

function notify(message) {
  const el=document.querySelector('#toast'); el.textContent=message;el.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3300);
}
function persist(p) {
  profile=normalizeProfile({...profile,...p},{isNew:!profile,now:profile?new Date().toISOString():sessionStartedAt});
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(profile));storageAvailable=true;return true; }
  catch {storageAvailable=false;return false;}
}
function warning(){return storageAvailable?'':'<p class="storage-warning">Przeglądarka nie pozwala zapisać danych. Twoja droga działa w tej sesji, ale po zamknięciu może być konieczne ponowne ustawienie wieku.</p>';}
function unitOptions(mode, unit='weeks', value='') {
  return (unit?'':'<option value="" disabled selected>Wybierz jednostkę</option>')+['days','weeks','months'].map(key=>`<option value="${key}" ${unit===key?'selected':''}>${ageUnitLabel(value,key)} ${stageName(mode)}</option>`).join('');
}
function syncUnitLabels(form,mode) {
  for(const option of form.elements.unit.options)if(option.value)option.textContent=`${ageUnitLabel(form.elements.age.value,option.value)} ${stageName(mode)}`;
}
function fields(mode, value, unit='weeks') {
  return `<label class="field-label" for="age-value">Ile czasu już minęło?</label><div class="age-fields"><input id="age-value" name="age" type="number" min="0" max="36525" step="1" inputmode="numeric" value="${value}" required aria-describedby="age-help" aria-label="Liczba dni, tygodni lub miesięcy"><select id="age-unit" name="unit" aria-label="Jednostka wieku">${unitOptions(mode,unit,value)}</select></div><p id="age-help" class="field-help">Wpisz ukończony czas. 0–6 dni to 1. tydzień, a 7–13 dni to 2. tydzień. Miesiące przeliczamy według kalendarza.</p><div class="conversion" aria-live="polite">${icon('calendar')}<div><strong id="converted-age"></strong><small id="converted-stage"></small></div></div>`;
}

function showWelcome() {
  resizeObserver?.disconnect();
  app.innerHTML=onboardingHtml(brand(),icon('arrow'),onboarding,importantIcon());
  app.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.choice;onboarding[key]=button.dataset.value;
    app.querySelectorAll('[data-choice="'+key+'"]').forEach(b=>{const on=b.dataset.value===onboarding[key];b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
    app.querySelector('#onboarding-'+(key==='role'?'role':key==='stage'?'stage':'gender')).querySelector('.choice-error').hidden=true;
    app.querySelector('#onboarding-'+key).classList.remove('choice-required');
    app.querySelector('#onboarding-gender').hidden=onboarding.stage==='planning';
  }));
  app.querySelector('#onboarding-form').addEventListener('submit',event=>{
    event.preventDefault();let first;
    for(const key of ['role','stage',...(onboarding.stage==='planning'?[]:['gender'])]){
      const field=app.querySelector('#onboarding-'+key),missing=!onboarding[key];field.querySelector('.choice-error').hidden=!missing;
      field.classList.toggle('choice-required',missing);if(missing&&!first)first=field;
    }
    if(first){first.scrollIntoView({behavior:'smooth',block:'center'});first.querySelector('button').focus();return;}
    if(onboarding.stage==='planning'){persist({mode:'pregnancy',anchor:todayString(),planning:true,parentRole:onboarding.role,gender:'unspecified'});activeTab='map';renderJourney();}
    else{selectedMode=onboarding.stage;showAgeSetup();}
  });
}
function showAgeSetup() {
  const mode=selectedMode;
  app.innerHTML=`<main class="welcome age-setup"><div class="back-row"><button id="back" class="icon-button" aria-label="Wróć do wyboru etapu">${icon('back')}</button><span class="eyebrow">Poznajmy się</span><div class="steps" aria-label="Krok 2 z 2"><span class="done"></span><span class="done"></span></div></div><div class="age-setup-layout"><section class="age-setup-intro"><div class="welcome-art" aria-hidden="true"><img src="assets/logo.png" alt=""><span class="spark">✦</span></div><div class="eyebrow">${mode==='pregnancy'?'Oczekujemy dziecka':'Dziecko jest już z nami'}</div><h1 style="margin-top:10px">${mode==='pregnancy'?'Który to już<br>tydzień?':'Ile czasu jesteście<br>już razem?'}</h1><p>Ustaw wiek, a my znajdziemy Twoje miejsce na drodze.</p></section><div class="age-setup-fields"><form id="setup-form" class="age-form" novalidate>${fields(mode,'','')}<p id="form-error" class="error" role="alert"></p><button type="submit" class="primary">Pokaż moją drogę ${icon('arrow')}</button></form>${warning()}<div class="welcome-foot">Wiek będzie aktualizował się z każdym dniem.<br>W każdej chwili możesz go poprawić w profilu.</div></div></div></main>`;
  app.querySelector('#back').addEventListener('click',showWelcome);
  const form=app.querySelector('form');
  const getAnchor=()=>anchorFromAge(form.elements.age.value,form.elements.unit.value);
  const update=()=>{syncUnitLabels(form,mode);const incomplete=form.elements.age.value===''||!form.elements.unit.value;form.querySelector('.conversion').hidden=incomplete;if(incomplete){setError('');return;}try{const anchor=getAnchor();const age=validateProfile({mode,anchor});renderConversion(age,mode);setError('');}catch(e){setError(e.message);renderConversion(null,mode);} };
  form.addEventListener('input',update);form.addEventListener('change',update);update();
  form.addEventListener('submit',event=>{event.preventDefault();try{const p={mode,anchor:getAnchor(),planning:false,parentRole:onboarding.role||profile?.parentRole||'unspecified',gender:onboarding.gender||profile?.gender||'unspecified'};validateProfile(p);const saved=persist(p);renderJourney();if(!saved)notify('Ustawiono wiek. Zapisywanie w przeglądarce jest niedostępne.');}catch(e){setError(e.message);}});
}
function setError(message){const el=document.querySelector('#form-error');if(el)el.textContent=message;}
function renderConversion(age,mode){document.querySelector('#converted-age').textContent=age?completedWeeksText(age,mode):'Sprawdź wpisany wiek';document.querySelector('#converted-stage').textContent=age?`${ordinal(age.stage,'weeks')} ${stageName(mode)}${age.stage>maxWeeks(mode)?' · poza zakresem mapy':''}`:'Wiek podaj w pełnych dniach, tygodniach lub miesiącach.';}

function nodeSvg(point,index,age) {
  const week=index+1, completed=week<age.stage, current=week===age.stage;
  const status=completed?'completed':current?'current':'future';
  const color=completed?'#3979d7':current?'#3979d7':'#d4d9e2';
  // Cover the original illustration's check badge separately, preserving the exact route and artwork.
  return `<g class="map-node ${status}" data-week="${week}" role="button" tabindex="0" aria-label="${ordinal(week,'weeks')} ${stageName(profile.planning?previewMode:profile.mode)}, ${completed?'miniony':current?'obecny':'przyszły'}" ${current?'aria-current="step"':''} transform="translate(${point.x} ${point.y})"><title>${ordinal(week,'weeks')}</title><circle cx="51" cy="60" r="32" fill="white"/><circle r="77" fill="white"/>${current?'<circle r="90" fill="none" stroke="#304a91" stroke-width="9"/>':''}<circle class="node-disc" r="67" fill="${color}"/><path d="M-48-24a54 54 0 0 1 57-29" fill="none" stroke="${completed||current?'#8dbbff':'#e9edf2'}" stroke-width="9" stroke-linecap="round"/><text text-anchor="middle" dominant-baseline="central" y="2" fill="${completed||current?'white':'#8f99ab'}" font-size="72" font-weight="800" font-family="Trebuchet MS, sans-serif">${week}</text>${completed?'<circle cx="51" cy="60" r="27" fill="white"/><circle cx="51" cy="60" r="22" fill="#3979d7"/><path d="m40 60 8 8 15-18" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>':''}${current?'<g aria-hidden="true"><rect x="-116" y="-158" width="232" height="49" rx="16" fill="#304a91"/><path d="m-12-110 12 13 12-13" fill="#304a91"/><text y="-126" fill="white" font-family="Trebuchet MS, sans-serif" font-size="25" font-weight="800" text-anchor="middle">JESTEŚ TUTAJ</text></g>':''}</g>`;
}
function mapArtwork(mode) {
  if(mode==='pregnancy')return `<g class="pregnancy-start-rays" aria-hidden="true"><path d="M600 25H720V155H630L608 129 586 100Z" fill="white"/><circle cx="622" cy="146" r="12" fill="white"/><g transform="translate(520 190)" fill="none" stroke="#ffc400" stroke-width="10" stroke-linecap="round">${[-90,-60,-30,0,30,60,90].map(angle=>`<path transform="rotate(${angle})" d="M0 -128V-151"/>`).join('')}</g></g>`;
  return `<g class="map-artwork" aria-hidden="true"><rect x="45" y="3090" width="300" height="420" fill="white"/><image data-art="pacifier" href="assets/pacifier.png" x="-60" y="3020" width="540" height="540" preserveAspectRatio="xMidYMid meet"/><rect x="730" y="5700" width="330" height="420" fill="white"/><image data-art="bear" href="assets/bear.png" x="660" y="5670" width="460" height="460" preserveAspectRatio="xMidYMid meet"/><rect x="45" y="6540" width="300" height="450" fill="white"/><image data-art="onesie" href="assets/onesie.png" x="-20" y="6470" width="430" height="430" preserveAspectRatio="xMidYMid meet"/></g>`;
}
function journeyPanels(){
  const upcoming=notesStore.snapshot().notes.filter(note=>note.date>=todayString()).slice(0,2);
  const tasks=planner.events().filter(e=>!e.done&&!e.notApplicable).sort((a,b)=>Number(b.required)-Number(a.required)).slice(0,4);
  const noteHtml=upcoming.length?upcoming.map(note=>`<button class="aside-note" data-side-note="${escape(note.id)}"><small>${calendarDate(note.date)}${note.time?' · '+escape(note.time):''}</small><strong>${escape(note.text.split('\n')[0].slice(0,120))}</strong></button>`).join(''):'<p>W kalendarzu możecie zapisać wizytę lub ważne przypomnienie.</p>';
  const taskHtml=tasks.length?tasks.map(e=>`<button class="settings-row aside-task" data-side-event="${e.id}">${icon(e.required?'target':'calendar')}<span><strong>${escape(e.title)}</strong><small>${e.preview?'Podgląd na przyszłość':escape(periodText(e))}</small></span></button>`).join(''):'<p>Nie macie otwartych spraw w wybranym zakresie informacji.</p>';
  return `<aside class="journey-aside journey-aside-left"><span class="eyebrow">Pod ręką</span><h2>Wasza codzienność</h2><p class="aside-role">Profil rodzica: <strong>${parentRoleLabel(profile.parentRole)}</strong></p><div class="aside-stats"><div><strong>${profile.planning?94:completedStages(profile)}</strong><span>${profile.planning?'Etapy do poznania':'Zaliczone etapy'}</span></div><div><strong>${usageDays(profile)}</strong><span>${pluralWord(usageDays(profile),'Dzień','Dni','Dni')} z aplikacją</span></div></div><button class="secondary" id="aside-calendar">${icon('calendar')}Otwórz kalendarz</button><section class="aside-notes"><h3>Najbliższe notatki</h3>${noteHtml}</section></aside><aside class="journey-aside journey-aside-right"><span class="eyebrow">Warto pamiętać</span><h2>Wasze sprawy</h2><p>${profile.planning?'Poznajcie świadczenia i formalności, które mogą przydać się na kolejnych etapach.':'Sprawdźcie sprawy na Waszej drodze i przygotujcie dokumenty na odpowiedni moment.'}</p><div id="aside-tasks">${taskHtml}</div><button class="aside-chat" id="aside-chat">${doctorPortrait()}<span><strong>Doktor Bielik</strong><small>Zapytajcie o Wasze sprawy</small></span></button><button class="secondary" id="aside-doctor">${icon('doctor')}Kontakt z lekarzem</button></aside>`;
}
function renderJourney(center=true) {
  resizeObserver?.disconnect();
  const mode=profile.planning?previewMode:profile.mode,age=profile.planning?{days:0,weeks:-1,stage:0,extraDays:0}:ageAt(profile.anchor),map=maps[mode],total=maxWeeks(mode),beyond=age.stage>total;
  app.innerHTML=`<header class="app-header"><div class="top-row">${brand()}<button id="edit-top" class="icon-button" aria-label="Ustawienia">${icon('settings')}</button></div><section class="journey-summary" aria-label="Twój obecny etap"><div class="summary-top"><span>${modeName(mode)}</span><small>${Math.max(0,Math.min(age.weeks,total))} / ${total} tyg.</small></div><div class="child-summary">${avatar(profile.gender)}<div><div class="child-name" title="${escape(profile.name)}">${escape(profile.name)||'Twoje dziecko'}</div><h1>${profile.planning?'Poznajcie drogę przed Wami':beyond?'Kolejny rozdział przed Wami':`${ordinal(age.stage,'weeks')} ${stageName(mode)}`}</h1></div></div><div class="summary-bottom"><p>${profile.planning?'Planowanie dziecka · podgląd etapów':completedWeeksText(age,mode)}</p></div><div class="progress-track" role="progressbar" aria-label="Upływ czasu na mapie" aria-valuenow="${Math.max(0,Math.min(age.weeks,total))}" aria-valuemin="0" aria-valuemax="${total}"><div style="width:${Math.max(0,Math.min(100,age.weeks/total*100))}%"></div></div></section></header><main class="map-scroll" id="map-scroll" aria-label="${modeName(mode)}"><div class="map-lead"><span class="eyebrow">Każdy tydzień to mały wielki krok</span><p>Dotknij numeru, aby otworzyć etap.</p><div class="legend"><span><i></i>Minione</span><span><i class="now"></i>Teraz</span><span><i class="later"></i>Przed Wami</span></div></div><div class="map-canvas"><img class="map-image" src="assets/${mode==='pregnancy'?'mapa-ciazy.png':'mapa-dziecka.png'}" width="${map.width}" height="${map.height}" alt="Ilustrowana, kręta droga ${mode==='pregnancy'?'ciąży':'pierwszego roku życia'}"><svg class="map-overlay" viewBox="0 0 ${map.width} ${map.height}" aria-label="Tygodnie ${stageName(mode)}">${mapArtwork(mode)}${map.points.map((p,i)=>nodeSvg(p,i,age)).join('')}</svg></div><section class="map-tail"><strong>${mode==='pregnancy'?'Nowy rozdział zaczyna się tutaj':'Rok pełen małych wielkich chwil'} <span class="tail-heart" aria-hidden="true">♥</span></strong><p>${mode==='pregnancy'?'Gdy dziecko będzie już z Wami, ustaw datę urodzenia i przejdź na jego własną drogę.':'Ta mapa obejmuje pierwsze 52 tygodnie życia.'}</p>${mode==='pregnancy'?'<button id="birth-tail" class="secondary">Dziecko jest już z nami</button>':''}</section></main><button id="recenter" class="recenter">${icon('target')}Mój tydzień</button><nav class="bottom-nav" aria-label="Nawigacja główna"><button class="nav-item active" id="nav-map" aria-current="page"><span class="nav-icon">${icon('route')}</span>Moja droga</button><button class="nav-item" id="nav-today"><span class="nav-icon">${icon('target')}</span>Na dziś</button><button class="nav-item" id="nav-profile"><span class="nav-icon">${icon('user')}</span>Mój profil</button></nav>`;
  if(profile.planning){
    app.querySelector('#birth-tail')?.remove();
    app.querySelector('#nav-today').hidden=true;app.querySelector('#recenter').hidden=true;
    app.querySelector('.map-lead').insertAdjacentHTML('afterbegin','<div class="preview-switch"><button data-preview="pregnancy" aria-pressed="'+(mode==='pregnancy')+'">Droga ciąży</button><button data-preview="child" aria-pressed="'+(mode==='child')+'">Droga dziecka</button></div><p>Podgląd bez przypisanego wieku i terminów porodu.</p>');
    app.querySelectorAll('[data-preview]').forEach(b=>b.addEventListener('click',()=>{previewMode=b.dataset.preview;renderJourney(false);app.querySelector('#map-scroll').scrollTop=0;}));
  }
  const doctorNav=document.createElement('button');doctorNav.id='nav-doctor';doctorNav.className='nav-item';doctorNav.innerHTML='<span class="nav-icon">'+icon('doctor')+'</span>Lekarz';app.querySelector('#nav-profile').before(doctorNav);doctorNav.addEventListener('click',showDoctor);
  app.insertAdjacentHTML('beforeend',journeyPanels());
  app.querySelector('#aside-calendar').addEventListener('click',showCalendar);app.querySelector('#aside-doctor').addEventListener('click',showDoctor);
  app.querySelector('#aside-chat').addEventListener('click',showChat);
  app.querySelectorAll('[data-side-note]').forEach(b=>b.addEventListener('click',()=>planner.openNote(b.dataset.sideNote)));
  app.querySelectorAll('[data-side-event]').forEach(b=>b.addEventListener('click',()=>planner.openEvent(b.dataset.sideEvent)));
  app.querySelector('#edit-top').addEventListener('click',openSettings);
  const topActions=document.createElement('div');topActions.className='top-actions';
  const refreshButton=document.createElement('button');refreshButton.id='refresh-sources';refreshButton.className='refresh-sources';refreshButton.setAttribute('aria-label','Odśwież oficjalne informacje');refreshButton.innerHTML=refreshIcon()+'<span>Odśwież</span>';refreshButton.addEventListener('click',planner.refresh);
  const settings=app.querySelector('#edit-top');settings.before(topActions);topActions.append(refreshButton,settings);
  const calendarButton=document.createElement('button');calendarButton.className='nav-item';calendarButton.id='nav-calendar';calendarButton.innerHTML=`<span class="nav-icon">${icon('calendar')}</span>Kalendarz`;
  app.querySelector('#nav-today').after(calendarButton);calendarButton.addEventListener('click',showCalendar);
  const calculatorButton=document.createElement('button');calculatorButton.id='nav-calculator';calculatorButton.className='nav-item';calculatorButton.setAttribute('aria-label','Zintegrowany Kalkulator');calculatorButton.innerHTML='<span class="nav-icon">'+calcIcon()+'</span><span class="calc-nav-label-full">Zintegrowany Kalkulator</span><span class="calc-nav-label-short">Kalkulator</span>';calendarButton.before(calculatorButton);calculatorButton.addEventListener('click',()=>showCalculator());
  const chatButton=document.createElement('button');chatButton.className='nav-item';chatButton.id='nav-chat';chatButton.innerHTML=`<span class="nav-icon">${chatIcon()}</span>Doktor Bielik`;calendarButton.after(chatButton);chatButton.addEventListener('click',showChat);
  const doctorButton=document.createElement('button');doctorButton.id='doctor-launcher';doctorButton.className='doctor-launcher';doctorButton.setAttribute('aria-label','Otwórz czat z Doktorem Bielikiem');doctorButton.title='Doktor Bielik · asystent AI';doctorButton.innerHTML=doctorPortrait();app.querySelector('.bottom-nav').before(doctorButton);doctorButton.addEventListener('click',showChat);
  app.querySelector('#nav-profile').addEventListener('click',openProfile);
  app.querySelector('#nav-map').addEventListener('click',showMap);
  app.querySelector('#nav-today').addEventListener('click',()=>openStage(Math.min(age.stage,total),beyond));
  app.querySelector('#recenter').addEventListener('click',()=>centerCurrent(true));
  app.querySelector('#birth-tail')?.addEventListener('click',openBirth);
  app.querySelectorAll('.map-node').forEach(node=>{
    node.addEventListener('click',()=>openStage(Number(node.dataset.week)));
    node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openStage(Number(node.dataset.week));}});
  });
  const layout=()=>{
    const scroll=app.querySelector('#map-scroll');scroll.style.top=`${app.querySelector('.app-header').offsetHeight}px`;
    const bottom=app.querySelector('.bottom-nav').offsetHeight;scroll.style.bottom=`${bottom}px`;app.querySelector('#recenter').style.bottom=`${bottom+16}px`;
    const calendar=app.querySelector('#calendar-view');if(calendar){calendar.style.top=scroll.style.top;calendar.style.bottom=scroll.style.bottom;}
    const chatView=app.querySelector('#chat-view');if(chatView){chatView.style.top=scroll.style.top;chatView.style.bottom=scroll.style.bottom;}
    const summary=app.querySelector('.journey-summary'),desktop=window.matchMedia('(min-width: 900px)').matches;
    app.querySelectorAll('.journey-aside').forEach(el=>{const top=desktop&&el.classList.contains('journey-aside-left')&&!summary.hidden?Math.ceil(summary.getBoundingClientRect().bottom-app.getBoundingClientRect().top)+20:app.querySelector('.app-header').offsetHeight+24;el.style.top=top+'px';el.style.maxHeight='calc(100% - '+(top+bottom+24)+'px)';el.hidden=activeTab!=='map';});
    const doctorView=app.querySelector('#doctor-view');if(doctorView){doctorView.style.top=scroll.style.top;doctorView.style.bottom=scroll.style.bottom;}
    const calculatorView=app.querySelector('#calculator-view');if(calculatorView){calculatorView.style.top=scroll.style.top;calculatorView.style.bottom=scroll.style.bottom;}
    const doctor=app.querySelector('#doctor-launcher');doctor.hidden=activeTab!=='map';doctor.style.bottom=`${bottom+30+app.querySelector('#recenter').offsetHeight}px`;
    app.querySelector('.map-lead').style.paddingTop='20px';
    app.querySelector('.map-canvas').style.setProperty('--map-top-trim',`${(mode==='child'?330:0)*app.querySelector('.map-canvas').clientWidth/map.width}px`);
  };
  updateJourneyLayout=layout;
  layout();
  resizeObserver=new ResizeObserver(()=>{layout();});for(const observed of [app,app.querySelector('.app-header'),app.querySelector('.journey-summary'),app.querySelector('.bottom-nav')])resizeObserver.observe(observed);
  if(activeTab==='chat')showChat();else if(activeTab==='calendar')showCalendar();else if(activeTab==='doctor')showDoctor();else if(activeTab==='calculator')showCalculator();else if(center)requestAnimationFrame(()=>centerCurrent());
}
function updateNav(){app.querySelector('.journey-summary').hidden=activeTab!=='map';app.classList.toggle('calendar-active',activeTab==='calendar');app.classList.toggle('chat-active',activeTab==='chat');app.style.height=activeTab==='chat'&&window.visualViewport?`${Math.round(window.visualViewport.height)}px`:'';for(const id of ['nav-map','nav-calendar','nav-chat','nav-doctor','nav-calculator']){const b=app.querySelector('#'+id),selected=id===`nav-${activeTab}`;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}updateJourneyLayout();}
function showCalculator(id){activeTab='calculator';for(const selector of ['#calendar-view','#chat-view','#doctor-view'])app.querySelector(selector)?.remove();app.querySelector('#map-scroll').hidden=true;app.querySelector('#recenter').hidden=true;let view=app.querySelector('#calculator-view');if(!view){view=document.createElement('main');view.id='calculator-view';view.setAttribute('aria-label','Zintegrowany Kalkulator');app.querySelector('.bottom-nav').before(view);}integratedCalculator.mount(view,id);updateNav();}
function showMap(){app.querySelector('#calculator-view')?.remove();app.querySelector('#doctor-view')?.remove();activeTab='map';app.querySelector('#map-scroll').hidden=false;app.querySelector('#calendar-view')?.remove();app.querySelector('#chat-view')?.remove();app.querySelector('#recenter').hidden=profile.planning;updateNav();centerCurrent(true);}
function showCalendar(){app.querySelector('#calculator-view')?.remove();app.querySelector('#doctor-view')?.remove();activeTab='calendar';app.querySelector('#chat-view')?.remove();app.querySelector('#map-scroll').hidden=true;app.querySelector('#recenter').hidden=true;let view=app.querySelector('#calendar-view');if(!view){view=document.createElement('main');view.id='calendar-view';view.className='calendar-view';view.setAttribute('aria-label','Kalendarz rodzica');app.querySelector('.bottom-nav').before(view);}view.style.top=app.querySelector('#map-scroll').style.top;view.style.bottom=app.querySelector('#map-scroll').style.bottom;view.innerHTML=planner.calendarHtml();planner.bindCalendar(view);updateNav();}
function showChat(){app.querySelector('#calculator-view')?.remove();app.querySelector('#doctor-view')?.remove();activeTab='chat';app.querySelector('#calendar-view')?.remove();app.querySelector('#map-scroll').hidden=true;app.querySelector('#recenter').hidden=true;let view=app.querySelector('#chat-view');if(!view){view=document.createElement('main');view.id='chat-view';view.className='chat-view';view.setAttribute('aria-label','Czat z Doktorem Bielikiem');app.querySelector('.bottom-nav').before(view);}bielikChat.mount(view);updateNav();}
window.visualViewport?.addEventListener('resize',()=>{if(activeTab==='chat'&&profile){app.style.height=`${Math.round(window.visualViewport.height)}px`;updateJourneyLayout();}});
function centerCurrent(smooth=false) {
  if(!profile)return;
  if(profile.planning){app.querySelector('#map-scroll').scrollTop=0;return;}
  const scroll=app.querySelector('#map-scroll');if(!scroll)return;
  const map=maps[profile.mode], age=ageAt(profile.anchor);
  const target=age.stage>maxWeeks(profile.mode)?app.querySelector('.map-tail'):app.querySelector(`[data-week="${age.stage}"]`);
  if(!target)return;
  const rect=(target.querySelector('.node-disc')||target).getBoundingClientRect(),container=scroll.getBoundingClientRect();
  scroll.scrollTo({top:scroll.scrollTop+rect.top+rect.height/2-container.top-scroll.clientHeight/2,behavior:smooth&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});
}
function sheetContent(title,body) {
  sheet.innerHTML=`<div class="sheet-body"><div class="sheet-handle" aria-hidden="true"></div><div class="sheet-heading"><h2 id="sheet-title">${title}</h2><button id="close-sheet" class="icon-button" aria-label="Zamknij">${icon('close')}</button></div>${body}</div>`;
  sheet.querySelector('#close-sheet').addEventListener('click',()=>sheet.close());
  if(!sheet.open)sheet.showModal();
  sheet.scrollTop=0;
}
function openStage(week,beyond=false) {
  const age=ageAt(profile.anchor),current=!profile.planning&&week===age.stage,completed=!profile.planning&&week<age.stage;
  const label=profile.planning?'Podgląd etapu':current?'Twój obecny etap':completed?'Ten tydzień jest już za Wami':'Ten etap jeszcze przed Wami';
  sheetContent('Tydzień po tygodniu',`<section class="stage-detail ${!current&&!completed?'future':''}"><div class="stage-identity">${avatar(profile.gender)}<div class="week-medallion" aria-hidden="true">${week}</div></div><span class="status-pill">${label}</span><h3>${profile.name?`${escape(profile.name)} – `:''}${ordinal(week,'weeks')} ${stageName(profile.planning?previewMode:profile.mode)}</h3><p>Każdy etap obejmuje jeden tydzień.</p>${beyond?'<p>Obecny wiek jest już poza zakresem tej mapy.</p>':''}${planner.stageHtml(profile.planning?previewMode:profile.mode,week)}<button class="primary" id="return-map">Wróć na moją drogę ${icon('arrow')}</button></section>`);
  sheet.querySelector('#return-map').addEventListener('click',()=>sheet.close());
  planner.bind(sheet);
}
function openProfile() {
  const age=ageAt(profile.anchor),mode=profile.mode;
  const dateFormat=value=>new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));
  if(profile.planning){openPlanningProfile();return;}
  sheetContent('Mój profil',`<section class="parent-profile"><span class="eyebrow">Profil rodzica</span><h3>${parentRoleLabel(profile.parentRole)}</h3></section><h3>Dziecko</h3><div class="profile-hero">${avatar(profile.gender)}<div><h3>${escape(profile.name)||'Twoje dziecko'}</h3><p>${genderLabel(profile.gender)} · ${modeName(mode)}</p></div></div><div class="profile-age"><span>${mode==='pregnancy'?'Obecny wiek ciąży':'Wiek dziecka'}</span><strong>${completedWeeksText(age,profile.mode)}</strong></div><div class="usage-stats"><div><strong>${completedStages(profile)}</strong><span>${pluralWord(completedStages(profile),'Zaliczony etap','Zaliczone etapy','Zaliczonych etapów')}</span></div><div><strong>${usageDays(profile)}</strong><span>${pluralWord(usageDays(profile),'Dzień','Dni','Dni')} z aplikacją</span></div></div><dl class="profile-facts"><div><dt>Pierwsze uruchomienie</dt><dd>${profile.firstUsedAt?dateFormat(profile.firstUsedAt):'Brak daty'}</dd></div><div><dt>${mode==='pregnancy'?'Początek ciąży (0 tygodni)':'Data urodzenia'}</dt><dd>${dateFormat(profile.anchor)}</dd></div></dl><p class="field-help">${mode==='pregnancy'?'Każdy ukończony tydzień ciąży to jeden zaliczony etap.':`42 etapy ciąży + ${quantity(Math.min(age.weeks,52),'stages')} życia dziecka. Każdy zaliczony etap to ukończony tydzień.`}</p><button id="profile-settings" class="settings-row">${icon('settings')}<span>Ustawienia i korekta danych<small>Imię, płeć, wiek i daty</small></span>${icon('arrow')}</button>${warning()}`);
  sheet.querySelector('#profile-settings').addEventListener('click',openSettings);
}
function parentRoleFields(){return '<label class="field-label" for="parent-role">Profil rodzica</label><select id="parent-role" name="parentRole">'+['mother','father','unspecified'].map(role=>'<option value="'+role+'" '+(profile.parentRole===role?'selected':'')+'>'+parentRoleLabel(role)+'</option>').join('')+'</select>';}
function openPlanningProfile(){sheetContent('Mój profil','<span class="eyebrow">Profil rodzica</span><h3>'+parentRoleLabel(profile.parentRole)+'</h3><p>Planujecie dziecko. Wiek i datę porodu uzupełnicie, gdy będą znane.</p><form id="planning-profile">'+parentRoleFields()+'<button class="primary" type="submit">Zapisz profil</button></form><button id="planning-change" class="secondary">Zmień etap rodzicielstwa</button>');sheet.querySelector('form').addEventListener('submit',e=>{e.preventDefault();persist({parentRole:sheet.querySelector('select').value});sheet.close();renderJourney(false);});sheet.querySelector('#planning-change').addEventListener('click',()=>{sheet.close();onboarding.role=profile.parentRole;onboarding.stage=null;onboarding.gender=null;showWelcome();});}
function showDoctor(){app.querySelector('#calculator-view')?.remove();activeTab='doctor';app.querySelector('#calendar-view')?.remove();app.querySelector('#chat-view')?.remove();app.querySelector('#doctor-view')?.remove();app.querySelector('#map-scroll').hidden=true;app.querySelector('#recenter').hidden=true;const view=document.createElement('main');view.id='doctor-view';view.className='doctor-view';view.innerHTML='<span class="eyebrow">Lekarz</span><h1>Znajdźcie właściwą pomoc</h1><div class="doctor-options"><article><h2>Lekarz rodzinny</h2><p>W swojej przychodni możecie omówić ogólne pytania o zdrowie i ustalić dalszą opiekę. Dla dziecka wybierzcie pediatrę lub lekarza POZ.</p></article>'+(profile.mode==='pregnancy'&&!profile.planning?'<article><h2>Lekarz prowadzący ciążę</h2><p>Jeśli macie już lekarza prowadzącego, skontaktujcie się z jego gabinetem w sprawie kontroli, badań i pytań dotyczących ciąży. Jeśli jeszcze go nie wybraliście, umówcie pierwszą konsultację.</p></article>':'')+'<article><h2>ZnanyLekarz</h2><p>Platforma pozwala wyszukać specjalistę i dostępne terminy wizyt w gabinecie lub konsultacji online. Rodzaj konsultacji, cenę i dostępność sprawdzicie u wybranego lekarza.</p><a class="primary" href="https://www.znanylekarz.pl/" target="_blank" rel="noopener noreferrer">Przejdź do ZnanyLekarz</a></article></div>';app.querySelector('.bottom-nav').before(view);updateNav();}
function identityFields() {
  return `<label class="field-label" for="child-name">Imię dziecka <span class="optional">(opcjonalnie)</span></label><input type="text" name="childName" id="child-name" maxlength="200" autocomplete="off" autocapitalize="words" value="${escape(profile.name)}" placeholder="Np. Rafał lub Anna Maria Kowalska" aria-describedby="name-help name-feedback"><p id="name-help" class="field-help">Możesz wpisać także drugie imię i nazwisko, do 200 znaków. Dozwolone są litery, spacje, łączniki i apostrofy.</p><p id="name-feedback" class="name-feedback" role="status" aria-live="polite"></p><fieldset class="gender-fieldset"><legend class="field-label">Płeć dziecka</legend><div class="gender-choices">${['boy','girl','unspecified'].map(g=>`<label class="gender-choice"><input type="radio" name="gender" value="${g}" ${profile.gender===g?'checked':''}>${avatar(g)}<span>${genderLabel(g)}</span></label>`).join('')}</div></fieldset>`;
}
function openSettings() {
  if(profile.planning){openPlanningProfile();return;}
  sheetContent('Ustawienia',`<button id="settings-back" class="text-button settings-back">${icon('back')} Mój profil</button><form id="identity-form" novalidate>${parentRoleFields()}${identityFields()}<p class="error" id="form-error" role="alert"></p><button type="submit" class="primary">Zapisz dane dziecka ${icon('check')}</button></form><hr class="divider"><h3 class="settings-section-title">Korekta wcześniejszych danych</h3><p class="field-help">Wiek aktualizuje się sam. Zmień te ustawienia tylko wtedy, gdy wcześniej podano błędne dane lub dziecko przyszło na świat.</p><button id="correct-age" class="settings-row">${icon('calendar')}<span>Popraw wiek lub datę<small>${completedWeeksText(ageAt(profile.anchor),profile.mode)}</small></span>${icon('arrow')}</button><details class="stage-correction"><summary>Etap rodzicielstwa</summary><p>Obecny etap: <strong>${modeName(profile.mode)}</strong>.</p>${profile.mode==='pregnancy'?'<button class="text-button" id="birth-settings">Dziecko już się urodziło</button>':'<button class="text-button" id="change-pregnancy">Popraw wcześniejszy wybór etapu</button>'}</details>${warning()}<p class="local-note">Zmiana wieku lub etapu zachowuje imię, płeć i statystyki.</p>`);
  sheet.querySelector('#settings-back').addEventListener('click',openProfile);
  const form=sheet.querySelector('#identity-form'),name=form.elements.childName;
  name.addEventListener('beforeinput',event=>{if(event.isComposing||!event.data||event.inputType!=='insertText'||[...event.data].length!==1)return;if(cleanName(event.data)!==event.data){event.preventDefault();sheet.querySelector('#name-feedback').textContent='Cyfry i symbole są zablokowane. Użyj liter, spacji, łącznika lub apostrofu.';}});
  name.addEventListener('input',event=>{if(event.isComposing)return;const value=name.value,clean=cleanName(value);if(value!==clean){const pos=name.selectionStart;name.value=clean;name.setSelectionRange(cleanName(value.slice(0,pos)).length,cleanName(value.slice(0,pos)).length);sheet.querySelector('#name-feedback').textContent='Pominięto niedozwolone znaki.';}else sheet.querySelector('#name-feedback').textContent='';});
  name.addEventListener('compositionend',()=>name.dispatchEvent(new Event('input')));
  form.addEventListener('submit',event=>{event.preventDefault();try{const saved=persist({name:validateName(name.value),gender:form.elements.gender.value,parentRole:form.elements.parentRole.value});const position=app.querySelector('#map-scroll').scrollTop;sheet.close();renderJourney(false);app.querySelector('#map-scroll').scrollTop=position;notify(saved?'Zapisano dane dziecka.':'Dane ustawiono. Zapisywanie jest niedostępne.');}catch(e){setError(e.message);}});
  sheet.querySelector('#correct-age').addEventListener('click',openAgeCorrection);
  const datesButton=document.createElement('button');datesButton.id='settings-calendar-dates';datesButton.className='settings-row';datesButton.innerHTML=`${icon('calendar')}<span>Daty i terminy kalendarza<small>Poród, karta urodzenia, PESEL i urlop</small></span>${icon('arrow')}`;sheet.querySelector('#correct-age').after(datesButton);datesButton.addEventListener('click',planner.openDates);
  sheet.querySelector('#birth-settings')?.addEventListener('click',openBirth);
  sheet.querySelector('#change-pregnancy')?.addEventListener('click',openPregnancyChange);
}
function openAgeCorrection() {
  const age=ageAt(profile.anchor),mode=profile.mode;
  sheetContent('Popraw wiek lub datę',`<p>Korekta jednorazowa. Później wiek będzie nadal aktualizował się automatycznie.</p><form id="profile-form" novalidate>${fields(mode,age.days,'days')}<div class="date-field"><label class="field-label" for="anchor-date">${mode==='pregnancy'?'Data początku ciąży (0 tygodni)':'Data urodzenia dziecka'}</label><input type="date" name="anchor" id="anchor-date" value="${escape(profile.anchor)}" max="${todayString()}" required><p class="field-help">Zmiana wieku przelicza datę, a zmiana daty przelicza wiek.</p></div><p class="error" id="form-error" role="alert"></p><button type="submit" class="primary">Zapisz korektę ${icon('check')}</button></form><button id="correction-back" class="text-button">Wróć do ustawień</button>`);
  const form=sheet.querySelector('form');
  let draftAnchor=profile.anchor;
  const fromAge=()=>{syncUnitLabels(form,mode);try{draftAnchor=anchorFromAge(form.elements.age.value,form.elements.unit.value);form.elements.anchor.value=draftAnchor;const a=validateProfile({mode,anchor:draftAnchor});renderConversion(a,mode);setError('');}catch(e){draftAnchor=null;setError(e.message);renderConversion(null,mode);}};
  form.elements.age.addEventListener('input',fromAge);form.elements.unit.addEventListener('change',fromAge);
  form.elements.anchor.addEventListener('input',()=>{try{draftAnchor=form.elements.anchor.value;const a=validateProfile({mode,anchor:draftAnchor});form.elements.unit.value='days';form.elements.age.value=a.days;syncUnitLabels(form,mode);renderConversion(a,mode);setError('');}catch(e){draftAnchor=null;setError(e.message);renderConversion(null,mode);}});
  renderConversion(age,mode);
  form.addEventListener('submit',event=>{event.preventDefault();try{if(!draftAnchor)throw new Error('Popraw wiek lub datę przed zapisaniem.');const p={mode,anchor:draftAnchor};validateProfile(p);const saved=persist(p);sheet.close();renderJourney();notify(saved?'Zapisano. Twoja droga jest aktualna.':'Ustawiono wiek. Przeglądarka nie pozwala zapisać danych.');}catch(e){setError(e.message);}});
  sheet.querySelector('#correction-back').addEventListener('click',openSettings);
}
function openBirth() {
  sheetContent('Witaj na świecie! ♥',`<p>Nowy rozdział, nowa droga. Podaj datę urodzenia dziecka, aby ustawić jego wiek i otworzyć mapę pierwszego roku.</p><form id="birth-form" novalidate><label class="field-label" for="birth-date">Data urodzenia dziecka</label><input id="birth-date" name="birth" type="date" value="${todayString()}" max="${todayString()}" required><p class="error" id="form-error" role="alert"></p><button class="primary" type="submit">Przejdź na drogę dziecka ${icon('arrow')}</button></form><p class="local-note">Mapa ciąży zostanie zastąpiona mapą dziecka.</p>`);
  sheet.querySelector('form').addEventListener('submit',event=>{event.preventDefault();try{const p={planning:false,mode:'child',anchor:event.currentTarget.elements.birth.value};validateProfile(p);const saved=persist(p);sheet.close();renderJourney();notify(saved?'Zaczynamy nową drogę razem ♥':'Otwarto drogę dziecka. Zapisywanie jest niedostępne.');}catch(e){setError(e.message);}});
}
function openPregnancyChange() {
  sheetContent('Ustaw drogę ciąży',`<p>Wybierz datę odpowiadającą początkowi ciąży (0 tygodni). Na jej podstawie ustawimy obecny tydzień.</p><form novalidate><label class="field-label" for="pregnancy-date">Początek ciąży</label><input id="pregnancy-date" name="anchor" type="date" value="${anchorFromAge(12,'weeks')}" max="${todayString()}" required><p class="error" id="form-error" role="alert"></p><button class="primary" type="submit">Otwórz drogę ciąży ${icon('arrow')}</button></form>`);
  sheet.querySelector('form').addEventListener('submit',event=>{event.preventDefault();try{const p={planning:false,mode:'pregnancy',anchor:event.currentTarget.elements.anchor.value};validateProfile(p);const saved=persist(p);sheet.close();renderJourney();notify(saved?'Ustawiono drogę ciąży.':'Ustawiono drogę ciąży. Zapisywanie jest niedostępne.');}catch(e){setError(e.message);}});
}
sheet.addEventListener('click',event=>{if(event.target===sheet){const r=sheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();}});
function refreshDay(){const now=todayString();if(now!==lastToday&&!sheet.open){lastToday=now;if(profile)renderJourney();}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDay();});
window.addEventListener('focus',refreshDay);setInterval(refreshDay,30000);
sheet.addEventListener('close',()=>{if(profile)refreshDay();});
window.addEventListener('storage',event=>{if(event.key===CALCULATOR_STORAGE_KEY&&profile)renderJourney(false);});
window.addEventListener('storage',event=>{if(event.key===NOTES_KEY&&profile&&activeTab==='calendar')renderJourney(false);});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY&&event.newValue){try{profile=normalizeProfile(JSON.parse(event.newValue));sheet.close();renderJourney();notify('Ustawienia zaktualizowano w innej karcie.');}catch{}}});

try {
  const response=await fetch('assets/map-points.json');if(!response.ok)throw new Error('map');maps=await response.json();
  await planner.load();
  profile?renderJourney():showWelcome();
} catch {
  app.innerHTML='<main class="welcome"><h1>Nie udało się wczytać drogi</h1><p>Sprawdź połączenie i odśwież aplikację.</p><button id="retry" class="primary">Spróbuj ponownie</button></main>';
  app.querySelector('#retry').addEventListener('click',()=>location.reload());
}
