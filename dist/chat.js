import {ageAt} from './age.js';
import {ordinal} from './polish.js';

const chatEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const doctorPortrait=()=>'<img src="assets/doktor-bielik.png" alt="" width="80" height="80" class="doctor-portrait">';
export const chatIcon=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 16-5Z"/><path d="M8 10h8m-8 4h5"/></svg>';

// Never send the child's name, gender, full profile, browser storage or other app data.
export function chatProfileForRequest(profile) {
  const dates=Object.fromEntries(['birthCardDate','peselDate','parentalLeaveDate'].filter(key=>profile.dates?.[key]).map(key=>[key,profile.dates[key]]));
  return {mode:profile.mode,anchor:profile.anchor,dueDate:profile.dueDate,pregnancyStart:profile.pregnancyStart,dates,completedTasks:profile.completedTasks||[],notApplicableTasks:profile.notApplicableTasks||[]};
}
function chatSourceUrl(value) {
  try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&['www.gov.pl','gov.pl','pacjent.gov.pl','www.zus.pl','zus.pl','www.nfz.gov.pl','akademia.nfz.gov.pl','www.pip.gov.pl','eli.gov.pl','dziennikmz.mz.gov.pl'].includes(url.hostname))return url.href;}catch{}
  return null;
}

export function createBielikChat({getProfile,openTask,onBack}) {
  let root=null,messages=[],draft='',pending=false,error='';
  const statusLabels={done:'Oznaczone jako wykonane','not-applicable':'Nie dotyczy',waiting:'Przed Wami',pending:'Do zrobienia',overdue:'Okres minął','needs-date':'Uzupełnij datę'};
  const examples=['Co mam teraz załatwić?','Jakie obowiązki jeszcze czekają?','O co zapytać położną?','Jakie świadczenia mogę sprawdzić?'];
  const sourceHtml=source=>{const url=chatSourceUrl(source.url);if(!url)return '';return `<a class="chat-source" href="${chatEscape(url)}" target="_blank" rel="noopener noreferrer"><span>${chatEscape(source.name)}</span><span aria-hidden="true">↗</span></a>${['changed','missing','unavailable'].includes(source.status)?'<p class="chat-source-note">To źródło wymaga ponownego sprawdzenia. Potwierdź aktualne zasady w instytucji.</p>':''}`;};
  function draw() {
    if(!root?.isConnected)return;
    const profile=getProfile(),age=ageAt(profile.anchor),stage=`${ordinal(age.stage,'weeks')} ${profile.mode==='pregnancy'?'ciąży':'życia'}`;
    root.innerHTML=`<header class="chat-header"><button id="chat-back" class="icon-button" aria-label="Wróć na moją drogę">‹</button><div class="chat-header-portrait">${doctorPortrait()}</div><div><h2>Doktor Bielik</h2><p>Asystent AI · informacje, nie diagnoza</p></div><button id="chat-clear" class="icon-button" aria-label="Wyczyść rozmowę" ${pending?'disabled':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7"/></svg></button></header><div class="chat-context"><span class="chat-context-dot"></span>${chatEscape(stage)}<span>Znam oznaczenia Waszych spraw</span></div><div class="chat-messages" role="log" aria-label="Rozmowa z Doktorem Bielikiem"><div class="chat-welcome ${messages.length?'chat-welcome-compact':''}">${doctorPortrait()}<h3>Jestem obok, krok po kroku.</h3><p>Pomogę Ci sprawdzić, co załatwić, gdzie się zgłosić i o czym pamiętać w ciąży oraz w pierwszym roku życia dziecka.</p>${!messages.length?`<div class="chat-suggestions">${examples.map((text,i)=>`<button data-chat-example="${i}">${chatEscape(text)}<span aria-hidden="true">↗</span></button>`).join('')}</div>`:''}</div>${messages.map((message,index)=>`<article class="chat-message chat-message-${message.role}" data-chat-message="${index}"><span class="sr-only">${message.role==='user'?'Ty':'Doktor Bielik'}:</span><div class="chat-answer"></div>${message.sources?.length?`<div class="chat-sources"><h4>Oficjalne źródła odpowiedzi</h4>${message.sources.map(sourceHtml).join('')}</div>`:''}${message.tasks?.length?`<div class="chat-related"><span>Sprawy w aplikacji</span>${message.tasks.map(task=>`<button class="chat-task" data-chat-task="${chatEscape(task.id)}"><span><strong>${chatEscape(task.title)}</strong><small>${chatEscape(statusLabels[task.status]||'Zobacz kartę')}${task.period?` · ${chatEscape(task.period)}`:''}</small></span><span aria-hidden="true">›</span></button>`).join('')}</div>`:''}</article>`).join('')}${pending?`<div class="chat-thinking" role="status">${doctorPortrait()}<span>Sprawdzam Wasze sprawy i oficjalne źródła<span class="chat-dots" aria-hidden="true">…</span></span></div>`:''}</div><div class="chat-bottom"><details class="chat-privacy"><summary>Jak korzystam z kontekstu Waszej drogi?</summary><p>Przy pytaniu przekazujemy Fabryce AI wiek, potrzebne daty i oznaczenia spraw. Imię, nazwisko i płeć z profilu pozostają w przeglądarce. Treść wpisana w czacie jest wysyłana do modelu. Rozmowa pozostaje w pamięci tej karty do odświeżenia strony lub jej wyczyszczenia.</p></details><p class="chat-error" role="alert">${chatEscape(error)}</p><form id="chat-form"><label for="chat-input" class="sr-only">Twoje pytanie do Doktora Bielika</label><textarea id="chat-input" name="message" rows="1" maxlength="3000" placeholder="Zapytaj o Waszą drogę…" ${pending?'disabled':''}>${chatEscape(draft)}</textarea><button id="chat-send" type="submit" aria-label="Wyślij pytanie" ${pending?'disabled':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7m-7-7v15"/></svg></button></form></div>`;
    root.querySelectorAll('[data-chat-message]').forEach(node=>{node.querySelector('.chat-answer').textContent=messages[Number(node.dataset.chatMessage)].content;});
    root.querySelector('#chat-back').addEventListener('click',onBack);
    root.querySelector('#chat-clear').addEventListener('click',()=>{if(pending)return;messages=[];error='';draw();});
    root.querySelectorAll('[data-chat-example]').forEach(button=>button.addEventListener('click',()=>{draft=examples[Number(button.dataset.chatExample)];send();}));
    root.querySelectorAll('[data-chat-task]').forEach(button=>button.addEventListener('click',()=>openTask(button.dataset.chatTask)));
    const input=root.querySelector('#chat-input');
    const sizeInput=()=>{input.style.height='auto';input.style.height=`${Math.min(110,Math.max(46,input.scrollHeight))}px`;};
    input.addEventListener('input',()=>{draft=input.value;sizeInput();});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send();}});
    root.querySelector('#chat-form').addEventListener('submit',event=>{event.preventDefault();send();});sizeInput();
    requestAnimationFrame(()=>{if(root?.isConnected){const list=root.querySelector('.chat-messages');list.scrollTop=list.scrollHeight;}});
  }
  async function send() {
    const question=draft.trim();if(!question||pending)return;
    const history=messages.slice(-8).map(m=>({role:m.role,content:m.content.slice(0,3000)}));
    pending=true;error='';draft='';messages.push({role:'user',content:question});draw();
    try {
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(70000),body:JSON.stringify({message:question,history,profile:chatProfileForRequest(getProfile())})});
      let data;try{data=await response.json();}catch{throw new Error('Nie udało się odczytać odpowiedzi. Spróbuj ponownie.');}
      if(!response.ok)throw new Error(data.error||'Czat jest chwilowo niedostępny. Spróbuj ponownie.');
      if(typeof data.answer!=='string')throw new Error('Nie udało się odczytać odpowiedzi.');
      messages.push({role:'assistant',content:data.answer,sources:Array.isArray(data.sources)?data.sources:[],tasks:Array.isArray(data.tasks)?data.tasks:[]});
      messages=messages.slice(-30);
    } catch(e) {
      messages.pop();draft=question;error=['TimeoutError','AbortError'].includes(e.name)?'Odpowiedź trwa zbyt długo. Spróbuj ponownie.':e.message;
    } finally {pending=false;draw();}
  }
  return {mount:node=>{root=node;draw();},refresh:draw};
}
