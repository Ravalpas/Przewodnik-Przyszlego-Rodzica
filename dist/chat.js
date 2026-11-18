import {renderBielikChat} from './chat-view.js';
import {personalProfileAnswer,chatSuggestions} from './chat-personal.js';
import {CHAT_MESSAGE_LIMIT,newConversation,readChatArchive,saveChatConversation,selectChatConversation,deleteChatConversation} from './chat-storage.js';
export {doctorPortrait,chatIcon} from './chat-view.js';

// Only dates and task status are sent to inference. Personal profile answers
// are handled locally and their message pairs are omitted from AI history.
export function chatProfileForRequest(profile) {
  const dates=Object.fromEntries(['birthCardDate','peselDate','parentalLeaveDate'].filter(key=>profile.dates?.[key]).map(key=>[key,profile.dates[key]]));
  return {mode:profile.mode,anchor:profile.anchor,dueDate:profile.dueDate,pregnancyStart:profile.pregnancyStart,dates,completedTasks:profile.completedTasks||[],notApplicableTasks:profile.notApplicableTasks||[]};
}

export function createBielikChat({getProfile,openTask,onBack,getStorage=()=>globalThis.localStorage}) {
  let root=null,current=newConversation(),pending=false,error='',notice='',historyOpen=false;
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
      current=saveChatConversation(getStorage(),current,{active});syncArchive();
      error='';if(announce)notice='Zapisano rozmowę na tym urządzeniu.';
      return true;
    }catch(e){error=e.message;return false;}
  }
  function persistIfSaved() {
    if(archive.conversations.some(c=>c.id===current.id))saveCurrent({announce:false});
  }
  function startNew() {
    if(pending)return;
    if(hasContent()&&!saveCurrent({active:false,announce:false})){draw();return;}
    current=newConversation();historyOpen=false;error='';notice='Poprzednia rozmowa została zapisana.';draw();
  }
  function openSaved(id) {
    if(pending)return;
    try {
      syncArchive();
      if(id===current.id){historyOpen=false;draw();return;}
      if(hasContent()&&!saveCurrent({announce:false})){draw();return;}
      const saved=readChatArchive(getStorage()).conversations.find(c=>c.id===id);
      if(!saved)throw new Error('Nie znaleziono zapisanej rozmowy.');
      selectChatConversation(getStorage(),id);
      current=structuredClone(saved);syncArchive();historyOpen=false;error='';notice='';draw();
    }catch(e){error=e.message;draw();}
  }
  function draw() {
    if(!root?.isConnected)return;
    root.innerHTML=renderBielikChat({profile:getProfile(),current,pending,error,notice,archive,historyOpen});
    root.querySelectorAll('[data-chat-message]').forEach(node=>{node.querySelector('.chat-answer').textContent=current.messages[Number(node.dataset.chatMessage)].content;});
    root.querySelector('#chat-back').addEventListener('click',onBack);
    root.querySelector('#chat-new').addEventListener('click',startNew);
    root.querySelector('#chat-save').addEventListener('click',()=>{saveCurrent();draw();});
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
        if(current.id===id)current=newConversation();
        error='';notice='Usunięto zapisaną rozmowę.';draw();
      }catch(e){error=e.message;draw();}
    }));
    if(historyOpen)return;
    const examples=chatSuggestions(getProfile());
    root.querySelectorAll('[data-chat-example]').forEach(button=>button.addEventListener('click',()=>{current.draft=examples[Number(button.dataset.chatExample)];send();}));
    root.querySelectorAll('[data-chat-task]').forEach(button=>button.addEventListener('click',()=>openTask(button.dataset.chatTask)));
    const input=root.querySelector('#chat-input');
    const sizeInput=()=>{input.style.height='auto';input.style.height=Math.min(110,Math.max(46,input.scrollHeight))+'px';};
    input.addEventListener('input',()=>{
      current.draft=input.value;sizeInput();
      for(const id of ['chat-save','chat-new'])root.querySelector('#'+id).disabled=pending||!hasContent();
    });
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send();}});
    root.querySelector('#chat-form').addEventListener('submit',event=>{event.preventDefault();send();});sizeInput();
    requestAnimationFrame(()=>{
      if(root?.isConnected){const list=root.querySelector('.chat-messages');if(list)list.scrollTop=current.messages.length?list.scrollHeight:0;}
    });
  }
  async function send() {
    const question=current.draft.trim();if(!question||pending)return;
    if(current.messages.length>CHAT_MESSAGE_LIMIT-2){error='Ta rozmowa osiągnęła limit 100 wiadomości. Zapisz ją i rozpocznij nową rozmowę.';draw();return;}
    error='';notice='';
    const local=personalProfileAnswer(question,getProfile());
    if(local) {
      current.messages.push({role:'user',content:question,local:true},{role:'assistant',content:local.answer,sources:[],tasks:[],local:true});
      current.draft='';persistIfSaved();draw();return;
    }
    const history=current.messages.filter(m=>!m.local).slice(-8).map(m=>({role:m.role,content:m.content.slice(0,3000)}));
    pending=true;current.draft='';current.messages.push({role:'user',content:question});draw();
    let completed=false;
    try {
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(70000),body:JSON.stringify({message:question,history,profile:chatProfileForRequest(getProfile())})});
      let data;try{data=await response.json();}catch{throw new Error('Nie udało się odczytać odpowiedzi. Spróbuj ponownie.');}
      if(!response.ok)throw new Error(data.error||'Czat jest chwilowo niedostępny. Spróbuj ponownie.');
      if(typeof data.answer!=='string')throw new Error('Nie udało się odczytać odpowiedzi.');
      current.messages.push({role:'assistant',content:data.answer,sources:Array.isArray(data.sources)?data.sources:[],tasks:Array.isArray(data.tasks)?data.tasks:[]});completed=true;
    }catch(e){
      current.messages.pop();current.draft=question;error=['TimeoutError','AbortError'].includes(e.name)?'Odpowiedź trwa zbyt długo. Spróbuj ponownie.':e.message;
    }finally{
      pending=false;if(completed)persistIfSaved();draw();
    }
  }
  return {mount:node=>{root=node;draw();},refresh:draw};
}
