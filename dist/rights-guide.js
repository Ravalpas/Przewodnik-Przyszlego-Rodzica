const benefits='https://www.gov.pl/web/rodzina/wiadczenia-rodzinne',work='https://www.gov.pl/web/rodzina/uprawnienia-zwiazane-z-rodzicielstwem';
export const RIGHTS_GUIDE=[
 ['800+','ZUS','Wniosek i warunki świadczenia wychowawczego; oddzielny cykl wniosków. Nie jest zasiłkiem macierzyńskim.','https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus'],
 ['Aktywni rodzice w pracy','ZUS','Sprawdź wiek dziecka, aktywność zawodową i wymagane podstawy składek.','https://www.zus.pl/aktywnyrodzic/swiadczenie-aktywni-rodzice-w-pracy'],
 ['Aktywnie w żłobku','ZUS','Odrębny wariant związany z właściwą opieką instytucjonalną. Sprawdź placówkę i opłatę.','https://www.zus.pl/aktywnyrodzic'],
 ['Aktywnie w domu','ZUS','Odrębny wariant programu. Na to samo dziecko za ten sam miesiąc można otrzymać tylko jedno świadczenie z programu.','https://www.zus.pl/aktywnyrodzic'],
 ['Świadczenie rodzicielskie','Gmina / właściwy organ świadczeń rodzinnych','Ma własne warunki i terminy, także wyłączenia związane z pobieraniem macierzyńskiego. Nie jest jego podwyższeniem.','https://www.gov.pl/web/rodzina/wiadczenie-rodzicielskie'],
 ['Becikowe','Gmina / właściwy organ świadczeń rodzinnych','Sprawdź warunki dochodowe, opiekę medyczną oraz termin wniosku.',benefits],
 ['Jednorazowe świadczenie „Za życiem”','Gmina / właściwy organ świadczeń rodzinnych','Wymaga właściwego zaświadczenia i odrębnego wniosku. Nie oznacza automatycznego przyznania innych świadczeń.','https://www.gov.pl/web/rodzina'],
 ['Świadczenie pielęgnacyjne','Gmina / właściwy organ świadczeń rodzinnych','Sprawdź rodzaj orzeczenia, wskazania, wiek i właściwy reżim przepisów. To inne świadczenie niż opiekuńczy.',benefits],
 ['Zasiłek pielęgnacyjny','Gmina / właściwy organ świadczeń rodzinnych','Dotyczy innej podstawy niż świadczenie pielęgnacyjne. Nie łączymy ich nazw ani warunków.',benefits],
 ['Wsparcie pieczy zastępczej','PCPR / organizator pieczy','Forma pieczy i potrzeby dziecka wpływają na właściwą procedurę. Nie utożsamiamy tego wsparcia z macierzyńskim ZUS.','https://www.gov.pl/web/rodzina/piecza-zastepcza'],
 ['Urlop wychowawczy','Pracodawca','Sprawdź staż, wiek dziecka, wykorzystanie obojga rodziców oraz odrębne uprawnienia przy niepełnosprawności.',work],
 ['Zwolnienie na opiekę nad dzieckiem','Pracodawca','Odrębne uprawnienie pracownicze; nie pomniejsza się go jak zasiłku opiekuńczego z ZUS.',work],
 ['Urlop opiekuńczy','Pracodawca','Poważne względy medyczne i osobista opieka mają własne warunki. Nie jest zasiłkiem opiekuńczym.','https://www.gov.pl/web/rodzina/urlopy-i-zwolnienia-od-pracy'],
 ['Siła wyższa','Pracodawca','Pilna sprawa rodzinna z powodu choroby lub wypadku to osobne zwolnienie i odrębne zasady wynagrodzenia.','https://www.gov.pl/web/rodzina/urlopy-i-zwolnienia-od-pracy'],
 ['Karmienie i bezpieczna praca','Pracodawca','Sprawdź przerwy na karmienie oraz dostosowanie pracy w ciąży i podczas karmienia.',work],
 ['Ochrona zatrudnienia i powrót','Pracodawca / Państwowa Inspekcja Pracy','Ochrona ma ustawowe wyjątki. Powrót po urlopie, obniżenie etatu i elastyczna organizacja to odrębne procedury.',work]
].map(([title,institution,description,url])=>({title,institution,description,url,kind:'information',reviewedAt:'2026-11-22',automaticEligibility:false}));
export function rightsGuideHtml(){return `<section class="case-card rights-guide"><h2>Inne świadczenia i prawa pracownicze</h2><p>Nie wszystkie sprawy należą do ZUS. Poniższe informacje kierują do właściwej instytucji; nie stanowią automatycznej oceny prawa ani wyliczenia.</p><div class="case-card-grid">${RIGHTS_GUIDE.map(r=>`<details class="term-explanations"><summary>${r.title}</summary><p><strong>${r.institution}</strong></p><p>${r.description}</p><a href="${r.url}" target="_blank" rel="noopener noreferrer">Oficjalne informacje i warunki</a></details>`).join('')}</div></section>`;}
