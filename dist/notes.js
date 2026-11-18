import {dayNumber} from './age.js';
export const NOTES_KEY='ppm-calendar-notes-v1';
export const NOTE_LIMIT=500;
export const NOTE_TEXT_LIMIT=3000;
export const NOTE_COLORS={
  red:{label:'Czerwona',name:'czerwona',base:'#ef6b77',dark:'#ca465c',light:'#ffb2b9'},
  green:{label:'Zielona',name:'zielona',base:'#70c77c',dark:'#429c65',light:'#b9e7b8'},
  yellow:{label:'Żółta',name:'żółta',base:'#f2cc55',dark:'#cf9b35',light:'#fff0a5'},
  orange:{label:'Pomarańczowa',name:'pomarańczowa',base:'#f3a15e',dark:'#d47b3e',light:'#ffd0a2'},
  blue:{label:'Niebieska',name:'niebieska',base:'#6aa8eb',dark:'#3976bc',light:'#bedfff'}
};
const noteId=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export function validateNote(value) {
  if(!value||typeof value.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.id))throw new Error('Nieprawidłowy identyfikator notatki.');
  dayNumber(value.date);
  if(typeof value.text!=='string'||!value.text.trim())throw new Error('Wpisz treść notatki.');
  if(value.text.length>NOTE_TEXT_LIMIT)throw new Error('Notatka może mieć do 3000 znaków.');
  if(!Object.hasOwn(NOTE_COLORS,value.color))throw new Error('Wybierz kolor szpilki.');
  const time=value.time||'';if(typeof time!=='string'||time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Podaj poprawną godzinę.');
  return {id:value.id,date:value.date,time,color:value.color,text:value.text.trim(),...(typeof value.createdAt==='string'?{createdAt:value.createdAt}:{}),...(typeof value.updatedAt==='string'?{updatedAt:value.updatedAt}:{}),...(value.textTruncated===true?{textTruncated:true}:{})};
}
export const noteTitle=note=>note.text.split(/\r?\n/).find(line=>line.trim())?.trim().slice(0,100)||'Notatka';
export const sortNotes=notes=>[...notes].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'')||(a.createdAt||'').localeCompare(b.createdAt||'')||a.id.localeCompare(b.id));
export function pinSvg(color='red',extraClass='') {
  const c=NOTE_COLORS[color]||NOTE_COLORS.red;
  const className=['note-pin',extraClass].filter(v=>/^[a-z -]*$/.test(v)).join(' ');
  return `<svg class="${className}" viewBox="0 0 48 60" fill="none" aria-hidden="true"><ellipse cx="24" cy="54" rx="8" ry="2.5" fill="#536482" opacity=".12"/><g transform="rotate(17 24 28)"><path d="m21 31 1.2 21.5 2.1 3 2.2-3L28 31Z" fill="#b6c5d8" stroke="#7188a5" stroke-width="1.4" stroke-linejoin="round"/><path d="m23 35 .5 15" stroke="#f7fbff" stroke-width="1.5" stroke-linecap="round"/><path d="M16 26c2 3 2 7 0 10 5 4 12 4 17 0-3-3-3-7-1-10Z" fill="${c.dark}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/><path d="M18 28c1 2 1 5 0 7 3 2 7 2 10 1" stroke="${c.light}" stroke-width="2.4" stroke-linecap="round"/><path d="M9 18C9 9 16 5 24 5s15 5 15 13c0 9-7 15-15 15S9 27 9 18Z" fill="${c.base}" stroke="${c.dark}" stroke-width="1.6"/><path d="M15 15c1-4 5-6 10-6" stroke="${c.light}" stroke-width="5" stroke-linecap="round"/><ellipse cx="17" cy="13" rx="3" ry="2" fill="white" opacity=".8"/><path d="M14 25c4 5 13 7 19 0" stroke="${c.dark}" stroke-width="2" stroke-linecap="round" opacity=".55"/></g></svg>`;
}
export function createNotesStore({getStorage=()=>globalThis.localStorage,clock=()=>new Date().toISOString(),makeId=noteId}={}) {
  function list() {
    let raw;try{raw=getStorage().getItem(NOTES_KEY);}catch{throw new Error('Nie można odczytać notatek w tej przeglądarce.');}
    if(!raw)return [];
    let data;try{data=JSON.parse(raw);}catch{throw new Error('Nie udało się odczytać notatek. Dotychczasowy zapis pozostaje bez zmian.');}
    if(data?.version!==1||!Array.isArray(data.notes)||data.notes.length>NOTE_LIMIT)throw new Error('Nieprawidłowy zapis notatek. Dotychczasowy zapis pozostaje bez zmian.');
    const notes=data.notes.map(validateNote);if(new Set(notes.map(n=>n.id)).size!==notes.length)throw new Error('W zapisie powtarza się identyfikator notatki.');
    return sortNotes(notes);
  }
  function write(notes) {
    try{getStorage().setItem(NOTES_KEY,JSON.stringify({version:1,notes}));}catch{throw new Error('Nie udało się zapisać notatki. Sprawdź miejsce i ustawienia zapisu tej przeglądarki.');}
  }
  return {
    list,
    snapshot:()=>{try{return {available:true,notes:list()};}catch(e){return {available:false,notes:[],error:e.message};}},
    upsert:draft=>{
      const notes=list(),old=draft.id?notes.find(n=>n.id===draft.id):null;
      if(draft.id&&!old)throw new Error('Ta notatka została usunięta. Otwórz ponownie wybrany dzień.');
      if(!old&&notes.length>=NOTE_LIMIT)throw new Error('Zapisano już 500 notatek. Usuń wybraną notatkę, aby dodać kolejną.');
      const now=clock(),note=validateNote({...draft,id:old?.id||makeId(),color:draft.color||'red',createdAt:old?.createdAt||now,updatedAt:now});
      write([...notes.filter(n=>n.id!==note.id),note]);return note;
    },
    remove:id=>{const notes=list(),note=notes.find(n=>n.id===id);if(!note)throw new Error('Nie znaleziono notatki.');write(notes.filter(n=>n.id!==id));return note;},
    restore:value=>{const notes=list(),note=validateNote(value);if(notes.some(n=>n.id===note.id))return;if(notes.length>=NOTE_LIMIT)throw new Error('Brak miejsca na przywrócenie notatki.');write([...notes,note]);}
  };
}
