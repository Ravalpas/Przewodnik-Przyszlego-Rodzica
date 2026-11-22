import {dayNumber,shiftDate} from './age.js';
import {addMonths} from './timeline.js';
import {CalculatorError} from './calculator-params.js';
export const LEGAL_DATE_VERSION='2026-11-22.2';
export function easterDate(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');}
export function polishHoliday(date){dayNumber(date);const y=Number(date.slice(0,4)),md=date.slice(5),fixed=['01-01','01-06','05-01','05-03','08-15','11-01','11-11','12-25','12-26',...(y>=2025?['12-24']:[])],easter=easterDate(y);return fixed.includes(md)||[easter,shiftDate(easter,1),shiftDate(easter,60)].includes(date);}
export function legalWorkingDay(date){const weekday=new Date(date+'T12:00:00Z').getUTCDay();return weekday!==0&&weekday!==6&&!polishHoliday(date);}
export function nextLegalWorkingDay(date){let result=date;for(let i=0;i<15;i++){if(legalWorkingDay(result))return result;result=shiftDate(result,1);}throw new CalculatorError('Nie można ustalić końca terminu.');}
export function legalTerm(anchor,{amount,unit='calendar-days',regime='calendar',includeAnchor=false}={}){
 dayNumber(anchor);if(!['calendar','kc-action','kpa-procedure','kpc-appeal'].includes(regime))throw new CalculatorError('Nieznany reżim terminu.');if(!Number.isInteger(amount)||Math.abs(amount)>10000)throw new CalculatorError('Nieprawidłowa długość terminu.');
 let nominal;
 if(unit==='calendar-months')nominal=addMonths(anchor,amount);
 else if(unit==='calendar-weeks')nominal=shiftDate(anchor,amount*7);
 else if(unit==='working-days'){nominal=anchor;let remaining=Math.abs(amount);while(remaining){nominal=shiftDate(nominal,amount<0?-1:1);if(legalWorkingDay(nominal))remaining--;}}
 else if(unit==='calendar-days')nominal=shiftDate(anchor,amount-(includeAnchor&&amount>0?1:0));else throw new CalculatorError('Nieznana jednostka terminu.');
 const adjusted=amount>=0&&['kc-action','kpa-procedure','kpc-appeal'].includes(regime)?nextLegalWorkingDay(nominal):nominal;
 return {triggerDate:anchor,startDate:includeAnchor?anchor:shiftDate(anchor,1),nominalDate:nominal,deadline:adjusted,adjusted:adjusted!==nominal,unit,amount,regime,algorithmVersion:LEGAL_DATE_VERSION,legalBasis:regime==='kpa-procedure'?'art.57 KPA':regime==='kpc-appeal'?'art.165 KPC w zw. z art.111–115 KC':regime==='kc-action'?'art.111–115 KC; przy pracowniczych odpowiednio art.300 KP':'Termin kalendarzowy / minimalne wyprzedzenie: bez automatycznego przesuwania granicy wieku i okresów świadczenia'};
}
