import { STORAGE_KEY, todayString, anchorFromAge, ageAt, ageText, validateProfile, dayNumber } from './age.js';

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
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="white"/><circle cx="15" cy="17" r="3" fill="white"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.target}</svg>`;
const brand = () => '<div class="brand"><img src="assets/logo.png" alt="Logo aplikacji"><div><b>Przewodnik<br>Przyszłej Mamy</b><small>Blisko Ciebie. Krok po kroku.</small></div></div>';
const stageName = mode => mode==='pregnancy'?'ciąży':'życia';
const modeName = mode => mode==='pregnancy'?'Droga ciąży':'Pierwszy rok razem';
const maxWeeks = mode => mode==='pregnancy'?42:52;
const escape = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile = null, selectedMode = 'pregnancy', maps, resizeObserver, lastToday = todayString(), toastTimer, storageAvailable = true;
try { const raw = localStorage.getItem(STORAGE_KEY); if(raw){ const p=JSON.parse(raw); if(['pregnancy','child'].includes(p.mode)){ageAt(p.anchor);profile=p;} } } catch { storageAvailable=false; }

function notify(message) {
  const el=document.querySelector('#toast'); el.textContent=message;el.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3300);
}
function persist(p) {
  profile={mode:p.mode,anchor:p.anchor};
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(profile));storageAvailable=true;return true; }
  catch {storageAvailable=false;return false;}
}
function warning(){return storageAvailable?'':'<p class="storage-warning">Przeglądarka nie pozwala zapisać danych. Twoja droga działa w tej sesji, ale po zamknięciu może być konieczne ponowne ustawienie wieku.</p>';}
function unitOptions(mode, unit='weeks') {
  return [['days',`dni ${stageName(mode)}`],['weeks',`pełnych tygodni ${stageName(mode)}`],['months',`pełnych miesięcy ${stageName(mode)}`]].map(([key,label])=>`<option value="${key}" ${unit===key?'selected':''}>${label}</option>`).join('');
}
function fields(mode, value, unit='weeks') {
  return `<label class="field-label" for="age-value">Ile czasu już minęło?</label><div class="age-fields"><input id="age-value" name="age" type="number" min="0" max="36525" step="1" inputmode="numeric" value="${value}" required aria-describedby="age-help" aria-label="Liczba dni, tygodni lub miesięcy"><select id="age-unit" name="unit" aria-label="Jednostka wieku">${unitOptions(mode,unit)}</select></div><p id="age-help" class="field-help">Wpisz ukończony czas. 0–6 dni to 1. tydzień, a 7–13 dni to 2. tydzień. Miesiące przeliczamy według kalendarza.</p><div class="conversion" aria-live="polite">${icon('calendar')}<div><strong id="converted-age"></strong><small id="converted-stage"></small></div></div>`;
}

function showWelcome() {
  resizeObserver?.disconnect();
  app.innerHTML=`<main class="welcome">${brand()}<div class="welcome-art" aria-hidden="true"><img src="assets/logo.png" alt=""><span class="spark">✦</span><span class="heart">♥</span></div><div class="eyebrow">Witaj na swojej drodze</div><h1 style="margin-top:10px">Wielka przygoda.<br>Małe kroki.</h1><p class="intro">Jesteśmy obok, tydzień po tygodniu.<br>Na jakim etapie jesteś teraz?</p><div class="stage-choices"><button class="stage-choice ${selectedMode==='pregnancy'?'selected':''}" data-mode="pregnancy" aria-pressed="${selectedMode==='pregnancy'}"><span class="choice-symbol" aria-hidden="true">🤰</span><span><strong>Oczekujemy dziecka</strong><small>Moja droga przez ciążę</small></span><span class="radio" aria-hidden="true"></span></button><button class="stage-choice child-choice ${selectedMode==='child'?'selected':''}" data-mode="child" aria-pressed="${selectedMode==='child'}"><span class="choice-symbol" aria-hidden="true">👶</span><span><strong>Dziecko jest już z nami</strong><small>Pierwszy rok razem</small></span><span class="radio" aria-hidden="true"></span></button></div><button id="continue" class="primary">Zaczynamy ${icon('arrow')}</button>${warning()}<div class="welcome-foot">Twój własny rytm. Twoja własna droga.<br>Ustawienia możesz zmienić w każdej chwili.</div></main>`;
  app.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{selectedMode=button.dataset.mode;showWelcome();}));
  app.querySelector('#continue').addEventListener('click',showAgeSetup);
}
function showAgeSetup() {
  const mode=selectedMode;
  app.innerHTML=`<main class="welcome"><div class="back-row"><button id="back" class="icon-button" aria-label="Wróć do wyboru etapu">${icon('back')}</button><span class="eyebrow">Poznajmy się</span><div class="steps" aria-label="Krok 2 z 2"><span class="done"></span><span class="done"></span></div></div><div class="welcome-art" aria-hidden="true"><img src="assets/logo.png" alt=""><span class="spark">✦</span></div><div class="eyebrow">${mode==='pregnancy'?'Oczekujemy dziecka':'Dziecko jest już z nami'}</div><h1 style="margin-top:10px">${mode==='pregnancy'?'Który to już<br>tydzień?':'Ile czasu jesteście<br>już razem?'}</h1><p>Ustaw wiek, a my znajdziemy Twoje miejsce na drodze.</p><form id="setup-form" class="age-form" novalidate>${fields(mode,mode==='pregnancy'?12:0)}<p id="form-error" class="error" role="alert"></p><button type="submit" class="primary">Pokaż moją drogę ${icon('arrow')}</button></form>${warning()}<div class="welcome-foot">Wiek będzie aktualizował się z każdym dniem.<br>W każdej chwili możesz go poprawić w profilu.</div></main>`;
  app.querySelector('#back').addEventListener('click',showWelcome);
  const form=app.querySelector('form');
  const getAnchor=()=>anchorFromAge(form.elements.age.value,form.elements.unit.value);
  const update=()=>{ try{const anchor=getAnchor();const age=validateProfile({mode,anchor});renderConversion(age,mode);setError('');}catch(e){setError(e.message);renderConversion(null,mode);} };
  form.addEventListener('input',update);form.addEventListener('change',update);update();
  form.addEventListener('submit',event=>{event.preventDefault();try{const p={mode,anchor:getAnchor()};validateProfile(p);const saved=persist(p);renderJourney();if(!saved)notify('Ustawiono wiek. Zapisywanie w przeglądarce jest niedostępne.');}catch(e){setError(e.message);}});
}
function setError(message){const el=document.querySelector('#form-error');if(el)el.textContent=message;}
function renderConversion(age,mode){document.querySelector('#converted-age').textContent=age?ageText(age):'Sprawdź wpisany wiek';document.querySelector('#converted-stage').textContent=age?`${age.stage}. tydzień ${stageName(mode)}${age.stage>maxWeeks(mode)?' · poza zakresem mapy':''}`:'Wiek podaj w pełnych dniach, tygodniach lub miesiącach.';}

function nodeSvg(point,index,age) {
  const week=index+1, completed=week<age.stage, current=week===age.stage;
  const status=completed?'completed':current?'current':'future';
  const color=completed?'#60d509':current?'#60d509':'#d4d9e2';
  // Cover the original illustration's check badge separately, preserving the exact route and artwork.
  return `<g class="map-node ${status}" data-week="${week}" role="button" tabindex="0" aria-label="${week}. tydzień ${stageName(profile.mode)}, ${completed?'miniony':current?'obecny':'przyszły'}" ${current?'aria-current="step"':''} transform="translate(${point.x} ${point.y})"><title>${week}. tydzień</title><circle cx="51" cy="60" r="32" fill="white"/><circle r="77" fill="white"/>${current?'<circle r="90" fill="none" stroke="#304a91" stroke-width="9"/>':''}<circle class="node-disc" r="67" fill="${color}"/><path d="M-48-24a54 54 0 0 1 57-29" fill="none" stroke="${completed||current?'#9ee456':'#e9edf2'}" stroke-width="9" stroke-linecap="round"/><text text-anchor="middle" dominant-baseline="central" y="2" fill="${completed||current?'white':'#8f99ab'}" font-size="72" font-weight="800" font-family="Trebuchet MS, sans-serif">${week}</text>${completed?'<circle cx="51" cy="60" r="27" fill="white"/><circle cx="51" cy="60" r="22" fill="#60d509"/><path d="m40 60 8 8 15-18" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>':''}${current?'<g aria-hidden="true"><rect x="-116" y="-158" width="232" height="49" rx="16" fill="#304a91"/><path d="m-12-110 12 13 12-13" fill="#304a91"/><text y="-126" fill="white" font-family="Trebuchet MS, sans-serif" font-size="25" font-weight="800" text-anchor="middle">JESTEŚ TUTAJ</text></g>':''}</g>`;
}
function renderJourney(center=true) {
  resizeObserver?.disconnect();
  const age=ageAt(profile.anchor),mode=profile.mode, map=maps[mode], total=maxWeeks(mode),beyond=age.stage>total;
  app.innerHTML=`<header class="app-header"><div class="top-row">${brand()}<button id="edit-top" class="icon-button" aria-label="Edytuj wiek i datę">${icon('settings')}</button></div><section class="journey-summary" aria-label="Twój obecny etap"><div class="summary-top"><span>${modeName(mode)}</span><small>${Math.min(age.weeks,total)} / ${total} tyg.</small></div><h1>${beyond?'Kolejny rozdział przed Wami':`${age.stage}. tydzień ${stageName(mode)}`}</h1><div class="summary-bottom"><p>${ageText(age)} ${mode==='pregnancy'?'ciąży':'razem'}</p><button class="text-button" id="edit-age">Edytuj wiek</button></div><div class="progress-track" role="progressbar" aria-label="Upływ czasu na mapie" aria-valuenow="${Math.min(age.weeks,total)}" aria-valuemin="0" aria-valuemax="${total}"><div style="width:${Math.min(100,age.weeks/total*100)}%"></div></div></section></header><main class="map-scroll" id="map-scroll" aria-label="${modeName(mode)}"><div class="map-lead"><span class="eyebrow">Każdy tydzień to mały wielki krok</span><p>Dotknij numeru, aby otworzyć etap.</p><div class="legend"><span><i></i>Minione</span><span><i class="now"></i>Teraz</span><span><i class="later"></i>Przed Wami</span></div></div><div class="map-canvas"><img class="map-image" src="assets/${mode==='pregnancy'?'mapa-ciazy.png':'mapa-dziecka.png'}" width="${map.width}" height="${map.height}" alt="Ilustrowana, kręta droga ${mode==='pregnancy'?'ciąży':'pierwszego roku życia'}"><svg class="map-overlay" viewBox="0 0 ${map.width} ${map.height}" aria-label="Tygodnie ${stageName(mode)}">${map.points.map((p,i)=>nodeSvg(p,i,age)).join('')}</svg></div><section class="map-tail"><strong>${mode==='pregnancy'?'Nowy rozdział zaczyna się tutaj ♥':'Rok pełen małych wielkich chwil ♥'}</strong><p>${mode==='pregnancy'?'Gdy dziecko będzie już z Wami, ustaw datę urodzenia i przejdź na jego własną drogę.':'Ta mapa obejmuje pierwsze 52 tygodnie życia. Wiek dziecka aktualizuje się również później.'}</p>${mode==='pregnancy'?'<button id="birth-tail" class="secondary">Dziecko jest już z nami</button>':''}</section></main><button id="recenter" class="recenter">${icon('target')}Mój tydzień</button><nav class="bottom-nav" aria-label="Nawigacja główna"><button class="nav-item active" id="nav-map" aria-current="page"><span class="nav-icon">${icon('route')}</span>Moja droga</button><button class="nav-item" id="nav-today"><span class="nav-icon">${icon('target')}</span>Na dziś</button><button class="nav-item" id="nav-profile"><span class="nav-icon">${icon('user')}</span>Mój profil</button></nav>`;
  app.querySelectorAll('#edit-top,#edit-age,#nav-profile').forEach(b=>b.addEventListener('click',openProfile));
  app.querySelector('#nav-map').addEventListener('click',()=>centerCurrent(true));
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
    const first=map.points[0].y*scroll.clientWidth/map.width;
    app.querySelector('.map-lead').style.paddingTop=`${Math.max(24,scroll.clientHeight/2-first-54)}px`;
  };
  layout();
  resizeObserver=new ResizeObserver(()=>{layout();});resizeObserver.observe(app);
  if(center)requestAnimationFrame(()=>centerCurrent());
}
function centerCurrent(smooth=false) {
  if(!profile)return;
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
  const age=ageAt(profile.anchor),current=week===age.stage,completed=week<age.stage;
  const label=current?'Twój obecny etap':completed?'Ten tydzień jest już za Wami':'Ten etap jeszcze przed Wami';
  const start=(week-1)*7,end=week*7-1;
  sheetContent('Tydzień po tygodniu',`<section class="stage-detail ${!current&&!completed?'future':''}"><div class="week-medallion" aria-hidden="true">${week}</div><span class="status-pill">${label}</span><h3>${week}. tydzień ${stageName(profile.mode)}</h3><p>${start}–${end} dni ${stageName(profile.mode)} · każdy etap to 7 dni.</p>${beyond?'<p>Obecny wiek jest już poza zakresem tej mapy.</p>':''}<div class="placeholder-card"><strong>Tu pojawi się przewodnik na ten tydzień</strong><p>Treści etapów przygotujemy w kolejnej wersji aplikacji.</p><div class="topic-list"><span>Formalności</span><span>Świadczenia</span><span>Wskazówki</span><span>Na co uważać</span></div></div><button class="primary" id="return-map">Wróć na moją drogę ${icon('arrow')}</button></section>`);
  sheet.querySelector('#return-map').addEventListener('click',()=>sheet.close());
}
function openProfile() {
  const age=ageAt(profile.anchor),mode=profile.mode;
  sheetContent('Mój profil',`<p class="profile-label">${modeName(mode)}</p><div class="profile-value">${ageText(age)}</div><form id="profile-form" novalidate>${fields(mode,age.days,'days')}<div class="date-field"><label class="field-label" for="anchor-date">${mode==='pregnancy'?'Data początku ciąży (0 tygodni)':'Data urodzenia dziecka'}</label><input type="date" name="anchor" id="anchor-date" value="${escape(profile.anchor)}" max="${todayString()}" required><p class="field-help">${mode==='pregnancy'?'To data odniesienia do obliczania wieku ciąży. Wpisz początek zgodny z wiekiem ciąży, którym się posługujesz.':'Wiek dziecka liczymy od daty urodzenia.'} Zmiana wieku przelicza datę, a zmiana daty przelicza wiek.</p></div><p class="error" id="form-error" role="alert"></p><button type="submit" class="primary">Zapisz zmiany ${icon('check')}</button></form><hr class="divider">${mode==='pregnancy'?'<button class="secondary" id="birth-profile">Dziecko jest już z nami</button>':'<button class="secondary" id="change-pregnancy">Zmień etap na ciążę</button>'}${warning()}<p class="local-note">Ustawienia zapisujemy tylko w tej przeglądarce na tym urządzeniu.</p>`);
  const form=sheet.querySelector('form');
  let draftAnchor=profile.anchor;
  const fromAge=()=>{try{draftAnchor=anchorFromAge(form.elements.age.value,form.elements.unit.value);form.elements.anchor.value=draftAnchor;const a=validateProfile({mode,anchor:draftAnchor});renderConversion(a,mode);setError('');}catch(e){draftAnchor=null;setError(e.message);renderConversion(null,mode);}};
  form.elements.age.addEventListener('input',fromAge);form.elements.unit.addEventListener('change',fromAge);
  form.elements.anchor.addEventListener('input',()=>{try{draftAnchor=form.elements.anchor.value;const a=validateProfile({mode,anchor:draftAnchor});form.elements.unit.value='days';form.elements.age.value=a.days;renderConversion(a,mode);setError('');}catch(e){draftAnchor=null;setError(e.message);renderConversion(null,mode);}});
  renderConversion(age,mode);
  form.addEventListener('submit',event=>{event.preventDefault();try{if(!draftAnchor)throw new Error('Popraw wiek lub datę przed zapisaniem.');const p={mode,anchor:draftAnchor};validateProfile(p);const saved=persist(p);sheet.close();renderJourney();notify(saved?'Zapisano. Twoja droga jest aktualna.':'Ustawiono wiek. Przeglądarka nie pozwala zapisać danych.');}catch(e){setError(e.message);}});
  sheet.querySelector('#birth-profile')?.addEventListener('click',openBirth);
  sheet.querySelector('#change-pregnancy')?.addEventListener('click',()=>openPregnancyChange());
}
function openBirth() {
  sheetContent('Witaj na świecie! ♥',`<p>Nowy rozdział, nowa droga. Podaj datę urodzenia dziecka, aby ustawić jego wiek i otworzyć mapę pierwszego roku.</p><form id="birth-form" novalidate><label class="field-label" for="birth-date">Data urodzenia dziecka</label><input id="birth-date" name="birth" type="date" value="${todayString()}" max="${todayString()}" required><p class="error" id="form-error" role="alert"></p><button class="primary" type="submit">Przejdź na drogę dziecka ${icon('arrow')}</button></form><p class="local-note">Mapa ciąży zostanie zastąpiona mapą dziecka.</p>`);
  sheet.querySelector('form').addEventListener('submit',event=>{event.preventDefault();try{const p={mode:'child',anchor:event.currentTarget.elements.birth.value};validateProfile(p);const saved=persist(p);sheet.close();renderJourney();notify(saved?'Zaczynamy nową drogę razem ♥':'Otwarto drogę dziecka. Zapisywanie jest niedostępne.');}catch(e){setError(e.message);}});
}
function openPregnancyChange() {
  sheetContent('Ustaw drogę ciąży',`<p>Wybierz datę odpowiadającą początkowi ciąży (0 tygodni). Na jej podstawie ustawimy obecny tydzień.</p><form novalidate><label class="field-label" for="pregnancy-date">Początek ciąży</label><input id="pregnancy-date" name="anchor" type="date" value="${anchorFromAge(12,'weeks')}" max="${todayString()}" required><p class="error" id="form-error" role="alert"></p><button class="primary" type="submit">Otwórz drogę ciąży ${icon('arrow')}</button></form>`);
  sheet.querySelector('form').addEventListener('submit',event=>{event.preventDefault();try{const p={mode:'pregnancy',anchor:event.currentTarget.elements.anchor.value};validateProfile(p);const saved=persist(p);sheet.close();renderJourney();notify(saved?'Ustawiono drogę ciąży.':'Ustawiono drogę ciąży. Zapisywanie jest niedostępne.');}catch(e){setError(e.message);}});
}
sheet.addEventListener('click',event=>{if(event.target===sheet){const r=sheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();}});
function refreshDay(){const now=todayString();if(now!==lastToday&&!sheet.open){lastToday=now;if(profile)renderJourney();}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDay();});
window.addEventListener('focus',refreshDay);setInterval(refreshDay,30000);
sheet.addEventListener('close',()=>{if(profile)refreshDay();});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY&&event.newValue){try{const next=JSON.parse(event.newValue);if(!['pregnancy','child'].includes(next.mode))return;ageAt(next.anchor);profile=next;sheet.close();renderJourney();notify('Ustawienia zaktualizowano w innej karcie.');}catch{}}});

try {
  const response=await fetch('assets/map-points.json');if(!response.ok)throw new Error('map');maps=await response.json();
  profile?renderJourney():showWelcome();
} catch {
  app.innerHTML='<main class="welcome"><h1>Nie udało się wczytać drogi</h1><p>Sprawdź połączenie i odśwież aplikację.</p><button id="retry" class="primary">Spróbuj ponownie</button></main>';
  app.querySelector('#retry').addEventListener('click',()=>location.reload());
}
