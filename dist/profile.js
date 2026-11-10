import { ageAt, todayString, dayNumber } from './age.js';
export const GENDERS = ['unspecified','boy','girl'];
export const NAME_LIMIT = 200;
const allowedName = /^[\p{L}\p{M} '\u2019\u02bc\-\u2010\u2011]*$/u;
export function cleanName(value) {
  return String(value).normalize('NFC').replace(/\s/g,' ').replace(/[^\p{L}\p{M} '\u2019\u02bc\-\u2010\u2011]/gu,'').slice(0,NAME_LIMIT);
}
export function validateName(value) {
  const name=String(value ?? '').normalize('NFC').trim().replace(/\s+/g,' ');
  if(name.length>NAME_LIMIT) throw new Error(`Nazwa może mieć maksymalnie ${NAME_LIMIT} znaków.`);
  if(!allowedName.test(name)||name&&!/\p{L}/u.test(name)) throw new Error('Wpisz litery, spacje, łączniki lub apostrofy. Cyfry i inne symbole są niedozwolone.');
  return name;
}
export function normalizeProfile(value, {now=new Date().toISOString(),isNew=false}={}) {
  if(!value||!['pregnancy','child'].includes(value.mode)) throw new Error('Wybierz etap swojej drogi.');
  ageAt(value.anchor);
  const validTimestamp=s=>typeof s==='string'&&!Number.isNaN(Date.parse(s))&&Date.parse(s)<=Date.parse(now);
  let name='';try{name=validateName(value.name);}catch{/* Keep older age data even if optional identity data is malformed. */}
  return {mode:value.mode,anchor:value.anchor,name,gender:GENDERS.includes(value.gender)?value.gender:'unspecified',firstUsedAt:validTimestamp(value.firstUsedAt)?value.firstUsedAt:isNew?now:null,statsStartedAt:validTimestamp(value.statsStartedAt)?value.statsStartedAt:now};
}
export function completedStages(profile,today=todayString()) {
  const weeks=ageAt(profile.anchor,today).weeks;
  return profile.mode==='pregnancy'?Math.min(42,weeks):42+Math.min(52,weeks);
}
export function usageDays(profile,today=todayString()) {
  return Math.max(1,dayNumber(today)-dayNumber(todayString(new Date(profile.statsStartedAt)))+1);
}
