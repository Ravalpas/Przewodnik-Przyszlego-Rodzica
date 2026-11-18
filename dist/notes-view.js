import {NOTE_COLORS,NOTE_TEXT_LIMIT,pinSvg,noteTitle} from './notes.js';
import {calendarDate,quantity} from './polish.js';
const noteEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function dayPinsHtml(notes) {
  if(!notes.length)return '';
  return `<span class="day-note-pins" aria-hidden="true">${notes.slice(0,2).reverse().map(note=>pinSvg(note.color,'calendar-note-pin')).join('')}${notes.length>1?`<b class="day-note-count">${notes.length}</b>`:''}</span>`;
}
export function createNotesView({store,sheetContent,notify,onChanged}) {
  const close=()=>document.querySelector('#sheet').close();
  function read(id) {
    try{const note=store.list().find(n=>n.id===id);if(!note)throw new Error('Ta notatka została usunięta. Otwórz ponownie wybrany dzień.');return note;}catch(e){notify(e.message);return null;}
  }
  const dateLabel=note=>calendarDate(note.date,{long:true})+(note.time?' · '+note.time:'');
  function dayHtml(date,snapshot) {
    const notes=snapshot.notes.filter(n=>n.date===date);
    return `${!snapshot.available?`<p class="notes-error" role="alert">${noteEscape(snapshot.error)}</p>`:''}${notes.length?`<section class="day-notes" aria-label="Twoje notatki na wybrany dzień"><h4>Twoje notatki <span>${quantity(notes.length,'notes')}</span></h4>${notes.map(note=>`<article class="personal-note note-${note.color}"><div class="personal-note-heading">${pinSvg(note.color)}<div><span>Twoja notatka</span><strong>${note.time?noteEscape(note.time):'Cały dzień'}</strong></div></div><p class="note-preview">${noteEscape(note.text)}</p><div class="note-actions"><button data-open-note="${note.id}">Pokaż całość</button><button data-edit-note="${note.id}">Edytuj</button><button data-delete-note="${note.id}">Usuń</button></div></article>`).join('')}</section>`:''}`;
  }
  function editNote(id,date) {
    const note=id?read(id):null;if(id&&!note)return;
    const selected=note?.color||'red';
    sheetContent(note?'Edytuj notatkę':'Nowa notatka',`<form id="note-form" class="note-form" novalidate><p class="field-help">Zapisz umówioną wizytę, ważne wydarzenie lub własne przypomnienie.</p><div class="note-date-fields"><div><label class="field-label" for="note-date">Dzień</label><input id="note-date" name="date" type="date" required value="${noteEscape(note?.date||date)}"></div><div><label class="field-label" for="note-time">Godzina <span class="optional">(opcjonalnie)</span></label><input id="note-time" name="time" type="time" value="${noteEscape(note?.time||'')}"></div></div><label class="field-label" for="note-text">Treść notatki</label><textarea id="note-text" name="text" rows="5" maxlength="${NOTE_TEXT_LIMIT}" required placeholder="Np. 10:30 — wizyta u pediatry. Zabrać książeczkę zdrowia.">${noteEscape(note?.text||'')}</textarea><fieldset class="note-color-fieldset"><legend class="field-label">Kolor szpilki</legend><div class="note-color-options">${Object.entries(NOTE_COLORS).map(([color,c])=>`<label class="note-color-option"><input type="radio" name="color" value="${color}" ${selected===color?'checked':''}>${pinSvg(color)}<span>${c.label}</span></label>`).join('')}</div></fieldset><p class="error" id="note-error" role="alert"></p><button class="primary" type="submit">${note?'Zapisz zmiany':'Dodaj notatkę'}</button><button class="text-button note-cancel" type="button" id="note-cancel">Anuluj</button></form>`);
    const form=document.querySelector('#note-form');
    form.querySelector('#note-cancel').addEventListener('click',close);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      try{const values=Object.fromEntries(new FormData(form)),saved=store.upsert({...values,...(note?{id:note.id}:{})});close();notify(note?'Zmieniono notatkę.':'Dodano notatkę.');onChanged(saved.date);}
      catch(e){form.querySelector('#note-error').textContent=e.message;}
    });
  }
  function openNote(id) {
    const note=read(id);if(!note)return;
    sheetContent('Twoja notatka',`<article class="note-detail note-${note.color}"><div class="note-detail-heading">${pinSvg(note.color)}<div><span>${noteEscape(NOTE_COLORS[note.color].label)} szpilka</span><h3>${noteEscape(dateLabel(note))}</h3></div></div><p class="note-full-text">${noteEscape(note.text)}</p><button id="note-edit-detail" class="primary">Edytuj notatkę</button><button id="note-delete-detail" class="secondary">Usuń notatkę</button></article>`);
    document.querySelector('#note-edit-detail').addEventListener('click',()=>editNote(id));
    document.querySelector('#note-delete-detail').addEventListener('click',()=>deleteNote(id));
  }
  function deleteNote(id) {
    const note=read(id);if(!note)return;
    sheetContent('Usunąć notatkę?',`<div class="note-delete-confirm"><div class="note-detail-heading">${pinSvg(note.color)}<div><strong>${noteEscape(dateLabel(note))}</strong><p>${noteEscape(noteTitle(note))}</p></div></div><p>Ta notatka zostanie usunięta z kalendarza.</p><button id="note-delete-confirm" class="primary">Usuń notatkę</button><button id="note-delete-cancel" class="secondary">Zostaw notatkę</button><p class="error" id="note-delete-error" role="alert"></p></div>`);
    document.querySelector('#note-delete-cancel').addEventListener('click',()=>openNote(id));
    document.querySelector('#note-delete-confirm').addEventListener('click',()=>{try{store.remove(id);close();notify('Usunięto notatkę.');onChanged(note.date);}catch(e){document.querySelector('#note-delete-error').textContent=e.message;}});
  }
  function bind(container,date) {
    container.querySelector('#note-add')?.addEventListener('click',()=>editNote(null,date));
    container.querySelectorAll('[data-open-note]').forEach(button=>button.addEventListener('click',()=>openNote(button.dataset.openNote)));
    container.querySelectorAll('[data-edit-note]').forEach(button=>button.addEventListener('click',()=>editNote(button.dataset.editNote)));
    container.querySelectorAll('[data-delete-note]').forEach(button=>button.addEventListener('click',()=>deleteNote(button.dataset.deleteNote)));
  }
  return {dayHtml,bind,openNote};
}
