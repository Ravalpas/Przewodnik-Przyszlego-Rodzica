import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createNotesStore,NOTES_KEY,NOTE_COLORS,validateNote,pinSvg} from '../dist/notes.js';
import {selectChatNotes,localNotesAnswer,chatNotesContext,validateChatNotes,chatRequestBody} from '../dist/chat-notes.js';
import {assessChatRequest} from '../dist/chat-policy.js';
import {saveChatConversation,readChatArchive,newConversation} from '../dist/chat-storage.js';
import {createBielik} from '../backend/bielik.mjs';

const today='2026-11-18',options={today},memory=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};
const sample=(id,date,text,color='red',time='')=>({id,date,text,color,time});
const snapshot={available:true,notes:[sample('one',today,'Pediatra — zabrać książeczkę','red','10:30'),sample('two','2026-11-19','USC — odbiór aktu','green','09:00'),sample('three','2026-11-20','Szczepienie — zapytać o termin','yellow'),sample('four','2026-11-30','Wizyta kontrolna','orange')]};
test('calendar note CRUD preserves full text, dates, optional time and all five colors',()=>{
  const storage=memory();let id=0;const store=createNotesStore({getStorage:()=>storage,clock:()=>today+'T12:00:00Z',makeId:()=>String(++id)});
  for(const color of Object.keys(NOTE_COLORS)){const note=store.upsert({date:today,color,text:'Tekst\n'+color,time:'14:25'});assert.equal(note.color,color);assert.match(pinSvg(color),/viewBox="0 0 48 60"/);}
  assert.equal(store.list().length,5);const first=store.list()[0];
  const edited=store.upsert({...first,date:'2026-12-01',time:'',text:'ą'.repeat(3000)});
  assert.equal(edited.id,first.id);assert.equal(edited.createdAt,first.createdAt);assert.equal(store.list().at(-1).text.length,3000);
  store.remove(first.id);assert.equal(store.list().length,4);assert.throws(()=>store.upsert({...edited,text:'Nie przywracaj usuniętego wpisu'}),/usunięta/);
  assert.equal(createNotesStore({getStorage:()=>storage}).list().length,4);
});
test('invalid notes, corruption and quota failures cannot erase prior data',()=>{
  const storage=memory(),store=createNotesStore({getStorage:()=>storage,makeId:()=> 'safe'});
  const first=store.upsert({date:today,text:'Wizyta',color:'red'}),raw=storage.getItem(NOTES_KEY);
  for(const values of [{date:'2026-02-30'},{time:'25:00'},{text:''},{text:'a'.repeat(3001)},{color:'purple'}])assert.throws(()=>store.upsert({...first,...values}));
  assert.equal(storage.getItem(NOTES_KEY),raw);
  storage.setItem=()=>{throw new Error('Quota');};assert.throws(()=>store.remove(first.id),/zapisać/);assert.equal(storage.getItem(NOTES_KEY),raw);
  const broken=createNotesStore({getStorage:()=>({getItem:()=>'{broken',setItem:()=>assert.fail('must not overwrite')})});assert.equal(broken.snapshot().available,false);assert.throws(()=>broken.upsert(first));
  assert.throws(()=>validateNote({...first,id:'<script>'}));
});
test('local note answers support dates, relative days, topic, colors and note follow-ups',()=>{
  for(const [question,id] of [['Co mam zaplanowane na jutro?','two'],['Pokaż moje żółte szpilki','three'],['Pokaż notatki z 18 listopada','one'],['Kiedy mam wizytę u pediatry?','one'],['Pokaż notatki z 2026-11-30','four'],['Co mam zaplanowane w piątek?','three'],['Pokaż notatki z 30.11','four']]){
    const result=localNotesAnswer(question,snapshot,options);assert.equal(result.notes.length,1,question);assert.equal(result.notes[0].id,id,question);
  }
  assert.equal(localNotesAnswer('A jutro?',snapshot,{...options,history:[{role:'user',content:'Jakie mam notatki w kalendarzu?'}]}).notes[0].id,'two');
  const blue={available:true,notes:[...snapshot.notes,sample('blue-note',today,'Wizyta u położnej','blue')]};
  assert.equal(localNotesAnswer('Pokaż niebieskie szpilki',blue,options).notes[0].id,'blue-note');
  assert.equal(localNotesAnswer('A niebieskie?',blue,{...options,history:[{role:'user',content:'Pokaż moje notatki'}]}).notes[0].color,'blue');
  const week=selectChatNotes('Pokaż notatki w tym tygodniu',snapshot,options);assert.equal(week.matched,3);
  assert.match(localNotesAnswer('Jakie mam notatki?',{available:false,notes:[]},options).answer,/Nie mogę teraz odczytać/);
  assert.match(localNotesAnswer('Jakie mam notatki?',{available:true,notes:[]},options).answer,/Nie masz jeszcze notatek/);
  assert.equal(localNotesAnswer('Jak przygotować się do wizyty z moich notatek?',snapshot,options),null);
  assert.ok(selectChatNotes('Jak przygotować się do najbliższej wizyty z moich notatek?',snapshot,options).notes.length);
});
test('reading a note about care differs from endorsing medical or legal advice',()=>{
  for(const question of ['Pokaż notatki o szczepieniu','Kiedy mam umówione szczepienie?']){const a=assessChatRequest(question);assert.equal(a.inScope,true);assert.equal(a.requiresSources,false);}
  for(const question of ['Czy muszę wykonać szczepienie z mojej notatki?','Wyjaśnij obowiązek zgłoszenia dziecka z mojej notatki'])assert.equal(assessChatRequest(question).requiresSources,true);
});
test('AI receives a validated, bounded note subset with explicit truncation and omission metadata',()=>{
  const many={available:true,notes:Array.from({length:20},(_,i)=>sample('note-'+i,today,'Pediatra '+i+' '+ 'ą'.repeat(2500)))};
  const context=chatNotesContext('Pokaż wszystkie notatki',many,options);assert.equal(context.notes.length,8);assert.equal(context.matched,20);assert.equal(context.partial,true);assert.equal(context.notes[0].textTruncated,true);
  assert.ok(context.notes.every(n=>n.text.length<=700));const {related,...validated}=context;assert.deepEqual(validateChatNotes(context),validated);
  for(const bad of [{...context,notes:[...context.notes,...context.notes]},{...context,total:0},{...context,notes:[{...context.notes[0],text:'a'.repeat(701)}]},{...context,available:false}])assert.throws(()=>validateChatNotes(bad));
  const body=chatRequestBody({message:'ą'.repeat(3000),profile:{mode:'child',anchor:today},noteContext:context,history:Array.from({length:8},(_,i)=>({role:i%2?'assistant':'user',content:'ą'.repeat(3000)}))});
  assert.ok(Buffer.byteLength(body)<=39000);assert.equal(JSON.parse(body).message.length,3000);assert.ok(JSON.parse(body).history.length<8);
  const convo=newConversation();convo.messages=[{role:'assistant',content:'Notatki',local:true,notes:[{id:'one',title:'Wizyta',date:today,time:'10:30',color:'red'}]}];const storage=memory();saveChatConversation(storage,convo);assert.equal(readChatArchive(storage).conversations[0].messages[0].notes[0].id,'one');
});
test('backend passes notes as untrusted personal context and rejects malformed notes before inference',async()=>{
  const catalog=JSON.parse(await readFile(new URL('../dist/data/catalog.json',import.meta.url),'utf8'));let calls=0,payload;
  const service=createBielik({monitor:{read:async()=>({catalog,sources:{}})},clock:()=>new Date(today+'T12:00:00Z'),env:{FABRYKA_API_KEY:'fake-unit-key'},sourceFetcher:async()=>{throw new Error('offline');},fetcher:async(url,request)=>{calls++;payload=JSON.parse(request.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({kind:'practical',answer:'Sprawdź zapisane pytania przed wizytą.',source_ids:[]})}}]});}});
  const noteContext=chatNotesContext('Jak przygotować pytania do pediatry z moich notatek?',snapshot,options);
  await service.answer({message:'Jak przygotować pytania do pediatry z moich notatek?',profile:{mode:'child',anchor:'2026-11-01'},noteContext});
  assert.equal(calls,1);assert.match(payload.messages[0].content,/NOTATKI RODZICA/);assert.match(payload.messages[0].content,/Pediatra/);assert.match(payload.messages[0].content,/a nie oficjalnymi/);
  await assert.rejects(()=>service.answer({message:'Jakie mam notatki?',noteContext:{...noteContext,notes:[{id:'bad'}]}}),{code:'invalid_notes'});assert.equal(calls,1);
});
