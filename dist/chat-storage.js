export const CHAT_ARCHIVE_KEY='ppm-bielik-conversations-v1';
export const CHAT_MESSAGE_LIMIT=100;
export const CHAT_CONVERSATION_LIMIT=30;
const validDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const shortText=(value,limit)=>typeof value==='string'?value.slice(0,limit):'';
export function newConversation(now=new Date().toISOString()) {
  const id=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return {id,title:'Nowa rozmowa',createdAt:now,updatedAt:now,messages:[],draft:''};
}
function storedConversation(value) {
  if(!value||typeof value.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.id)||!validDate(value.createdAt)||!validDate(value.updatedAt)||!Array.isArray(value.messages)||value.messages.length>CHAT_MESSAGE_LIMIT)throw new Error('Nieprawidłowy zapis rozmowy.');
  const messages=value.messages.map(message=>{
    if(!['user','assistant'].includes(message?.role)||typeof message.content!=='string'||message.content.length>10000)throw new Error('Nieprawidłowy zapis wiadomości.');
    return {role:message.role,content:message.content,local:message.local===true,kind:shortText(message.kind,30),inferenceContent:typeof message.inferenceContent==='string'?message.inferenceContent.slice(0,6500):undefined,
      sources:(Array.isArray(message.sources)?message.sources:[]).slice(0,5).map(s=>({id:shortText(s?.id,60),name:shortText(s?.name,200),url:shortText(s?.url,2000),status:shortText(s?.status,30)})),
      tasks:(Array.isArray(message.tasks)?message.tasks:[]).slice(0,3).map(t=>({id:shortText(t?.id,60),title:shortText(t?.title,200),status:shortText(t?.status,30),period:shortText(t?.period,250)})),
      notes:(Array.isArray(message.notes)?message.notes:[]).slice(0,8).filter(n=>/^[a-zA-Z0-9_-]{1,80}$/.test(n?.id)).map(n=>({id:n.id,title:shortText(n.title,100),date:shortText(n.date,10),time:shortText(n.time,5),color:shortText(n.color,10)}))};
  });
  return {id:value.id,title:shortText(value.title,100)||'Rozmowa',createdAt:value.createdAt,updatedAt:value.updatedAt,messages,draft:shortText(value.draft,3000)};
}
export function readChatArchive(storage) {
  let raw;try{raw=storage.getItem(CHAT_ARCHIVE_KEY);}catch{throw new Error('Zapisywanie rozmów jest niedostępne w tej przeglądarce. Możesz nadal korzystać z czatu.');}
  if(!raw)return {version:1,activeId:null,conversations:[]};
  let data;try{data=JSON.parse(raw);}catch{throw new Error('Nie udało się odczytać zapisanych rozmów. Dotychczasowy zapis pozostaje bez zmian.');}
  if(data?.version!==1||!Array.isArray(data.conversations)||data.conversations.length>CHAT_CONVERSATION_LIMIT)throw new Error('Nieprawidłowe archiwum rozmów. Dotychczasowy zapis pozostaje bez zmian.');
  return {version:1,activeId:typeof data.activeId==='string'?data.activeId:null,conversations:data.conversations.map(storedConversation).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))};
}
function writeChatArchive(storage,archive) {
  try{storage.setItem(CHAT_ARCHIVE_KEY,JSON.stringify(archive));}catch{throw new Error('Nie udało się zapisać rozmowy w tej przeglądarce. Rozmowa pozostaje otwarta; sprawdź dostępne miejsce lub ustawienia zapisu.');}
}
export function saveChatConversation(storage,conversation,{active=true,now=new Date().toISOString()}={}) {
  const archive=readChatArchive(storage),existing=archive.conversations.some(c=>c.id===conversation.id);
  if(!existing&&archive.conversations.length>=CHAT_CONVERSATION_LIMIT)throw new Error('Zapisano już 30 rozmów. Usuń wybraną rozmowę z archiwum, aby zapisać kolejną.');
  const title=(conversation.messages.find(m=>m.role==='user')?.content||conversation.draft||'Rozmowa').replace(/\s+/g,' ').trim().slice(0,100);
  const saved=storedConversation({...conversation,title,updatedAt:now});
  writeChatArchive(storage,{version:1,activeId:active?saved.id:null,conversations:[saved,...archive.conversations.filter(c=>c.id!==saved.id)]});
  return saved;
}
export function selectChatConversation(storage,id) {
  const archive=readChatArchive(storage);
  if(id&&!archive.conversations.some(c=>c.id===id))throw new Error('Nie znaleziono zapisanej rozmowy.');
  writeChatArchive(storage,{...archive,activeId:id||null});
}
export function deleteChatConversation(storage,id) {
  const archive=readChatArchive(storage);
  writeChatArchive(storage,{...archive,activeId:archive.activeId===id?null:archive.activeId,conversations:archive.conversations.filter(c=>c.id!==id)});
}
