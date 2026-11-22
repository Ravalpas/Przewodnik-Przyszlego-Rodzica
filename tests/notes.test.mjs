import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createNotesStore,NOTES_KEY,NOTE_COLORS,validateNote,pinSvg} from '../dist/notes.js';

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
