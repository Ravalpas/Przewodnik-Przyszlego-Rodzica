import {renderBielikChat} from './chat-view.js';
import {personalProfileAnswer,chatSuggestions} from './chat-personal.js';
import {assessChatRequest} from './chat-policy.js';
import {localNotesAnswer,chatNotesContext,chatRequestBody} from './chat-notes.js';
import {CHAT_MESSAGE_LIMIT,newConversation,readChatArchive,saveChatConversation,selectChatConversation,deleteChatConversation} from './chat-storage.js';
import {calculatorChatAnswer} from './calculator-storage.js';
export {doctorPortrait,chatIcon} from './chat-view.js';

// The profile payload contains dates and task status; selected calendar notes
// travel separately. Local answers are omitted from subsequent AI history.
export function chatProfileForRequest(profile) {
  const dates=Object.fromEntries(['birthCardDate','peselDate','parentalLeaveDate'].filter(key=>profile.dates?.[key]).map(key=>[key,profile.dates[key]]));
  return {parentRole:profile.parentRole,planning:profile.planning===true,mode:profile.mode,anchor:profile.anchor,dueDate:profile.dueDate,pregnancyStart:profile.pregnancyStart,dates,completedTasks:profile.completedTasks||[],notApplicableTasks:profile.notApplicableTasks||[]};
}

