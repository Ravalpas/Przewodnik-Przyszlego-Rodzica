const plurals = new Intl.PluralRules('pl-PL');
const numbers = new Intl.NumberFormat('pl-PL', {maximumFractionDigits: 10});
const units = {
  days: ['dzień', 'dni', 'dni', 'dnia'],
  weeks: ['tydzień', 'tygodnie', 'tygodni', 'tygodnia'],
  months: ['miesiąc', 'miesiące', 'miesięcy', 'miesiąca'],
  years: ['rok', 'lata', 'lat', 'roku'],
  stages: ['etap', 'etapy', 'etapów', 'etapu'],
  matters: ['sprawa', 'sprawy', 'spraw', 'sprawy']
};

// Cardinal quantities and ordinal positions have different grammatical forms.
// Keep original source quotations separate: their case belongs to the source sentence.
export function pluralWord(value, one, few, many, other = many) {
  return {one, few, many, other}[plurals.select(Number(value))];
}
export function unitWord(value, unit) {
  if (!units[unit]) throw new Error('Nieznana jednostka.');
  return pluralWord(value, ...units[unit]);
}
export const quantity = (value, unit) => `${numbers.format(Number(value))} ${unitWord(value, unit)}`;
export function ordinal(value, unit) {
  const noun = {days: 'dzień', weeks: 'tydzień', months: 'miesiąc', years: 'rok'}[unit];
  if (!noun || !Number.isInteger(Number(value)) || Number(value) < 1) throw new Error('Niepoprawna liczba porządkowa.');
  return `${Number(value)}. ${noun}`;
}
export function ageUnitLabel(value, unit) {
  if (String(value).trim() === '' || !Number.isInteger(Number(value)) || Number(value) < 0) {
    return {days: 'Dni', weeks: 'Tygodnie', months: 'Miesiące'}[unit];
  }
  const adjective = unit === 'days' ? '' : `${pluralWord(value, 'pełny', 'pełne', 'pełnych', 'pełnego')} `;
  return adjective + unitWord(value, unit);
}

export function calendarDate(value, {long = false} = {}) {
  if (!value) return 'data do uzupełnienia';
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric', month: long ? 'long' : 'short', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${value}T12:00:00Z`));
}
export function periodText(event, options) {
  if (!event.start || !event.end) return 'Uzupełnij datę zdarzenia w ustawieniach';
  if (event.start === event.end) return calendarDate(event.start, options);
  return `Od ${calendarDate(event.start, options)} do ${calendarDate(event.end, options)}`;
}
