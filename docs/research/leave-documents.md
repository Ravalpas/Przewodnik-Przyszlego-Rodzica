# Mapa urlopów i dokumentów dla zintegrowanego kalkulatora

Stan badania: 21 listopada 2026 r. Raport badawczy; nie stanowi samodzielnego kompletnego silnika prawa historycznego.

Przeczytano pełne teksty wszystkich przydzielonych materiałów: **Kodeks pracy – strony 1–10/10**, rozporządzenie wnioskowe – **1–11/11**, rozporządzenie zasiłkowe – **1–16/16**, wraz z załącznikami. Nie pominięto stron ani przepisów spoza głównego scenariusza. Podstawą odczytu były kompletne ekstrakty UTF-8 w `aplikacja/artifacts/material-analysis`. W ramach badania nie edytowano kodu ani katalogów źródłowych.

Poniższa mapa pochodzi przede wszystkim z dostarczonych tekstów; status aktów i aktualność formularzy zweryfikowano w źródłach urzędowych.

## Akty i stan prawny

- Kodeks: tekst jednolity Dz.U. 2026 poz. 1245, stan prawny wskazany w metryce ISAP na 27.08.2026; publikacja 24.09.2026. [Dziennik Ustaw](https://www.dziennikustaw.gov.pl/DU/2026/1245).
- Wnioski pracownicze: rozporządzenie 11.03.2025, Dz.U. 2025 poz. 322, obowiązuje od 19.03.2025. [Dziennik Ustaw](https://www.dziennikustaw.gov.pl/DU/2025/322).
- Dokumenty zasiłkowe: rozporządzenie 27.09.2026, Dz.U. 2026 poz. 1316, ogłoszone 09.10.2026, obowiązuje od 24.10.2026, z odroczonym wejściem §39. [ELI](https://eli.gov.pl/eli/DU/2026/1316/ogl), [urzędowy PDF](https://eli.gov.pl/api/acts/DU/2026/1316/text/I/D20261316.pdf).

## Aktualność formularzy

Oficjalny wykaz ZUS potwierdza: od **24.10.2026** ZUR i ZAO zastępuje ZAM, a Z-3b przestał być wymagany. Nie usuwać Z-3 ani Z-3a: pozostają odpowiednie zaświadczenia płatnika dla pracowników i pozostałych odpowiednich ubezpieczonych. [Wykaz ZUS](https://www.zus.pl/wzory-formularzy/zasilki/zasilek-macierzynski/-/asset_publisher/m5npg4iczlfp/content/o%C5%9Bwiadczenie-zpo).

Istnieje jednak **aktualizacja z 20.11.2026**, czyli z dnia poprzedzającego datę środowiska: ZUS tymczasowo przywrócił Z-3b w eZUS, wyłącznie w katalogu usług roli Płatnik, aby pełnomocnicy posiadający tylko tę rolę mogli wnioskować o zasiłek chorobowy klientów. Ma to trwać do udostępnienia ZAS-53 na profilu płatnika. To techniczne udostępnienie formularza, nie przywrócenie obowiązku jego dołączania do macierzyńskiego. Materiały mówiące bezwarunkowo „Z-3b już nie istnieje / został definitywnie wyłączony” trzeba doprecyzować. [Komunikat ZUS, 20.11.2026](https://www.zus.pl/en/-/tymczasowe-przywr%C3%B3cenie-formularza-z-3b-na-profilu-p%C5%82atnika-w-zwi%C4%85zku-z-ograniczeniami-na-ezus-dla-pe%C5%82nomocnik%C3%B3w?redirect=%2Fen%2Fo-zus%2Faktualnosci).

Pełny komunikat został odnaleziony przez wyszukiwarkę w domenie ZUS; próby bezpośredniego ponownego otwarcia tego konkretnego adresu kończyły się błędem dostępności narzędzia. Oficjalny wykaz formularzy oraz metrykę rozporządzenia otwarto bezpośrednio.

## Model danych kalkulatora

Potrzebne są:

- rodzaj zdarzenia: poród / przyjęcie i wszczęcie przysposobienia / niezawodowa albo spokrewniona rodzina zastępcza / zawodowa rodzina zastępcza;
- dla każdego dziecka: data urodzenia, data przyjęcia, data wniosku adopcyjnego, data prawomocności przysposobienia, odroczenie obowiązku szkolnego, zaświadczenie „Za życiem”, ewentualna data zgonu;
- liczba dzieci przy jednym porodzie / jednoczesnym przyjęciu, liczba pozostających przy życiu;
- przewidywana i rzeczywista data porodu; prenatalnie wykorzystane dni macierzyńskiego;
- status każdego rodzica: pracownik / inny ubezpieczony / brak tytułu; okresy zatrudnienia i ubezpieczenia, wymiar pierwotnego etatu;
- segmenty wykorzystanych urlopów i odpowiadających im zasiłków **obu rodziców**, ich liczba wniosków/części, procent świadczenia, płatnicy;
- oddzielne pule macierzyńskiego, uzupełniającego, rodzicielskiego i ojcowskiego;
- hospitalizacje każdego dziecka jako lista przedziałów, kategoria ciążowa z zaświadczenia, masa urodzeniowa;
- szczególne zdarzenia: zgon/porzucenie przez matkę, niezdolność do samodzielnej egzystencji, pobyt matki w placówce, podjęcie zatrudnienia przez wcześniej nieubezpieczoną matkę;
- segmenty łączenia rodzicielskiego z pracą, osobno w części pierwotnej i wydłużonej.

Operować na dniach kalendarzowych; tydzień to 7 dni. Dla zwykłego segmentu `endInclusive = start + days − 1`. Wspólna pula rodzicielska wymaga sumowania osobodni obu rodziców, również podczas jednoczesnego korzystania. Należy rozróżniać zużycie pierwotnej puli od wydłużenia za pracę.

## Macierzyński – art. 180 i 183¹

| Dzieci przy jednym porodzie | Tygodnie | Dni |
|---|---:|---:|
| 1 | 20 | 140 |
| 2 | 31 | 217 |
| 3 | 33 | 231 |
| 4 | 35 | 245 |
| ≥5 | 37 | 259 |

- Przed przewidywaną datą porodu można wykorzystać maksymalnie 6 tygodni / 42 dni.
- Jeśli brak części przedporodowej, pierwszy dzień to dzień porodu.
- Część przedporodowa zmniejsza pozostały wymiar po porodzie.
- Zwykła rezygnacja matki i przekazanie ojcu dopiero po wykorzystaniu **co najmniej 14 tygodni po porodzie**, nie 14 tygodni łącznie z prenatalnym.
- Pozostałość przejmuje pracownik–ojciec wychowujący dziecko albo ubezpieczony ojciec, który przerywa działalność zarobkową dla osobistej opieki.
- Łączny urlop i równoważne okresy zasiłku rodziców w przypadkach przejęcia nie mogą przekroczyć podstawowego wymiaru.
- Rezygnacja pracownicy: minimum 7 dni przed powrotem. Wniosek pracownika przejmującego zwykłą pozostałość: minimum 14 dni przed rozpoczęciem.

## Szczególne sytuacje matki – art. 180 §6–17

| Zdarzenie | Najwcześniejszy moment / warunek | Uprawniony |
|---|---|---|
| Orzeczona niezdolność matki do samodzielnej egzystencji | po minimum 8 tygodniach po porodzie | ojciec lub inny najbliższy członek rodziny, pracownik albo odpowiedni ubezpieczony przerywający aktywność |
| Pobyt matki w szpitalu/całodobowej placówce i brak możliwości osobistej opieki | po minimum 8 tygodniach po porodzie, na czas pobytu | ojciec lub inny najbliższy członek rodziny |
| Zgon pracownicy/ubezpieczonej matki w okresie macierzyńskiego | pozostałość przypadająca **po dniu zgonu**, bez wymogu wcześniejszych 8 tygodni | ojciec albo inny najbliższy członek rodziny |
| Porzucenie przez pracownicę/ubezpieczoną matkę | po dniu porzucenia, najwcześniej po wykorzystaniu przez matkę 8 tygodni po porodzie | ojciec albo inny najbliższy członek rodziny |
| Zgon, porzucenie albo niezdolność do samodzielnej egzystencji matki nieubezpieczonej/bez tytułu | część przypadająca po odpowiednim zdarzeniu; przepis nie nakłada tu progu 8 tygodni | ojciec albo inny najbliższy członek rodziny |
| Matka bez tytułu podejmuje zatrudnienie ≥1/2 pełnego etatu | od podjęcia zatrudnienia, wyłącznie podczas jego trwania, do wyczerpania macierzyńskiego | pracownik–ojciec; odpowiednik zasiłkowy w rozporządzeniu |

Dla nagłych przejęć z art. 180 §16 ustawa przewiduje wniosek, ale nie 14-dniowe wyprzedzenie. Nie stosować automatycznie terminu ze zwykłego przejęcia. Przy niezdolności do samodzielnej egzystencji, zwykłej rezygnacji po 8 tygodniach, obowiązują terminy 7/14 dni wynikające z §8–9.

Przepisy o tych sytuacjach stosuje się odpowiednio także do rodzicielskiego i uzupełniającego w zakresie odesłań. Nie sprowadzać jednak każdego zdarzenia do identycznego przepływu dokumentów.

## Hospitalizacja dziecka i strata – art. 180¹, 181, 182

- Dziecko wymagające szpitala: po 8 tygodniach macierzyńskiego po porodzie matka może przerwać pozostałość i wykorzystać ją po wyjściu dziecka ze szpitala. To **przesunięcie istniejącej puli**, odrębne od dodatkowego urlopu uzupełniającego.
- Martwe urodzenie lub zgon przed upływem 8 tygodni życia: 8 tygodni macierzyńskiego po porodzie, nie krócej niż 7 dni od zgonu.
- Zgon po upływie 8 tygodni życia: zachowanie prawa przez 7 dni od zgonu.
- Przy porodzie mnogim uwzględnia się liczbę dzieci pozostających przy życiu; po późniejszym zgonie obowiązuje również minimum 7 dni od zgonu.
- Porzucenie przez pracownicę lub sądowe umieszczenie dziecka w pieczy/odpowiednim zakładzie: brak dalszej części po zdarzeniu, jednak macierzyński po porodzie nie krótszy niż 8 tygodni.
- W zakresie zasiłku nowe rozporządzenie dopuszcza po martwym urodzeniu, gdy nie ma aktu urodzenia, zaświadczenie ginekologa, lekarza w trakcie tej specjalizacji lub położnej, wystawione na podstawie dokumentacji medycznej, **bez względu na czas trwania ciąży**. Nie blokować wyniku wyłącznie pytaniem o ustaloną płeć lub akt urodzenia.

**Nierozstrzygnięta szczegółowa konwencja daty:** w ramach tego badania nie odnaleziono oficjalnego przykładu, który jednoznacznie wyjaśniałby wliczanie samego dnia zgonu do ustawowych „7 dni od dnia zgonu”. Nie potwierdzono zatem na podstawie oficjalnego objaśnienia wariantu `deathDate + 6` ani `deathDate + 7`. Nie należy przedstawiać samej ogólnej konwencji segmentów `start + days − 1` jako rozstrzygnięcia tego szczególnego terminu. Przekazanie macierzyńskiego po śmierci matki ma natomiast wyraźne ustawowe sformułowanie **po dniu zgonu**.

## Uzupełniający macierzyński – art. 180²

| Kategoria | Okno hospitalizacji uwzględniane w obliczeniu | Wymiar |
|---|---|---|
| Przed ukończeniem 28. tygodnia ciąży **lub** masa ≤1000 g | do upływu 15. tygodnia po porodzie | tydzień za każdy tydzień pobytu; maks. 15 tyg. |
| Po ukończeniu 28. i przed ukończeniem 37. tygodnia **oraz** masa >1000 g | do upływu 8. tygodnia po porodzie | maks. 8 tyg. |
| Po ukończeniu 37. tygodnia | od 5. dnia do upływu 8. tygodnia po porodzie | maks. 8 tyg.; warunek poniżej |

W ostatniej kategorii potrzebny jest pobyt co najmniej **2 kolejnych dni**, którego pierwszy dzień przypada od **5. do 28. dnia po porodzie**. Nie wystarcza dowolna hospitalizacja do końca ósmego tygodnia.

Algorytm po potwierdzeniu kategorii:

1. Przyciąć pobyty do ustawowego okna.
2. Połączyć nakładające się przedziały, aby nie podwoić dni.
3. Zsumować kwalifikujące dni wszystkich pobytów.
4. `supplementWeeks = ceil(qualifyingHospitalDays / 7)`.
5. `supplementDays = 7 × supplementWeeks`.

Zaokrąglamy dopiero **sumę**, nie każdy pobyt osobno.

Przy wieloraczkach brać **najniższą masę urodzeniową** i pobyt **dziecka najdłużej hospitalizowanego**. Nie sumować pobytów różnych dzieci w jedną sztucznie większą pulę.

Urlop:

- przysługuje matce albo ojcu wychowującemu;
- bezpośrednio po macierzyńskim;
- jeden wniosek, jedna część; zwykłego podziału między rodzicami brak;
- pracownik: minimum 21 dni **przed zakończeniem macierzyńskiego**;
- niepracownik: wniosek o odpowiedni zasiłek przed zakończeniem okresu macierzyńskiego / na warunkach;
- przejście najpierw na rodzicielski wyklucza późniejsze zwykłe ubieganie się o uzupełniający;
- przy adopcji/pieczy hospitalizacja musi przypadać po przyjęciu dziecka, przy zachowaniu pozostałych zasad.

W interfejsie najlepiej przyjmować kategorię ciąży zgodną z zaświadczeniem, obok tygodni+dni, zamiast uzależniać kwalifikację od potocznego „w 28. tygodniu”. Dla dat granicznych trzeba utrzymać literalne rozróżnienie „przed ukończeniem / po ukończeniu” oraz jasno opisać sposób numerowania dni po porodzie.

## Rodzicielski – art. 182¹a–d

| Sytuacja | Zwykły wymiar wspólny | Z zaświadczeniem „Za życiem” |
|---|---:|---:|
| Jedno dziecko | 41 tyg. / 287 dni | 65 tyg. / 455 dni |
| ≥2 przy jednym porodzie / jednoczesnym przyjęciu | 43 tyg. / 301 dni | 67 tyg. / 469 dni |
| Przyjęcie: szczególny wariant 9 tygodni na warunkach macierzyńskiego, art.183 §3 | 38 tyg. / 266 dni | 62 tyg. / 434 dni |

- Wymiar wspólny obojgu rodzicom.
- Każdy ma 9 tygodni / 63 dni wyłącznie dla siebie, nieprzenoszalne.
- Te 9 tygodni **zawiera się** w 41/43/65/67, nie jest dodawane do nich.
- Dla jednego rodzica zwykłe maksimum wynosi `pool − 63 dni`, np. 32 tygodnie przy jednym dziecku.
- Nie tworzyć wyjątku przenoszącego 9 tygodni tylko dlatego, że drugi rodzic jest nieubezpieczony albo nie chce korzystać. W dostarczonym Kodeksie brak takiej ogólnej reguły.
- Możliwe jednoczesne korzystanie. Tydzień obojga zużywa dwa tygodnie wspólnej puli.
- Maksymalnie 5 części; ustalane według liczby wniosków, z uwzględnieniem odpowiednich wniosków zasiłkowych obojga rodziców.
- Brak obecnego wymogu minimalnej 8-tygodniowej części i brak wymogu bezpośredniej ciągłości z macierzyńskim.
- Dziecko biologiczne: zakończenie najpóźniej 31 grudnia roku, w którym kończy 6 lat.
- Przyjęcie na wychowanie: ZUS wskazuje zakończenie do ukończenia odpowiednio 7 / 10 / 14 lat. Nie nakładać tu bezrefleksyjnie granicy końca roku sześciolatka. [ZUS – rodzicielski](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-rodzicielskiego).
- Pracownik: wniosek minimum 21 dni przed rozpoczęciem.
- Niepracownik i uprawniony po ustaniu tytułu: przed rozpoczęciem odpowiedniego zasiłku.
- Rezygnacja pracownika w każdym czasie za zgodą pracodawcy; niepracownik składa wniosek o rezygnację podczas pobierania. Niewykorzystana pozostałość nie znika, o ile można ją wykorzystać w granicach wieku i liczby części.

## Łączenie rodzicielskiego z pracą – dokładny wzór

Podstawa: art. 182¹e–f. Praca u pracodawcy udzielającego urlopu, maksymalnie **1/2 pełnego etatu**.

Niech:

- `t` = liczba dni pierwotnej części, podczas których łączono urlop z pracą;
- `p` = wymiar wykonywanej w tym czasie pracy jako ułamek **pełnego etatu**, np. 0,5 albo 0,25;
- `q` = ułamek pełnego etatu wykonywany podczas powstałego wydłużenia.

Wtedy:

```text
pierwotne wydłużenie E = t × p

bez pracy podczas wydłużenia:
extraDays = floor(E)

z pracą podczas wydłużenia:
extraDays = floor(E / (1 − q))
```

Przy kilku segmentach pierwotnych stosować osobne iloczyny odpowiadające rzeczywistym okresom i wymiarom. Wydłużenie dołącza się do części, w której następowało łączenie, nie tworzy samodzielnej dodatkowej części z puli pięciu. Niepełny dzień **pomija się**, nie zaokrągla w górę.

Przykłady:

- 32 tygodnie na 1/2 etatu, bez pracy w wydłużeniu: `32 × 0,5 = 16 tygodni` ekstra, razem 48.
- To samo, również na 1/2 etatu w wydłużeniu: `16 / 0,5 = 32 tygodnie` ekstra, razem 64.
- Pierwotne zatrudnienie na 1/2 etatu, praca podczas urlopu na 1/4: wydłużenie nadal `32 × 0,25 = 8 tygodni`, **nie 16**.

Limity ustawowe przy wydłużeniu: 82 / 86 tygodni; z „Za życiem” 130 / 134. Wariant 38/62 również rozliczać według faktycznej puli i wzoru, a nie automatycznie przyznawać maksymalny limit 82/130.

**Kwota zasiłku podczas pracy to osobna proporcja:** przy pierwotnym etacie `u`, zmniejszenie jest proporcjonalne do `p/u`. ZUS podaje przykład pierwotnego 1/2 etatu i pracy 1/4: kwota zmniejszona o połowę, ale wydłużenie 32 tygodni wynosi 8 tygodni. Źródło pomocnicze urzędowe: [komentarz ZUS, przykład na stronie 38](https://www.zus.pl/documents/10182/24202/Komentarz%2Bdo%2Bustawy%2Bo%2B%C5%9Bwiadczeniach%2Bpieni%C4%99%C5%BCnych%2Bz%2Bubezpieczenia%2Bspo%C5%82ecznego%2Bw%2Brazie%2Bchoroby%2Bi%2Bmacierzy%C5%84stwa%2B2023.pdf/7a31a278-8c06-cee4-3542-1d5bb8b36ad6).

Wniosek o łączenie: minimum 21 dni przed pracą; pracodawca może odmówić z uwagi na organizację/rodzaj pracy, podając przyczynę papierowo albo elektronicznie w ciągu 7 dni od otrzymania. Wniosek musi zawierać także sposób wykorzystania wydłużenia i zamiar pracy w nim.

## Ojcowski – art. 182³

- 2 tygodnie / 14 dni, niezależna pula od rodzicielskiego i przejętego macierzyńskiego.
- Jednorazowo albo w maksymalnie 2 częściach po minimum tydzień.
- Dziecko biologiczne: do ukończenia 12 miesięcy.
- Przysposobione: do upływu 12 miesięcy od prawomocności przysposobienia i nie dłużej niż do ukończenia 14 lat.
- Wniosek pracowniczy minimum 7 dni przed rozpoczęciem.
- Niepracownik: zasiłkowy wniosek przed rozpoczęciem korzystania.
- Nie przeliczać 12 miesięcy na stałe 365 dni.
- Sądowe powierzenie pieczy zastępczej samo w sobie nie jest prawomocnym przysposobieniem uruchamiającym tę adopcyjną przesłankę.

## Adopcja i rodzina zastępcza – art. 183

- Rodzina zastępcza zawodowa wyłączona z tego uprawnienia pracowniczego.
- Przyjęcie do niezawodowej/spokrewnionej rodziny zastępczej: na warunkach macierzyńskiego 20/31/33/35/37 tygodni, do ukończenia 7 lat; przy odroczeniu obowiązku szkolnego do 10 lat.
- Przyjęcie i wystąpienie do sądu o przysposobienie: te same podstawowe wymiary, do ukończenia 14 lat.
- Art.183 §3 gwarantuje szczególny **minimalny wymiar 9 tygodni** przy przyjęciu w ustawowym wieku; nie należy zamieniać tego automatycznie w zasadę „każda adopcja ma tylko 9 tygodni”. [Wyjaśnienie PIP](https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo).
- Zwykły wymiar wyznacza liczba **jednocześnie** przyjętych dzieci.
- Rodzicielski 41/43, a w szczególnym wariancie §3 – 38; „Za życiem” odpowiednio 65/67/62.
- Zwykłe zasady wspólnej puli, 9 tygodni nieprzenoszalnych i pięciu części obowiązują odpowiednio.
- Wniosek o na warunkach: w ciągu 7 dni od przyjęcia do rodziny zastępczej albo od spełnienia obu warunków przyjęcia i wystąpienia do sądu.
- Początek zgodny z wnioskiem, najpóźniej w ciągu 21 dni od odpowiedniego zdarzenia.
- Po pieczy zastępczej późniejsze wystąpienie o adopcję **nie resetuje puli**: od nowego wymiaru odejmuje się wykorzystany na to dziecko urlop na warunkach, a od rodzicielskiego dotychczas wykorzystany rodzicielski.
- Przy dziecku przyjmowanym blisko granicy wieku zachować odrębny wariant 9-tygodniowej gwarancji i 38/62 rodzicielskiego; nie wystarcza samo `min(fullDuration, daysUntilBirthday)`.

## Dokumenty pracownicze – rozporządzenie 2025 poz.322

Wszystkie właściwe wnioski papierowe albo elektroniczne. Dokumentów już znajdujących się w aktach osobowych nie dołącza się ponownie; przy kopii pracodawca może żądać oryginału do potwierdzenia.

Wspólne moduły dokumentów:

- `BIRTH`: skrócony akt urodzenia albo zagraniczny dokument rejestracyjny, także kopia.
- `ADOPTION`: oświadczenie o dacie przyjęcia + kopia wniosku adopcyjnego z potwierdzeniem daty przez sąd albo zaświadczenie sądu z datą wystąpienia i datą urodzenia.
- `FOSTER`: kopia prawomocnego orzeczenia o umieszczeniu albo umowy ze starostą.
- `SCHOOL_DELAY`: kopia prawomocnej decyzji o odroczeniu.
- `LIFE`: kopia zaświadczenia „Za życiem”.
- `HOSPITAL_CHILD`: zaświadczenie szpitala z hospitalizacjami i kategorią art.180² §5.

Przepływy:

| Wniosek | Treść / dodatkowe dokumenty |
|---|---|
| Macierzyński przed porodem (§2) | imię/nazwisko, początek, kopia zaświadczenia o przewidywanym porodzie |
| Rezygnacja po 14 tyg. (§3) | termin powrotu + kopia wniosku ojca albo jego oświadczenia o przerwaniu działalności |
| Rezygnacja z niezdolnością po 8 tyg. (§4) | jak wyżej dla ojca/rodziny + kopia prawomocnego orzeczenia |
| Przejęcie zwykłej pozostałości (§5) | dane dziecka, okres przedporodowy, okres przejęcia, `BIRTH`, oświadczenie matki o rezygnacji |
| Przejęcie na czas szpitala matki (§6–7) | data przerwania, okres przedporodowy, zobowiązanie informowania o wypisie, oświadczenie matki, zaświadczenie o przyjęciu, `BIRTH` |
| Zgon matki (§8/10) | oświadczenie z datą zgonu, data przejęcia, `BIRTH`; dla uprzednio ubezpieczonej także wcześniejsze wykorzystanie |
| Porzucenie (§9/11) | analogicznie oświadczenie o porzuceniu; właściwy próg 8 tygodni zależny od statusu matki |
| Nieubezpieczona matka niezdolna (§12) | `BIRTH`, kopia prawomocnego orzeczenia |
| Podjęcie zatrudnienia matki (§13) | `BIRTH`, oświadczenie matki o dacie i wymiarze ≥1/2, zobowiązanie informowania o ustaniu zatrudnienia |
| Uzupełniający (§14) | koniec macierzyńskiego, wnioskowany okres, `HOSPITAL_CHILD`, oświadczenie o braku korzystania przez drugiego rodzica |
| Rodzicielski (§15) | wykorzystane okresy i liczba części/wniosków, nowy okres, `BIRTH`, oświadczenie o równoległym korzystaniu drugiego rodzica lub jego braku, `LIFE` gdy właściwe |
| Łączenie z pracą (§16) | wymiar pracy, okres, zamiar i wymiar pracy w wydłużeniu |
| Ojcowski (§17) | okres, `BIRTH`, przy przysposobieniu prawomocne postanowienie, oświadczenie o wcześniejszym wykorzystaniu |
| Na warunkach (§18) | dane i daty urodzenia dzieci, okres, `ADOPTION`/`FOSTER`, `SCHOOL_DELAY` gdy właściwe |

Przy przejęciach odpowiednio dotyczących adopcji, pieczy i rodzicielskiego dołączane są moduły przyjęcia oraz ewentualne odroczenie, zgodnie z odesłaniami §5–13.

Dokument zagraniczny: zasadniczo tłumaczenie polskie; wyjątek dla dokumentu z UE/EFTA–EOG/Szwajcarii/państwa umowy o zabezpieczeniu społecznym, wystawionego w języku urzędowym tego państwa. To lista z rozporządzenia pracowniczego; nie kopiować automatycznie innej listy z rozporządzenia zasiłkowego.

## Dokumenty zasiłkowe – rozporządzenie 2026 poz.1316

Rozdzielić ustalenie urlopu przez pracodawcę od przyznania/wypłaty świadczenia.

- §12: dokument z danymi załącznika 6, operacyjnie ZAM, albo odpowiednie zaświadczenie płatnika.
- §3: gdy wypłaca ZUS, pracownik – zakres załącznika 2/Z-3; inni właściwi ubezpieczeni – załącznik 3/Z-3a. Przedsiębiorcy/współpracujący/duchowni/marynarze są z tej drugiej grupy wyłączeni.
- §13: do ZUS nie trzeba rutynowo dostarczać polskiego aktu urodzenia. Przekazuje się dane dziecka i rodzica; ZUS pozyskuje akt z rejestru.
- Gdy ZUS nie może pozyskać aktu, wezwanie do dostarczenia z terminem **co najmniej 14 dni od otrzymania**, z pouczeniem o odmowie wszczęcia przy braku.
- Gdy płaci pracodawca, nie przenosić na niego automatycznie wyjątku rejestrowego dla ZUS.

Dane załącznika 6 obejmują m.in. identyfikację płatnika i ubezpieczonego, dziecka i właściwego drugiego rodzica/rodziny, rodzaj zdarzenia i okres świadczenia, „Za życiem”, spodziewany poród, szczególne okoliczności pracodawcy i matki, hospitalizację, korzystanie drugiego rodzica, informację o pełnym wymiarze i dniu rodzicielskiego w pierwszym roku życia, części, rachunek, datę i podpis. W praktyce generator podpowiedzi powinien pokazać ZAM, nie generować własnego nieweryfikowanego zamiennika formularza.

Dodatkowe zestawy:

| Przepis / sytuacja | Dokumenty |
|---|---|
| §13–14 poród | przewidywana data przed porodem; po porodzie akt/dane rejestrowe lub właściwe zaświadczenie o martwym urodzeniu; zagraniczne odpowiedniki |
| §15 poród po ustaniu ubezpieczenia | ciąża podczas zatrudnienia + dokument śmierci/upadłości/likwidacji pracodawcy albo prawomocne orzeczenie o bezprawnym rozwiązaniu; dokumenty urodzenia |
| §16 adopcja/piecza | oświadczenie daty przyjęcia + zaświadczenie/kopia wniosku sądowego; dla pieczy orzeczenie prawomocne **albo zabezpieczające** lub umowa, dokument wieku, odroczenie |
| §18 rezygnacja matki | oświadczenie o początku uprawnienia ojca; jeśli ZUS płaci pracownicy – zaświadczenie pracodawcy o końcu urlopu; niepracownica – wniosek rezygnacji |
| §20 przejęcie przez ojca | dokument/dane urodzenia + zaświadczenie płatnika o okresie przysługującego i wypłaconego matce zasiłku i stawce, z identyfikacją matki |
| §20 śmierć/porzucenie | dodatkowo właściwe oświadczenie; przy matce nieubezpieczonej brak zaświadczenia o wypłatach matki |
| §21–22 niezdolność matki | orzeczenie niezdolności; przy matce ubezpieczonej właściwe dokumenty przekazania i wcześniejszej wypłaty |
| §23–24 szpital matki | przyjęcie i wypis, wcześniejsze świadczenia i stawka; oświadczenie o przejęciu; przy wznowieniu matki zaświadczenie płatnika o okresie wypłaconym przejmującemu |
| §25 zatrudnienie wcześniej nieubezpieczonej matki | jej data i wymiar zatrudnienia, PESEL/dokument, nazwa i NIP pracodawcy, data początku uprawnienia ojca, zobowiązanie informowania o ustaniu |
| §26 uzupełniający, ten sam rodzic | brak korzystania drugiego, szpital dziecka, zaświadczenie pracodawcy o urlopie przy wypłacie przez ZUS albo terminowy wniosek niepracownika |
| §27 uzupełniający, inny rodzic | jak §26 + zaświadczenie poprzedniego płatnika o okresie drugiego rodzica + dokument/dane urodzenia albo adopcja/piecza |
| §28 podwyższenie do świadczenia rodzicielskiego | oświadczenie o tytułach i wskazaniu płatnika podwyższenia, niepobieraniu go z innego tytułu; zaświadczenia pozostałych płatników |
| §29 rodzicielski, ten sam rodzic | oświadczenie o drugim rodzicu, udzielonym urlopie i pracy/wydłużeniu, historia okresów/części/stawek oraz NIP i nazwy płatników; terminowy wniosek niepracownika |
| §30 rodzicielski, inny rodzic | dokumenty historii drugiego rodzica, pracy/wydłużenia, oświadczenia, dokument/dane urodzenia albo adopcja/piecza i odroczenie |
| §31 rezygnacja z rodzicielskiego | zaświadczenie pracodawcy przy ZUS albo wniosek niepracownika podczas pobierania; dotyczy też ojca |
| §32 ojciec, matka bez tytułu | urodzenie/adopcja/piecza, oświadczenie o braku tytułu matki z jej danymi, informacje o pracy i wydłużeniu / wniosek niepracownika |
| §33 ojcowski | urodzenie albo prawomocna adopcja, oświadczenie o pobraniu z innego tytułu, uprzedni wniosek niepracownika |

Ważna różnica: pracownicze rozporządzenie dla pieczy mówi o kopii prawomocnego orzeczenia; zasiłkowe wprost akceptuje również orzeczenie w trybie zabezpieczenia. Nie scalać obu check-list w jedną bez oznaczenia adresata.

§39 dopuszczający określone zaświadczenia lekarskie w nowym systemie teleinformatycznym ZUS ma odroczone wejście o 12 miesięcy od ogłoszenia; **nie przedstawiać tej przyszłej ścieżki jako już obowiązującej 21.11.2026**.

## Pozostałe odczytane przepisy i granice tego raportu

- Kodeks art.92: wynagrodzenie chorobowe 33 dni, a po roku ukończenia 50 lat – 14; ciąża 100%; to osobny moduł L4, nie urlop macierzyński.
- Art.177: ochrona ciąży i właściwych urlopów; przy bardzo wczesnym wniosku rozpoczyna się odpowiednio 14/21/7 dni przed urlopem. Przedłużenie umowy terminowej/próbnej >1 miesiąca po trzecim miesiącu ciąży do porodu, wyjątek zastępstwa.
- Art.185: płatne zwolnienie na zalecone badania ciąży niemożliwe poza godzinami pracy.
- Art.186⁴: powrót na stanowisko dotychczasowe lub równorzędne, na warunkach nie mniej korzystnych.
- Rozporządzenie wnioskowe §19–20 obejmuje też wychowawczy i obniżenie etatu: historia wykorzystania, współkorzystanie drugiego rodzica, orzeczenia dziecka oraz szczególne dokumenty przy pełnych 36 miesiącach. Sam wyciąg Kodeksu nie zawiera pełnego art.186, więc z tych trzech plików nie wyprowadzać kompletnego kalkulatora wychowawczego.
- Rozporządzenie zasiłkowe §34–40 i załącznik7 opisują dokumenty opiekuńczego, w tym dodatkowej opieki podczas pierwszych 8 tygodni przy hospitalizacji/niezdolności/porzuceniu przez matkę. To odrębne świadczenie, którego nie należy błędnie naliczać jako dodatkowej części macierzyńskiego.

§40 dla dodatkowego opiekuńczego z art.32a ustawy zasiłkowej wskazuje zależnie od okoliczności: zaświadczenie o pobycie ubezpieczonej matki w placówce, oświadczenie o pobieraniu przez nią macierzyńskiego w pierwszych 8 tygodniach po porodzie, orzeczenie niezdolności do samodzielnej egzystencji albo oświadczenie o porzuceniu z datą. Przepis dokumentowy nie ustanawia samodzielnie wszystkich materialnych przesłanek, limitu i wysokości tego świadczenia. Te trzeba pobrać z art.32a oraz powiązanych przepisów ustawy zasiłkowej, badanych w drugim zakresie prac.

Żaden z trzech przydzielonych tekstów nie wyznacza samodzielnie pełnych reguł wyboru płatnika na podstawie liczby ubezpieczonych ani całego obliczenia podstawy/procentu świadczenia. To trzeba połączyć z ustawą zasiłkową i poradnikiem, badanymi w drugim zakresie prac; dokumentowa mapa powyżej ma jawny parametr `benefitPayer = employer | ZUS`.
