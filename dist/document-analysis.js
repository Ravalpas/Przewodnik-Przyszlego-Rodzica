import {DOCUMENT_TYPES,DOCUMENT_FIELDS,FIELD_BY_ID,foldDocument,documentValue} from './document-schema.js';
const instruction=/\b(instrukcja|pouczenie|wypelnij|nalezy wpisac|przyklad|przykladowo|oznacza|wpisz|niepotrzebne skresl|objasnienia)\b/;
const datePattern='(?:\\d{4}-\\d{2}-\\d{2}|\\d{2}[./-]\\d{2}[./-]\\d{4})';
const amountPattern='(?:\\d{1,3}(?:[ \\u00a0]\\d{3})+|\\d+)(?:[,.]\\d{1,2})?';
export function documentRows(items){
 const rows=[];
 for(const item of [...items].filter(i=>i.text?.trim()).sort((a,b)=>a.y-b.y||a.x-b.x)){
  let row=rows.findLast(r=>Math.abs(r.y-item.y)<=Math.max(3,Math.min(r.height,item.height)*.55));
  if(!row){row={y:item.y,height:item.height,items:[]};rows.push(row);}row.items.push(item);row.height=Math.max(row.height,item.height);
 }
 return rows.sort((a,b)=>a.y-b.y).map(r=>({...r,items:r.items.sort((a,b)=>a.x-b.x),text:r.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ')}));
}
export function recognizeDocument(page,override){
 if(override)return {...DOCUMENT_TYPES.find(t=>t.id===override),version:'Rodzaj przypisany ręcznie; wersja nieustalona',versionVerified:false};
 const rows=documentRows(page.items),head=foldDocument(rows.slice(0,22).map(r=>r.text).join('\n')),all=foldDocument(rows.map(r=>r.text).join('\n'));
 let id;
 const codes=[...head.matchAll(/\b(zam|zur|zao|zas\s*-?\s*53|zas\s*-?\s*55|zas\s*-?\s*12|znp\s*-?\s*7|ol\s*-?\s*10|ol\s*-?\s*9|z\s*-?\s*15\s*[ab]?|z\s*-?\s*3\s*[ab]?)\b/g)].map(m=>m[1].replace(/\s/g,'').toUpperCase().replace(/^Z(?=\d)/,'Z-').replace(/^ZAS(?=\d)/,'ZAS-').replace(/^ZNP(?=\d)/,'ZNP-').replace(/^OL(?=\d)/,'OL-'));
 if(codes.length)id=codes[0];
 else if(/\bdecyzja\b|\brozstrzygniecie\b/.test(head))id='DECISION';
 else if(/wykaz wyplaconych|wykaz swiadczen|zestawienie wyplaconych/.test(head))id='BENEFITS';
 else if(/e-zla|ezla|zaswiadczenie lekarskie.*niezdolnos/.test(head))id='EZLA';
 else if(/poswiadczen.*ubezpieczen|potwierdzen.*ubezpieczen|zestawienie okresow ubezpieczenia/.test(head))id='INSURANCE';
 else if(/zaswiadczen.*zadluzen|stan naleznosci|saldo.*skladek/.test(head))id='DEBT';
 else if(/zestawienie skladek|podstawy wymiaru skladek/.test(head))id='CONTRIBUTIONS';
 else if(/zaswiadczen.*wynagrodzen|zestawienie wynagrodzen|lista plac/.test(head))id='WAGES';
 else if(/odpis.*aktu urodzenia|akt urodzenia/.test(head))id='BIRTH';
 else if(/zaswiadczenie.*martw.*urodzen|karta martwego urodzenia/.test(head))id='STILLBIRTH';
 else if(/akt zgonu|karta zgonu/.test(head))id='DEATH';
 else if(/przysposobien|adopcj/.test(head))id='ADOPTION';
 else if(/piecza zastepcza|rodzina zastepcza|umieszczen.*rodzin/.test(head))id='FOSTER';
 else if(/odroczeni.*obowiazku szkolnego/.test(head))id='SCHOOL';
 else if(/zaswiadczenie.*za zyciem|art\. ?4 ust\. ?3.*2016/.test(head))id='LIFE';
 else if(/orzeczenie o niepelnosprawnosci|stopniu niepelnosprawnosci/.test(head))id='DISABILITY';
 else if(/hospitalizac|pobyt.*szpital|karta informacyjna/.test(head))id='HOSPITAL';
 const type=DOCUMENT_TYPES.find(t=>t.id===(id||'OTHER'))||DOCUMENT_TYPES.at(-1);
 const version=all.match(/(?:wersja|wydanie|aktualizacja|obowiazuje od)\s*[:\-]?\s*(\d{2}[./-]\d{2}[./-]\d{4}|\d{4}-\d{2}-\d{2}|\d{2}[./]\d{4})/);
 return {...type,version:version?.[1]||'Wersja wzoru nieustalona',versionVerified:false,versionEvidence:version?.[0]||null,historicalNotice:type.historical?'Wzór historyczny: można odczytać tę sprawę. Dla nowego wniosku sprawdź obecny wzór ZUS.':null};
}
function valueFromTail(type,text){
 const clean=String(text).trim().replace(/^[:=;\s\-–]+/,'').trim();if(!clean)return null;
 if(type==='date')return clean.match(new RegExp('^('+datePattern+')(?=\\s|$|[;,])'))?.[1]||null;
 if(['money','integer'].includes(type)){
  const match=clean.match(new RegExp('^('+amountPattern+')(?:\\s*(?:PLN|zł|zl|g))?(?=\\s|$|[;,])','i'));if(!match||/%/.test(clean.slice(match[0].length,match[0].length+3)))return null;return match[1];
 }
 if(type==='fte')return clean.match(/^(\d\s*\/\s*\d|[01](?:[,.]\d{1,2})?|pełny etat|pelny etat)/i)?.[1]||null;
 if(type==='pesel')return clean.match(/^(\d[\d ]{9,22}\d)/)?.[1]||null;
 if(type==='insuranceCode')return clean.match(/^(\d[\d ]{4,12}\d)/)?.[1]||null;
 if(['occupation','coverage'].includes(type))return clean.replace(/[.;]+$/,'').trim();
 return clean.slice(0,200);
}
function rowFragments(row,pageWidth){
 const cells=[];let cell;
 for(const word of row.items){const gap=cell?word.x-cell.right:0;if(!cell||gap>Math.max(24,Math.min(55,pageWidth*.065))){cell={text:word.text,x:word.x,y:word.y,right:word.x+word.width,height:word.height,words:[word]};cells.push(cell);}else{cell.text+=' '+word.text;cell.right=Math.max(cell.right,word.x+word.width);cell.words.push(word);cell.height=Math.max(cell.height,word.height);}}
 return cells;
}
function subjectAt(rows,rowIndex,x){
 for(let i=rowIndex;i>=Math.max(0,rowIndex-30);i--){const row=rows[i],left=row.items.find(item=>Math.abs(item.x-x)<220)||row.items[0];const region=row.items.filter(item=>Math.abs(item.x-x)<160).map(item=>item.text).join(' ');const t=foldDocument(region||left?.text);
  if(/dane platnika|platnik skladek|dane pracodawcy/.test(t))return 'payer';
  if(/dane (?:drugiego rodzica|ojca)|ojciec dziecka/.test(t))return 'father';
  if(/dane matki|matka dziecka/.test(t))return 'mother';
  if(/dane dziecka|dane dzieci/.test(t))return 'child';
  if(/dane (?:ubezpieczonego|wnioskodawcy)|osoba ubezpieczona/.test(t))return 'insured';
 }
 return 'unassigned';
}
function wageTable(page,rows,emit){
 let header=null;
 const headers=[['wage.gross',/wynagrodzenie brutto|przychod brutto|\bbrutto\b/],['wage.deducted',/potracone skladki|skladki finansowane/],['wage.worked',/dni przepracowane|dni pracy/],['wage.scheduled',/dni wymagane|dni obowiazkowe/],['wage.contributionBase',/podstawa.*skladek/]];
 for(let index=0;index<rows.length;index++){
  const cells=rowFragments(rows[index],page.width),fold=foldDocument(rows[index].text);
  if(/miesiac|okres/.test(fold)&&headers.some(([,re])=>re.test(fold))){header={index,columns:cells.map(c=>({cell:c,field:headers.find(([,re])=>re.test(foldDocument(c.text)))?.[0]})).filter(c=>c.field)};continue;}
  if(!header||index-header.index>18)continue;
  const month=fold.match(/\b(20\d{2})[-./](0?[1-9]|1[0-2])\b/)||fold.match(/\b(0?[1-9]|1[0-2])[-./](20\d{2})\b/);if(!month)continue;
  const period=month[1].length===4?month[1]+'-'+month[2].padStart(2,'0'):month[2]+'-'+month[1].padStart(2,'0');
  for(const column of header.columns){const cell=cells.filter(c=>Math.abs(c.x-column.cell.x)<Math.max(36,page.width*.055)).sort((a,b)=>Math.abs(a.x-column.cell.x)-Math.abs(b.x-column.cell.x))[0];if(!cell)continue;const raw=valueFromTail(column.field.endsWith('worked')||column.field.endsWith('scheduled')?'integer':'money',cell.text);if(raw==null)continue;const checked=documentValue(column.field.endsWith('worked')||column.field.endsWith('scheduled')?'integer':'money',raw);if(!checked.valid)continue;emit(column.field,checked.value,cell,{period,valueType:column.field.endsWith('worked')||column.field.endsWith('scheduled')?'integer':'money',scope:'person',label:column.field==='wage.gross'?'Wynagrodzenie brutto za '+period:column.field==='wage.deducted'?'Potrącone składki za '+period:column.field==='wage.worked'?'Dni pracy za '+period:column.field==='wage.scheduled'?'Dni wymagane za '+period:'Podstawa składek za '+period,ownerHint:subjectAt(rows,index,cell.x),needsReview:true});}
 }
}
export function analyzeDocumentPage(page,{documentId,override}={}){
 const rows=documentRows(page.items),type=recognizeDocument(page,override),fields=[],unmapped=[],used=new Set();
 const isReference=['DECISION','BENEFITS'].includes(type.id);
 const emit=(id,value,cell,extra={})=>{
  const definition=FIELD_BY_ID[id],scope=extra.scope||definition?.scope||'information';
  const key=[id,value,extra.period||'',Math.round(cell.x),Math.round(cell.y)].join('|');if(used.has(key))return;used.add(key);
  fields.push({id:crypto.randomUUID(),field:id,label:extra.label||definition?.label||id,value,valueType:extra.valueType||definition?.type||'text',scope:isReference?'reference':scope,documentId,page:page.number,bbox:[cell.x,cell.y,Math.max(10,(cell.right||cell.x+cell.width)-cell.x),cell.height||12],evidence:String(cell.text||'').slice(0,260),method:extra.method||cell.words?.[0]?.method||page.method||'text',confidence:cell.words?.[0]?.confidence??null,structuralValid:true,confirmed:false,needsReview:extra.needsReview!==false,ownerHint:extra.ownerHint||'unassigned',period:extra.period||null,target:definition?.target||null,...extra,scope:isReference?'reference':scope,referenceOnly:isReference||scope==='reference'});
 };
 for(let index=0;index<rows.length;index++){
  const row=rows[index];if(instruction.test(foldDocument(row.text)))continue;
  const cells=rowFragments(row,page.width);
  for(let ci=0;ci<cells.length;ci++){
   const cell=cells[ci],text=foldDocument(cell.text),ownerHint=subjectAt(rows,index,cell.x);
   for(const definition of DOCUMENT_FIELDS){
    const match=definition.patterns.map(re=>re.exec(text)).find(Boolean);if(!match)continue;if(DOCUMENT_FIELDS.some(other=>other!==definition&&other.patterns.some(re=>{const longer=re.exec(text);return longer&&longer.index<=match.index&&longer.index+longer[0].length>=match.index+match[0].length&&longer[0].length>match[0].length;})))continue;
    if(ownerHint==='payer'&&definition.scope==='person')continue;
    let raw=valueFromTail(definition.type,cell.text.slice(match.index+match[0].length)),valueCell=cell;
    if(raw==null){const next=cells[ci+1];if(next&&next.x-cell.right<page.width*.18&&!DOCUMENT_FIELDS.some(d=>d.patterns.some(re=>re.test(foldDocument(next.text))))){raw=valueFromTail(definition.type,next.text);valueCell=next;}}
    if(raw==null){const below=rows[index+1];if(below&&below.y-row.y<Math.max(30,row.height*2.8)){const next=rowFragments(below,page.width).find(c=>Math.abs(c.x-cell.x)<Math.max(20,page.width*.035));if(next&&!instruction.test(foldDocument(next.text))){raw=valueFromTail(definition.type,next.text);valueCell=next;}}}
    if(raw==null)continue;const check=documentValue(definition.type,raw);if(!check.valid)continue;
    emit(definition.id==='insuranceCode'?'occupation':definition.id,check.value,valueCell,{ownerHint,needsReview:page.method==='ocr'||ownerHint==='unassigned'||type.id==='OTHER'});
   }
  }
 }
 for(const widget of page.forms||[]){
  if(widget.type==='signature'){unmapped.push({name:widget.name,type:'signature',page:page.number,reason:'Podpis nie jest weryfikowany przez odczyt PDF.'});continue;}
  if(widget.value===false||widget.value==null||['','Off','off','No'].includes(widget.value))continue;
  const key=foldDocument(widget.name).replace(/[_-]/g,' '),definition=DOCUMENT_FIELDS.find(d=>d.patterns.some(re=>re.test(key)))||DOCUMENT_FIELDS.find(d=>d.id.toLowerCase()===key.replace(/\s/g,''));
  if(!definition){unmapped.push({name:String(widget.name).slice(0,100),page:page.number,rect:widget.rect,reason:'Pole nie ma jednoznacznego przypisania; możesz wskazać je ręcznie.'});continue;}
  const check=documentValue(definition.type,widget.value);if(!check.valid)continue;
  const box=widget.bbox||[0,0,100,15];emit(definition.id==='insuranceCode'?'occupation':definition.id,check.value,{x:box[0],y:box[1],right:box[0]+box[2],height:box[3],text:widget.name+': '+String(widget.value)},{method:'acroform',needsReview:false});
 }
 if(!isReference)wageTable(page,rows,emit);
 // Unlabelled dates/amounts remain candidates, never calculator facts. This is
 // particularly useful for changing layouts of internal ZUS printouts.
 for(const row of rows){if(instruction.test(foldDocument(row.text)))continue;for(const cell of rowFragments(row,page.width)){
  const tokens=[...cell.text.matchAll(new RegExp(datePattern+'|(?:\\d{1,3}(?:[ \\u00a0]\\d{3})+|\\d+)[,.]\\d{2}(?:\\s*(?:zł|PLN))?','gi'))];
  for(const match of tokens){const raw=match[0];if(fields.some(f=>f.evidence.includes(raw)))continue;if(unmapped.length>=180)break;unmapped.push({name:'Wartość bez jednoznacznej etykiety',value:raw,valueType:new RegExp('^'+datePattern+'$').test(raw)?'date':'money',documentId,page:page.number,bbox:[cell.x,cell.y,cell.right-cell.x,cell.height],evidence:cell.text.slice(0,220),method:page.method||'text',reason:'Wskaż znaczenie wartości po sprawdzeniu opisu, kolumny i osoby.'});}
 }}
 const text=foldDocument(rows.map(r=>r.text).join('\n'));
 if(type.id==='DECISION'){
  const row=rows.find(r=>/odmawia|odmowiono|przyznaje|przyznano/.test(foldDocument(r.text)));if(row){const refused=/odmawia|odmowiono/.test(foldDocument(row.text));emit('reference.status',refused?'refused':'granted',{x:row.items[0].x,y:row.y,right:page.width,height:row.height,text:row.text},{scope:'reference',label:'Rozstrzygnięcie referencyjne',valueType:'reference-status',referenceOnly:true});}
 }
 if(type.id==='EZLA'&&!/anulowan|uniewaznion/.test(text)){
  const first=page.items[0]||{x:0,y:0,width:100,height:15,text:'e-ZLA'};
  emit('sickness.certificate','yes',{...first,right:first.x+first.width},{scope:'person',label:'Dokument potwierdzający niezdolność',valueType:'certificate',target:'sickness.certificate',needsReview:true});
 }
 return {type,fields,unmapped,tableDetected:rows.some(r=>/miesiac|okres/.test(foldDocument(r.text))&&/brutto|sklad|wyplac|wynagrodz/.test(foldDocument(r.text))),warnings:type.id==='OTHER'?['Rodzaj dokumentu wymaga przypisania. Sprawdź wskazane informacje lub dodaj pola ręcznie.']:[],page:page.number};
}
