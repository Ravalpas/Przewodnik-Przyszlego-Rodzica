const ZUS='https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/komu-przysluguje';
const KRO='https://eli.gov.pl/api/acts/DU/2026/236/text/I/D20260236.pdf';
const PIECZA='https://eli.gov.pl/api/acts/DU/2025/49/text/U/D20250049Lj.pdf';
export const TERMS={
 adoption:{title:'Adopcja (przysposobienie)',match:/adopc|przysposob/i,text:'Sąd ustanawia rodzicielstwo. To inny status niż piecza zastępcza. Przykład: po prawomocnym orzeczeniu osoba adoptująca jest rodzicem dziecka.',source:KRO},
 adoptive:{title:'Rodzic adopcyjny',match:/rodzic.{0,3}adopcyjn/i,text:'Osoba, która stała się rodzicem w wyniku prawomocnego przysposobienia. Przykład: mama adoptowanego dziecka jest jego mamą także prawnie.',source:KRO},
 foster:{title:'Rodzina zastępcza',match:/piecz|rodzin.{0,3}zastępcz/i,text:'Opiekuje się dzieckiem umieszczonym w pieczy zastępczej. Nie oznacza adopcji. Przykład: dziecko mieszka z rodziną zastępczą na podstawie orzeczenia sądu.',source:PIECZA},
 related:{title:'Rodzina zastępcza spokrewniona',match:/spokrewnion/i,text:'Tworzą ją wstępni, np. dziadkowie, lub rodzeństwo dziecka. Przykład: dziadkowie zostają rodziną zastępczą po formalnym ustanowieniu pieczy.',source:PIECZA},
 nonprofessional:{title:'Rodzina zastępcza niezawodowa',match:/niezawodow/i,text:'Forma pieczy pełniona niezawodowo. Przykład: ciocia albo niespokrewniona osoba przyjmuje dziecko do formalnie ustanowionej rodziny niezawodowej.',source:PIECZA},
 professional:{title:'Rodzina zastępcza zawodowa',match:/(?<!nie)zawodow/i,text:'Pełni funkcję zawodowo, na podstawie odpowiedniej umowy. Przykład: rodzina wykonuje zadania pieczy jako rodzina zawodowa. Uprawnienia ZUS sprawdzamy oddzielnie.',source:PIECZA},
 home:{title:'Rodzinny dom dziecka',match:/rodzinn.{0,3}dom.{0,3}dziecka/i,text:'Odrębna forma rodzinnej pieczy zastępczej. Przykład: prowadzący dom opiekuje się umieszczoną tam grupą dzieci. Nie jest to adopcja.',source:PIECZA},
 guardian:{title:'Opiekun prawny',match:/opiekun.{0,3}prawn|opieka prawn/i,text:'Osoba ustanowiona przez sąd. Przykład: sąd powierza cioci opiekę prawną. Pomaganie w opiece samo w sobie nie nadaje takiego statusu. Opiekun prawny i rodzic zastępczy to różne statusy; czasem dotyczą tej samej osoby.',source:KRO},
 family:{title:'Członek rodziny pomagający w opiece',match:/człon.*rodzin|pomaga.*opiece/i,text:'Bliska osoba pomagająca dziecku i rodzicom. Przykład: babcia odbiera wnuka ze szkoły. Sama pomoc nie oznacza opieki prawnej ani pieczy zastępczej.',source:KRO},
 insurance:{title:'Ubezpieczenie chorobowe',match:/chorobow|ubezpieczeni/i,text:'Ubezpieczenie społeczne istotne dla prawa do zasiłków. Przykład: na zleceniu może wymagać dobrowolnego zgłoszenia. Nie jest ubezpieczeniem zdrowotnym NFZ.',source:ZUS},
 leave:{title:'Urlop macierzyński',match:/urlop.{0,3}macierzyńsk/i,text:'Uprawnienie pracownicze związane z narodzinami. Przykład: pracownica korzysta z urlopu po porodzie. Osoba prowadząca firmę może mieć zasiłek, ale nie urlop pracowniczy.',source:ZUS},
 maternity:{title:'Zasiłek macierzyński',match:/zasił.{0,5}macierzyńsk/i,text:'Świadczenie pieniężne po spełnieniu ustawowych warunków. Przykład: ubezpieczona osoba otrzymuje wypłatę po porodzie. Sama rola rodzica nie potwierdza prawa.',source:ZUS},
 basis:{title:'Podstawa wymiaru zasiłku',match:/podstaw.{0,6}wymiar|podstawa świadczenia/i,text:'Kwota służąca do obliczenia zasiłku. Przykład: płatnik ustala ją z odpowiedniego wynagrodzenia i potrąceń. Nie jest pensją netto ani dowolną podstawą składek.',source:'https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru'},
 rehab:{title:'Świadczenie rehabilitacyjne',match:/rehabilitacyjn/i,text:'Możliwe po wyczerpaniu zasiłku chorobowego, jeśli dalsze leczenie rokuje odzyskanie zdolności do pracy. Przykład: ZUS przyznaje je na podstawie orzeczenia.',source:'https://www.zus.pl/swiadczenia/zasilki/swiadczenie-rehabilitacyjne'},
 life:{title:'Zaświadczenie „Za życiem”',match:/Za życiem/i,text:'Szczególne zaświadczenie przewidziane ustawą. Przykład: potwierdza właściwe ustawowe okoliczności zdrowotne dziecka. Nie zastępuje go każde orzeczenie o niepełnosprawności.',source:ZUS}
};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const termButton=id=>`<button type="button" class="term-info" data-term="${id}" aria-label="Wyjaśnienie: ${escape(TERMS[id].title)}">i</button>`;
export function explanationsHtml(ids){return `<details class="term-explanations"><summary>Nie wiesz, co oznaczają te pojęcia? Sprawdź wyjaśnienia.</summary><dl>${[...new Set(ids)].filter(id=>TERMS[id]).map(id=>`<div><dt>${TERMS[id].title} ${termButton(id)}</dt><dd>${TERMS[id].text}</dd></div>`).join('')}</dl></details>`;}
export function showTerm(id){const term=TERMS[id];if(!term)return;let dialog=document.getElementById('term-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='term-dialog';dialog.setAttribute('aria-labelledby','term-dialog-title');dialog.className='term-dialog';document.body.append(dialog);}dialog.innerHTML=`<h2 id="term-dialog-title">${term.title}</h2><p>${term.text}</p><a href="${term.source}" target="_blank" rel="noopener noreferrer">Oficjalne źródło</a><button class="secondary" type="button">Zamknij wyjaśnienie</button>`;dialog.querySelector('button').onclick=()=>dialog.close();if(!dialog.open)dialog.showModal();}
export function bindTerms(root){if(root.dataset.termsBound)return;root.dataset.termsBound='true';root.addEventListener('click',e=>{const button=e.target.closest('[data-term]');if(button&&root.contains(button)){e.preventDefault();e.stopPropagation();showTerm(button.dataset.term);}});}
export function enhanceTerms(root){
 if(!root)return;bindTerms(root);
 root.querySelectorAll('[data-term-auto]').forEach(button=>button.remove());
 root.querySelectorAll('.term-explanations .term-info').forEach(button=>button.remove());
 const descriptions=new Set();root.querySelectorAll('.term-explanations dl>div').forEach(item=>{const key=item.querySelector('dt')?.textContent.trim();if(descriptions.has(key))item.remove();else descriptions.add(key);});
 root.querySelectorAll('.term-explanations').forEach(block=>{if(!block.querySelector('dt'))block.remove();});
 const seen=new Set();root.querySelectorAll('[data-term]').forEach(button=>{if(seen.has(button.dataset.term))button.remove();else seen.add(button.dataset.term);});
 for(const target of root.querySelectorAll('.calc-field>span,.calc-check>span,legend,.event-detail>p')){
  if(target.closest('.term-explanations')||target.querySelector('.term-info'))continue;
  const match=Object.entries(TERMS).find(([id,term])=>!seen.has(id)&&term.match.test(target.textContent));
  if(match){seen.add(match[0]);target.insertAdjacentHTML('beforeend',' '+termButton(match[0]));target.lastElementChild.dataset.termAuto='true';}
 }
}
