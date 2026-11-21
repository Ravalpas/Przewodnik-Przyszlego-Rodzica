import {quantity} from './polish.js';
export const STORAGE_KEY = 'ppm-profile-v1';
const DAY = 86400000;
export function todayString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function dayNumber(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('Podaj poprawną datę.');
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y,m-1,d));
  if(date.toISOString().slice(0,10) !== value) throw new Error('Podaj poprawną datę.');
  return Math.floor(date.getTime()/DAY);
}
export function shiftDate(value, days) {
  return new Date((dayNumber(value) + days)*DAY).toISOString().slice(0,10);
}
// Calendar months: clamp the day to the last day of the target month.
export function subtractMonths(value, months) {
  const [year,month,day] = value.split('-').map(Number);
  const target = new Date(Date.UTC(year,month-1-months,1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  target.setUTCDate(Math.min(day,lastDay));
  return target.toISOString().slice(0,10);
}
export function anchorFromAge(value, unit, today = todayString()) {
  if(!Number.isInteger(Number(value)) || Number(value)<0 || String(value).trim()==='') throw new Error('Wpisz pełną liczbę równą 0 lub większą.');
  const n = Number(value);
  if(!['days','weeks','months'].includes(unit)) throw new Error('Wybierz jednostkę wieku.');
  if(n > ({days:36525,weeks:5217,months:1200}[unit])) throw new Error('Podana liczba jest zbyt duża.');
  return unit==='months' ? subtractMonths(today,n) : shiftDate(today,-n*(unit==='weeks'?7:1));
}
export function ageAt(anchor, today = todayString()) {
  const days = dayNumber(today)-dayNumber(anchor);
  if(days<0) throw new Error('Data nie może być w przyszłości.');
  return { days, weeks:Math.floor(days/7), extraDays:days%7, stage:Math.floor(days/7)+1 };
}
export function validateProfile(profile, today = todayString()) {
  if(!profile || !['pregnancy','child'].includes(profile.mode)) throw new Error('Wybierz etap swojej drogi.');
  const age=ageAt(profile.anchor,today);
  if(profile.mode==='pregnancy' && age.days>=43*7) throw new Error('Sprawdź wiek ciąży: mapa obejmuje 42 tygodnie. Po porodzie wybierz drogę dziecka.');
  if(profile.mode==='child' && age.days>36525) throw new Error('Sprawdź datę urodzenia.');
  return age;
}
export function ageText(age) {
  const w=age.weeks, d=age.extraDays;
  return `${quantity(w,'weeks')}${d?` i ${quantity(d,'days')}`:''}`;
}
export function completedWeeksText(age,mode) {
  const stage=mode==='pregnancy'?'ciąży':'życia';
  return age.weeks===0?`Pierwszy tydzień ${stage}`:`${quantity(age.weeks,'weeks')} ${stage}`;
}
