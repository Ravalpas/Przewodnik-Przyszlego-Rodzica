import {test} from 'node:test';
import assert from 'node:assert/strict';
import {personalProfileAnswer,childCalendarAge,chatSuggestions} from '../dist/chat-personal.js';
import {CHAT_ARCHIVE_KEY,newConversation,readChatArchive,saveChatConversation,selectChatConversation,deleteChatConversation} from '../dist/chat-storage.js';

const today='2026-11-18',profile={mode:'child',anchor:'2026-11-01',name:'Anna Maria Kowalska'};
function memoryStorage(){const map=new Map();return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};}
function conversation(question='Co mam teraz załatwić?'){
  const value=newConversation('2026-11-18T12:00:00Z');value.messages=[{role:'user',content:question,local:true},{role:'assistant',content:'Znam wiek dziecka.',local:true}];value.draft='Pytanie do dokończenia';return value;
}

test('the reported question about the child name and age is answered from the local profile',()=>{
  const answer=personalProfileAnswer('podaj imię mojego dziecka, oraz ile ma lat?',profile,today);
  assert.equal(answer.kind,'profile');assert.equal(answer.local,true);assert.match(answer.answer,/Anna Maria Kowalska/);assert.match(answer.answer,/2 tygodnie i 3 dni/);assert.match(answer.answer,/3\. tydzień życia/);
  assert.equal(answer.sources.length,0);
  assert.match(personalProfileAnswer('Podaj imię mojego dziecka oraz ile ma lat?',{...profile,name:''},today).answer,/Nie wpisano jeszcze imienia/);
  assert.equal(personalProfileAnswer('Podaj imię dziecka i powiedz, jak leczyć gorączkę.',profile,today),null);
  assert.equal(personalProfileAnswer('Ile mam lat?',profile,today),null);
  assert.match(personalProfileAnswer('Który to tydzień ciąży?',{mode:'pregnancy',anchor:'2026-09-09'},today).answer,/11\. tydzień ciąży/);
});

test('personal ages work after the first birthday and use correct calendar units',()=>{
  assert.equal(childCalendarAge('2026-11-18',today),'Dziecko urodziło się dzisiaj.');
  assert.equal(childCalendarAge('2026-11-17',today),'1 dzień');
  assert.equal(childCalendarAge('2026-10-18',today),'1 miesiąc');
  assert.equal(childCalendarAge('2026-08-18',today),'3 miesiące');
  assert.equal(childCalendarAge('2025-11-18',today),'1 rok');
  assert.equal(childCalendarAge('2024-08-14',today),'2 lata, 3 miesiące i 4 dni');
  assert.equal(childCalendarAge('2021-11-18',today),'5 lat');
  assert.equal(childCalendarAge('2024-01-31','2024-02-29'),'1 miesiąc');
  assert.match(personalProfileAnswer('Ile lat ma moje dziecko?',{...profile,anchor:'2024-11-18'},today).answer,/2 lata/);
});

test('suggestions change through pregnancy and childhood without prenatal questions for a born child',()=>{
  const early=chatSuggestions({mode:'pregnancy',anchor:'2026-09-09'},today),middle=chatSuggestions({mode:'pregnancy',anchor:'2026-06-18'},today),late=chatSuggestions({mode:'pregnancy',anchor:'2026-03-18'},today),nearBirth=chatSuggestions({mode:'pregnancy',anchor:'2026-02-18'},today);
  assert.ok(early.some(q=>/początku ciąży/.test(q)));assert.ok(middle.some(q=>/drugim trymestrze/.test(q)));assert.ok(late.some(q=>/przed porodem/.test(q)));assert.ok(nearBirth.some(q=>/pierwszych dniach po narodzinach/.test(q)));
  const newborn=chatSuggestions(profile,today),older=chatSuggestions({...profile,anchor:'2026-08-01'},today),beforeBirthday=chatSuggestions({...profile,anchor:'2026-02-01'},today),toddler=chatSuggestions({...profile,anchor:'2025-05-01'},today);
  assert.ok(newborn.some(q=>/po narodzinach/.test(q)));assert.ok(!newborn.some(q=>/położn|ciąży|przed porodem/.test(q)));
  assert.notDeepEqual(newborn,older);assert.ok(beforeBirthday.some(q=>/pierwszymi urodzinami/.test(q)));assert.ok(!toddler.some(q=>/przed pierwszymi/.test(q)));
});

test('saved conversations preserve full messages, drafts and local-only markers; saving again updates one entry',()=>{
  const storage=memoryStorage(),first=conversation();
  const saved=saveChatConversation(storage,first,{now:'2026-11-18T12:01:00Z'});
  assert.equal(readChatArchive(storage).activeId,saved.id);assert.equal(readChatArchive(storage).conversations[0].messages[1].local,true);assert.equal(readChatArchive(storage).conversations[0].draft,first.draft);
  first.messages.push({role:'user',content:'Jeszcze jedno pytanie'},{role:'assistant',content:'Odpowiedź'});
  saveChatConversation(storage,first,{now:'2026-11-18T12:02:00Z'});
  assert.equal(readChatArchive(storage).conversations.length,1);assert.equal(readChatArchive(storage).conversations[0].messages.length,4);
  const second=conversation('Inne zagadnienie');saveChatConversation(storage,second,{now:'2026-11-18T12:03:00Z'});
  selectChatConversation(storage,first.id);assert.equal(readChatArchive(storage).activeId,first.id);
  storage.setItem('ppm-profile-v1','profile-preserved');deleteChatConversation(storage,second.id);assert.equal(readChatArchive(storage).conversations.length,1);assert.equal(storage.getItem('ppm-profile-v1'),'profile-preserved');
  const longer=conversation();longer.messages=Array.from({length:80},(_,i)=>({role:i%2?'assistant':'user',content:'Wiadomość '+i}));saveChatConversation(storage,longer);assert.equal(readChatArchive(storage).conversations.find(c=>c.id===longer.id).messages.length,80);
});

test('saving failures and archive limits preserve existing conversations instead of deleting data',()=>{
  const storage=memoryStorage();saveChatConversation(storage,conversation());const previous=storage.getItem(CHAT_ARCHIVE_KEY);
  storage.setItem=()=>{throw new Error('QuotaExceededError');};assert.throws(()=>saveChatConversation(storage,conversation()),/Nie udało się zapisać/);assert.equal(storage.getItem(CHAT_ARCHIVE_KEY),previous);
  const corrupt=memoryStorage();corrupt.setItem(CHAT_ARCHIVE_KEY,'not JSON');assert.throws(()=>saveChatConversation(corrupt,conversation()));assert.equal(corrupt.getItem(CHAT_ARCHIVE_KEY),'not JSON');
  const full=memoryStorage();for(let i=0;i<30;i++)saveChatConversation(full,conversation('Pytanie '+i));assert.throws(()=>saveChatConversation(full,conversation()),/30 rozmów/);assert.equal(readChatArchive(full).conversations.length,30);
  const existing=readChatArchive(full).conversations[0];saveChatConversation(full,existing);assert.equal(readChatArchive(full).conversations.length,30);
});