export function createBielikChat({getProfile,openTask,openNote=()=>{},openCalculator=()=>{},getCalculator=()=>({available:true,cases:[]}),onBack,getTasks=()=>null,getNotes=()=>({available:false,notes:[]}),getStorage=()=>globalThis.localStorage}) {
  let root=null,current=newConversation(),pending=false,error='',notice='',historyOpen=false,dirty=false,draftSaveTimer;
  let archive={version:1,activeId:null,conversations:[]};
  try {
    archive=readChatArchive(getStorage());
    const active=archive.conversations.find(c=>c.id===archive.activeId);
    if(active)current=structuredClone(active);
  }catch(e){error=e.message;}
  const hasContent=()=>current.messages.length||current.draft.trim();
  function syncArchive(){archive=readChatArchive(getStorage());}
  function saveCurrent({active=true,announce=true}={}) {
    if(pending||!hasContent())return false;
    try {
      current=saveChatConversation(getStorage(),current,{active});dirty=false;syncArchive();
      error='';if(announce)notice='Zapisano rozmowę na tym urządzeniu.';
      return true;
    }catch(e){error=e.message;return false;}
  }
  function persistCurrent() {
    if(dirty&&hasContent())saveCurrent({announce:false});
  }
  const cancelDraftSave=()=>clearTimeout(draftSaveTimer);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!pending){cancelDraftSave();persistCurrent();}});
  window.addEventListener('pagehide',()=>{if(!pending){cancelDraftSave();persistCurrent();}});
  function startNew() {
    if(pending)return;
    cancelDraftSave();
    if(hasContent()&&!saveCurrent({active:false,announce:false})){draw();return;}
    current=newConversation();dirty=false;historyOpen=false;error='';notice='Poprzednia rozmowa została zapisana.';draw();
  }
  function openSaved(id) {
    if(pending)return;
    cancelDraftSave();
    try {
      syncArchive();
      if(id===current.id){historyOpen=false;draw();return;}
      if(hasContent()&&!saveCurrent({announce:false})){draw();return;}
      const saved=readChatArchive(getStorage()).conversations.find(c=>c.id===id);
      if(!saved)throw new Error('Nie znaleziono zapisanej rozmowy.');
      selectChatConversation(getStorage(),id);
      current=structuredClone(saved);dirty=false;syncArchive();historyOpen=false;error='';notice='';draw();
    }catch(e){error=e.message;draw();}
  }
  function draw() {
    if(!root?.isConnected)return;
    root.innerHTML=renderBielikChat({profile:getProfile(),current,pending,error,notice,archive,historyOpen});
    root.querySelectorAll('[data-chat-message]').forEach(node=>{node.querySelector('.chat-answer').textContent=current.messages[Number(node.dataset.chatMessage)].content;});
    root.querySelector('#chat-back').addEventListener('click',onBack);
    root.querySelector('#chat-new').addEventListener('click',startNew);
    const toggleHistory=()=>{
      if(pending)return;
      try{syncArchive();error='';}catch(e){error=e.message;}
      notice='';historyOpen=!historyOpen;draw();
    };
    root.querySelector('#chat-history').addEventListener('click',toggleHistory);
    root.querySelector('#chat-history-back')?.addEventListener('click',()=>{historyOpen=false;draw();});
    root.querySelectorAll('[data-open-chat]').forEach(button=>button.addEventListener('click',()=>openSaved(button.dataset.openChat)));
    root.querySelectorAll('[data-delete-chat]').forEach(button=>button.addEventListener('click',()=>{
      try{
        const id=button.dataset.deleteChat;
        deleteChatConversation(getStorage(),id);syncArchive();
        if(current.id===id){cancelDraftSave();current=newConversation();dirty=false;}
        error='';notice='Usunięto zapisaną rozmowę.';draw();
      }catch(e){error=e.message;draw();}
    }));
    if(historyOpen)return;
    const examples=chatSuggestions(getProfile());
    root.querySelectorAll('[data-chat-example]').forEach(button=>button.addEventListener('click',()=>{current.draft=examples[Number(button.dataset.chatExample)];send();}));
    root.querySelectorAll('[data-chat-task]').forEach(button=>button.addEventListener('click',()=>button.dataset.chatTask==='integrated-calculator'?openCalculator():openTask(button.dataset.chatTask)));
    root.querySelectorAll('[data-chat-note]').forEach(button=>button.addEventListener('click',()=>openNote(button.dataset.chatNote)));
    const input=root.querySelector('#chat-input');
    const sizeInput=()=>{input.style.height='auto';input.style.height=Math.min(110,Math.max(46,input.scrollHeight))+'px';};
    input.addEventListener('input',()=>{
      current.draft=input.value;dirty=true;sizeInput();
      root.querySelector('#chat-new').disabled=pending||!hasContent();
      cancelDraftSave();const id=current.id;draftSaveTimer=setTimeout(()=>{if(!pending&&current.id===id){persistCurrent();const alert=root?.querySelector('.chat-error');if(alert)alert.textContent=error;}},400);
    });
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send();}});
    root.querySelector('#chat-form').addEventListener('submit',event=>{event.preventDefault();send();});sizeInput();
    requestAnimationFrame(()=>{
      if(root?.isConnected){const list=root.querySelector('.chat-messages');if(list)list.scrollTop=current.messages.length?list.scrollHeight:0;}
    });
  }
  async function send() {
    const question=current.draft.trim();if(!question||pending)return;
    if(current.messages.length>CHAT_MESSAGE_LIMIT-2){error='Ta rozmowa osiągnęła limit 100 wiadomości. Rozpocznij nową — dotychczasowa pozostanie w archiwum.';draw();return;}
    error='';notice='';cancelDraftSave();
    const assessment=assessChatRequest(question,{history:current.messages});
    const localOptions={assessment,history:current.messages,tasks:getTasks()};
    const noteSnapshot=getNotes(),noteAnswer=localNotesAnswer(question,noteSnapshot,{history:current.messages});
    const profileAnswer=personalProfileAnswer(question,getProfile(),undefined,localOptions);
    const local=['unrelated','restricted','mixed'].includes(assessment.route)?profileAnswer:calculatorChatAnswer(question,getCalculator())||noteAnswer||profileAnswer;
    if(local) {
      const prefix=noteAnswer&&profileAnswer?profileAnswer.answer+'\n\n':'';
      current.messages.push({role:'user',content:question,local:true},{role:'assistant',kind:'profile',content:prefix+local.answer,sources:local.sources||[],tasks:local.tasks||[],notes:local.notes||[],local:true});
      current.draft='';dirty=true;persistCurrent();draw();return;
    }
    const personalPart=personalProfileAnswer(question,getProfile(),undefined,{...localOptions,includeMixed:true});
    const history=current.messages.filter(m=>!m.local).slice(-8).map(m=>({role:m.role,content:(m.inferenceContent??m.content).slice(0,3000)}));
    current.draft=question;dirty=true;persistCurrent();
    pending=true;current.draft='';current.messages.push({role:'user',content:question});dirty=true;draw();
    try {
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(70000),body:chatRequestBody({message:question,history,profile:chatProfileForRequest(getProfile()),handledProfileFields:personalPart?.fields||[],noteContext:chatNotesContext(question,noteSnapshot,{history:current.messages.slice(0,-1)})})});
      let data;try{data=await response.json();}catch{throw new Error('Nie udało się odczytać odpowiedzi. Spróbuj ponownie.');}
      if(!response.ok)throw new Error(data.error||'Czat jest chwilowo niedostępny. Spróbuj ponownie.');
      if(typeof data.answer!=='string')throw new Error('Nie udało się odczytać odpowiedzi.');
      current.messages.push({role:'assistant',kind:data.kind,content:personalPart?personalPart.answer+'\n\n'+data.answer:data.answer,inferenceContent:personalPart?data.answer:undefined,sources:Array.isArray(data.sources)?data.sources:[],tasks:Array.isArray(data.tasks)?data.tasks:[]});
    }catch(e){
      current.messages.pop();current.draft=question;error=['TimeoutError','AbortError'].includes(e.name)?'Odpowiedź trwa zbyt długo. Spróbuj ponownie.':e.message;
    }finally{
      pending=false;dirty=true;persistCurrent();draw();
    }
  }
  return {mount:node=>{root=node;draw();},refresh:draw};
}
