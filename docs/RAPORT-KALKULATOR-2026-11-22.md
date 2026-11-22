# Dopracowanie kalkulatora — raport z 22 listopada 2026 r.

Stan: rozszerzony i przetestowany lokalny demonstrator. **Nie wszystkie wymagania załącznika są ukończone. Nie jest to narzędzie zatwierdzone do urzędowego ustalania świadczeń.** Granice automatyzacji opisano niżej, zamiast zastępować brakujące algorytmy deklaracją kompletności.

Nie wykonano wdrożenia produkcyjnego, migracji rzeczywistych danych, operacji na GitHubie ani rzeczywistych zapytań do modelu AI. Zachowano istniejącą aplikację i backend JavaScript. Nie utworzono backendu Python. Lokalne budowanie paczki nie publikuje aplikacji.

## A. Wykonane zmiany

Przed zmianami zapisano audyt 11 istniejących obszarów w `audit/baseline-2026-11-22.json`. Końcowa mapa ma 22 obszary i wskazuje konkretne pliki, kotwice kodu, testy oraz wyjątki. Źródłem instrukcji był nowy załącznik użytkownika; nie stał się zależnością uruchomieniową aplikacji.

| Funkcja | Implementacja i efekt | Podstawa / weryfikacja |
| --- | --- | --- |
| Kwalifikacja ubezpieczeń | `dist/insurance.js`, `insurance-view.js`, `calculator-core.js`, `calculator-forms.js`: osobne dane tytułów, chorobowe, student, własne zlecenie, minimum etatu, kolejność zleceń, zawieszenia i powrót po macierzyńskim. Nieznane fakty pozostają nieznane. | Art. 6, 8, 9, 11, 14 ustawy systemowej; testy `insurance:`. |
| Wspólne wykorzystanie | `family-ledger.js`: historia tego samego dziecka pomniejsza pulę także bez zmiany pieczy na adopcję. Daty tej samej osoby łączą się bez podwajania. Praca podczas rodzicielskiego uwzględnia równoważnik wykorzystania. | KP, wspólne limity; testy `family history reference`, `parental work history`. |
| Kontynuacja macierzyńskiego | `calculator-family.js`, `formal-registry.js`: kompletny ciągły początek wykorzystania odtworzony datami, bez ponownego naliczania minionych dni. Przypadki złożone nadal są blokowane. | Art. 180 KP i 29 ustawy zasiłkowej; test `maternity continuation reference`. |
| Kilkoro przyjmowanych dzieci | `formal-registry.js`: osobne daty urodzenia i przyjęcia. Dzieci w różnym wieku, przyjęte równocześnie i mieszczące cały plan przed granicami wieku, mogą otrzymać automatyczne obliczenie. | Art. 183 KP; testy `different-aged adoption reference`, `adoption near age boundary`. |
| Opiekuńczy na granicach | `calculator-other.js`: podział na zmianie roku, granicach wieku i ważności orzeczenia. Wspólne podlimity liczone ponownie dla właściwego roku. Nieznana historia następnego roku nie jest zerem. | Art. 32–35 ustawy zasiłkowej; test `care reference`. |
| Kontynuacja rehabilitacyjnego | `calculator-other.js`, `calculator-core.js`, `formal-view.js`: osobne wcześniejsze dni rehabilitacyjnego, próg 90 dni, limit 360 dni, brak ponownej waloryzacji według późniejszego kwartału. Przy potwierdzonej decyzji i braku wyłączeń podział stawki po końcu ciąży. | Art. 18–22 ustawy zasiłkowej; dwa testy `rehab continuation`. |
| Podział pogrzebowego | `financial.js`, `formal-registry.js`, `formal-view.js`: wiele osób / podmiotów i ich rzeczywiste koszty; proporcjonalny podział w groszach, suma zgodna z pulą. | Art. 77–81 ustawy emerytalnej; test `funeral reference`. |
| Wyrównanie i kwoty wypłaty | `financial.js`, `calculator-family.js`, `records-view.js`: oddzielna projekcja wyrównania, zamknięta historia pierwszego roku, sprawdzenie sprzeczności; późniejszy rodzicielski 70% przy potwierdzonych warunkach. Netto wyłącznie z zadeklarowanych potrąceń. | Art. 31 ustawy zasiłkowej; testy `equalization reference`, `equalization does not coexist`, `net payout`. |
| Silnik terminów | `legal-dates.js`, `formal-registry.js`, `calculator-family.js`: różne reguły KC/KPA/KPC i okresów kalendarzowych, święta ruchome i Wigilia od 2025. Granice wieku i minimalne wyprzedzenia nie przesuwają się jak termin odwołania. | KC 111–115, KPA 57, KPC 165, KP 300; test `deadlines:`. |
| Rejestr rzeczywistych spraw | `case-records.js`, `records-view.js`: 12 oddzielnych typów danych, identyfikatory osób i dzieci, ręczne korekty z poprzednimi wersjami, eksport, usuwanie i data przeglądu retencji. Decyzje i przelewy nie są symulacjami. | Testy `case journal`, `incomplete actual history`, `actual payment comparison`. |
| Dokumenty | `calculator.js`, `formal-registry.js`: trwała checklista sześciu statusów, właściwy adresat zależny od osoby korzystającej z opieki, celu i płatnika. | Dz.U.2026.1316 i 2025.322; testy `document checklist`, `formal document recipient`. |
| Integracja z resztą aplikacji | `app.js`, `planner.js`, `calculator-storage.js`: rejestr w zakładce Dane i dokumenty oraz przy wyniku. Jego daty w kalendarzu jako własne wpisy. Potwierdzany import znanych pól do wybranej osoby i tytułu kalkulatora. Zmiana historii oznacza potrzebę przeliczenia zapisów i terminów. | Testy `actual journal calendar`, `journal import`; przeglądarka na 7 szerokościach. |
| Prosty / szczegółowy tryb | `calculator.js`: cztery kroki, ograniczone rozwinięcia w trybie prostym i szerszy widok szczegółowy. Zachowanie otwartych pytań, fokus po obliczeniu i po zmianie trybu klawiaturą. | Testy pytań początkowych i przeglądarkowe; nie jest to jeszcze pełny adaptacyjny wywiad po jednym pytaniu. |
| Porównania | `scenario-compare.js`, `calculator.js`, `formal-view.js`: porównanie zapisanych wyników i wariant „Co, jeśli”. Kwoty, dni, okresy, dokumenty, terminy i wersje. Stary plan pozostaje zapisany; wariant nie dodaje się jako faktyczne wykorzystanie. | Test `what-if comparison`; odrębne statusy plan / złożono / zatwierdzono według dokumentu / wykorzystano / wypłacono. |
| Przewodnik | `rights-guide.js`: 16 rozwijanych kart z organem, warunkami, czasem działania, dokumentami, podstawą i oficjalnym odnośnikiem. Są informacją proceduralną, bez automatycznej decyzji o pozostałych świadczeniach gminnych. | Test `guide registry`. |
| Telefon i komputer | `case-workspace.css`, `app.js`, `terms.js`: nawigacja po lewej na komputerze i na dole telefonu, czytelniejsze przyciski mobilne w dwóch kolumnach, krótsze etykiety, nazwane dialogi. | Przeglądarka: 320, 390, 768, 899, 900, 1280 i 1440 px. |
| Wersje i raport pokrycia | `formal-registry.js`, `scripts/coverage-report.mjs`: wersje algorytmów w audycie wyniku, ostrzeżenia o starszych zapisach, automatyczny raport z rzeczywistego TAP i dowodów przeglądarkowych. | `audit/coverage-registry.json`, `coverage-2026-11-22.json`, `POKRYCIE-2026-11-22.md`. |
| Nowy użytkownik | `reset.js`: reset obejmuje też nowy rejestr, zachowuje obce dane przeglądarki. Nie podniesiono globalnej rewizji resetu wszystkim użytkownikom. | Test `fresh-user reset` i pełny reset w przeglądarce. |

Szczegółowe listy wyjątków, kodu, podstaw i testów są w [raporcie pokrycia](audit/POKRYCIE-2026-11-22.md). Jego status „częściowe” oznacza rzeczywisty brak, nie ukończoną automatyzację.

Najważniejsze źródła sprawdzone w tej pracy: [ZUS — zbieg tytułów](https://psz.zus.pl/pl/web/guest/pracujacy/system-ubezpieczen-spolecznych-w-polsce/zbieg-tytulow-do-ubezpieczen-spolecznych), [dobrowolne chorobowe](https://www.zus.pl/pl/pracujacy/system-ubezpieczen-spolecznych-w-polsce/dobrowolne-ubezpieczenia-spoleczne/dobrowolne-ubezpieczenie-chorobowe), [okres macierzyńskiego i przyjęcie](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego). Stawki, wyrównanie i podwyższenie porównano z [wyjaśnieniem ZUS](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc); kontynuację rehabilitacyjnego z [ustawą, Dz.U.2026.854](https://api.sejm.gov.pl/eli/acts/DU/2026/854/text/T/D20260854L.pdf) i [procedurą urzędową](https://www.gov.pl/web/gov/uzyskaj-swiadczenie-rehabilitacyjne-z-tytulu-ubezpieczenia-chorobowego). Sam odczyt źródła nie zastępuje niezależnego zatwierdzenia algorytmu.

## B. Poprawione błędy

| Błąd / ryzyko | Sytuacja i poprawa | Dowód |
| --- | --- | --- |
| Historia rodzicielskiego ignorowana poza pieczą → adopcją | Nowa sprawa mogła ponownie użyć wspólnej puli. Historia tego samego dziecka jest teraz globalna. | `family history reference` |
| Ponowne naliczanie wykorzystanego macierzyńskiego | Dla kompletnego ciągłego początku obliczamy wyłącznie pozostały okres, z zachowaniem właściwego końca. | 28 dni już użytych → 112 dni i 22400 zł, `maternity continuation reference` |
| Kalendarzowy dzień pracy utożsamiony z pełnym dniem zużycia puli | Historia rodzicielskiego z pracą ma udział wykorzystania; duplikaty dat nie sumują się drugi raz. Ułamkowy dzień bez odtworzenia części blokuje pewną kwotę. | `parental work history` |
| Opieka przez urodziny / Nowy Rok wymagała ręcznego podziału | Algorytm dzieli okres i stosuje właściwy wiek, podlimit i historię danego roku. | `care reference` |
| Różny wiek dzieci powodował zawsze odmowę obliczenia | Jednoczesne przyjęcie przed wszystkimi granicami otrzymuje wymiar; skomplikowane przekroczenia są jawnie pozostawione do dalszej ścieżki. | `different-aged adoption reference` i `adoption near age boundary` |
| Terminy bez rozróżnienia reguł przesunięcia | Osobne reżimy postępowania i kalendarza; okres świadczenia nie jest automatycznie przedłużany przez weekend. | `deadlines:` |
| Niepowiązany rzeczywisty okres mógł zostać pominięty | Kalkulator wymaga uzupełnienia osoby, dziecka, dat i stanu zamiast przyjęcia zerowej historii. | `incomplete actual history` |
| Wypłatę jednej osoby porównywano z sumą dwojga rodziców | Porównanie filtruje właściwą osobę i tylko porównywalne brutto. Sam przelew netto nie dowodzi błędu decyzji. | `actual payment comparison` |
| Brak rozdzielenia prognozy i rzeczywistej decyzji / wypłaty | Rejestry są odrębne, korekty zachowują poprzedni wpis, a plan nie jest zatwierdzany przez aplikację. | `case journal` |
| Wyrównanie sprzeczne z rodzicielskim w pierwszym roku | Stawka i historia sprawdzane przed pokazaniem kwoty; późniejszy rodzicielski po potwierdzonym niewykorzystaniu ma właściwy wariant. | `equalization does not coexist` |
| Rehabilitacyjne mogło powtórzyć pierwsze 90 dni | Osobne wcześniejsze wykorzystanie, limit pozostałych dni i brak ponownej waloryzacji z późniejszej części. | `rehab continuation` |
| Dokument opieki kierowany według pierwszego rodzica | Rejestr bierze rzeczywistego wnioskodawcę opieki i jego płatnika. | `formal document recipient` |
| Przyciski telefonu nakładały teksty | Dwie kolumny zamiast ścisku; krótsze etykiety mobilnej nawigacji. | `extended-browser.mjs`, zrzuty 320–1440 px |
| Klawiatura traciła fokus po zmianie trybu | Fokus wraca na przycisk trybu po odrysowaniu. | `extended-browser.mjs` |
| Import jednego własnego pola mógł usunąć oznaczenie pozostałych danych demo | Import do mieszanego scenariusza zachowuje ostrzeżenie o przykładzie, dopóki użytkownik nie potwierdzi całego zestawu jako własnego. | Kontrola `calculator.importData` i regresja przepływu importu |

## C. Pozostające ograniczenia i dalsze kroki

Nie przedstawiam całego zadania jako ukończonego. W [raporcie pokrycia](audit/POKRYCIE-2026-11-22.md) każdy brak ma przyczynę i następny krok. Najważniejsze:

1. **Brak pełnego kodu**: dynamiczne zmiany liczby uprawnionych dzieci po różnych przyjęciach / granicach wieku; nieciągłe historyczne przejęcia i przerwy; zakończenie już trwającego rodzicielskiego / ojcowskiego po stracie; złożone zdarzenia dotyczące zmarłego ojca lub innego opiekuna. Są procedury, daty i zabezpieczenia, ale to nie pełne automatyczne obliczenia. Potrzebny model osi zdarzeń oraz osobne zweryfikowane przykłady dla każdego rodzaju prawa.
2. **Brak pełnego kodu / zestawu referencyjnego**: niektóre zmienne zbiegi JDG, zleceń i spółek; własne zlecenie przy kilku pracodawcach; mieszane pokrewieństwo płatników pogrzebu przy kosztach niższych od pełnej kwoty. Nie przypisujemy arbitralnie tytułu ani puli. Możliwa dalsza automatyzacja po dopracowaniu reguł i testów.
3. **Brak pełnego algorytmu przejściowego**: wielotytułowe e-ZLA i praca na przełomie 2026/2027; zakończenie ciąży w trakcie chorobowego. Ścieżki blokują niepewną kwotę. Rehabilitacyjne obsługuje już potwierdzoną kontynuację i podział stawek.
4. **Ograniczenia danych i wersji**: najwcześniejsza paczka silnika od 19.03.2025, nie pełne historyczne prawo; do czterech tytułów osoby, do 12 miesięcy historii podstawy. Nie ma kompletnego systemu PIT całej osoby, automatycznej kwalifikacji wszystkich zagranicznych dokumentów ani uzupełnienia wszystkich wyjątkowych składników płac. Dokładną kwotę ustala się z właściwej podstawy i potrąceń, bez zgadywania.
5. **Brak pełnej automatyzacji UX i innych świadczeń**: prosty tryb to cztery prowadzone kroki, jeszcze nie całkowicie adaptacyjny wywiad po jednym pytaniu. Dodatkowe świadczenia mają rozbudowane karty, ale nie wszystkie mają indywidualne kwalifikatory dochodowe. Relacje i złożone zdarzenia medyczne w rejestrze nie wypełniają samodzielnie wszystkich pól kalkulatora.
6. **Wymagane rozstrzygnięcie**: prawdziwe rehabilitacyjne, szczególne uprawnienia po utracie pracy, poprawność orzeczeń i sądowych statusów nie mogą być przyznawane przez demonstrator. Potrzebna decyzja / dokument i następne przeliczenie. Zwykły przypadek nie jest kierowany do tej ścieżki wyłącznie dla wygody implementacji.
7. **P2, brak integracji i produkcyjnej ochrony**: tożsamość publiczna i komunikacja z urzędami nadal demonstracyjne. Brak wieloużytkownikowej szyfrowanej bazy i instytucjonalnego audytu. Rejestr jest lokalny; przypomnienie o retencji nie jest centralnym automatycznym usuwaniem danych. Przed produkcją potrzebne są uprawnienia, model ochrony danych, polityka kopii i retencji oraz rzeczywiste interfejsy instytucji. Nie wykonywano tych operacji na prawdziwych danych.
8. **Weryfikacja merytoryczna i dostępność**: testy nie są certyfikatem ZUS ani audytem WCAG. Potrzebny niezależny przegląd prawnika / specjalisty świadczeń i testy z czytnikiem ekranu oraz użytkownikami.

## D. Testy i odtwarzanie

Wynik po końcowym przebiegu: **181 wykonanych, 181 zaliczonych, 0 niezaliczonych, 0 pominiętych**. W stosunku do wcześniejszych 153 doszło 28 testów w `tests/extended-rules.test.mjs`. Nie są to testy zatwierdzone przez ZUS.

- Regresja: dotychczasowe kalkulatory, formularze, profile, import PDF/XML, kalendarz, notatki, archiwum rozmów, monitorowanie, polityka AI i ochrona sekretu.
- Referencje: niezależnie podane oczekiwane wyniki w `audit/reference-cases.json`, w tym 112 dni / 22400 zł, 217 dni / 43400 zł, podział 7000 zł, zmiana roku opieki / 640 zł, wyrównanie 5180 zł, rehabilitacyjne / 1690 zł. Są referencjami arytmetycznymi i granicznymi demonstratora, nie decyzjami instytucji.
- Granice: 26. urodziny zleceniobiorcy, urodziny dziecka, koniec miesiąca i roku, święta i Wigilia, granice 90 / 360 dni rehabilitacyjnego, daty składania, niepełne dane i powielone okresy.
- Kombinacje: etat + zlecenie / działalność, własne zlecenie studenta, zawieszenie i ponowne zgłoszenie, wielu płatników pogrzebu, dwoje dzieci w różnym wieku, równoczesne wykorzystanie i konflikty.
- Przeglądarka: trzy skrypty `formal-browser.mjs`, `case-workspace-browser.mjs`, `extended-browser.mjs`; nowy użytkownik, zapis / powrót, checklista, rejestr, kalendarz, import z rejestru, klawiatura, oba układy nawigacji i brak poziomego przepełnienia. Zrzuty w `artifacts/extended-responsive-*.png`. Szerokości 320, 390, 768, 899, 900, 1280 i 1440 px. Nie testowano fizycznych telefonów ani pełnego zestawu czytników.
- Kontrole techniczne: składnia modułów, lokalny build paczki, składnia wygenerowanego serwera oraz skan sekretów. Klucz nie występuje w źródłach przeznaczonych do repozytorium, frontendzie ani zbudowanej paczce. **Zero rzeczywistych zapytań do AI.**

Odtwarzanie: `npm run check`, `npm run test:tap`, `npm run test:ui:extended`, `npm run coverage:report`, `npm run build`, `npm run check:secrets`. Przeglądarka wymaga działającego lokalnego podglądu na porcie 61619. Raport pokrycia korzysta z zapisanego TAP i `artifacts/extended-browser.log`; nie deklaruje dowodu dla niedopasowanego testu.

## E. Stan końcowy ścieżek

| Ścieżka | Automatyczne | Warunkowe / dane potrzebne | Decyzja / nadal do dopracowania |
| --- | --- | --- | --- |
| Macierzyński i rodzicielski | Zwykłe limity, stawki, podział, własne podstawy, historia, prosta kontynuacja | Ubezpieczenie, dokumenty, terminy, rzeczywiste wykorzystanie i dane płacowe | Wielokrotne historyczne przerwy / przejęcia; złożone straty |
| Łączenie pracy | Wydłużenie i redukcja wypłaty, równoważnik historii | Etat i praca w każdej części | Podział niepełnego dnia przy zmianie stawek |
| Adopcja / piecza | Zwykła ścieżka i jednoczesne przyjęcie w różnym wieku przed granicami | Daty każdego dziecka, sądu, przyjęcia, historia pieczy | Dynamiczna zmiana liczby uprawnionych; rozstrzygnięcie statusu |
| Wcześniactwo / szpital | Pobyt, okna, masa, wymiar, zwykła przerwa po 8 tygodniach | Dokumentacja każdego dziecka i matki | Połączone wielokrotne przejęcia i przerwy |
| Ciężka choroba / orzeczenie | Właściwa pula i podlimity po potwierdzeniu przesłanek | Rodzaj dokumentu, wskazania, ważność, zaświadczenie Za życiem | Ustalenie dokumentu i prawa przez właściwy organ |
| Strata / zgon | Podstawowe skrócenie macierzyńskiego, ochrona minimalnego okresu, brak nowego przyszłego uprawnienia bez opieki | Data, liczba pozostających dzieci, dokumenty | Trwający rodzicielski / ojcowski i rozbudowane przejęcia |
| Ojcowski | Zwykły wymiar, dwie części, granice i terminy | Data porodu albo prawomocności adopcji | Szczególne zdarzenia w trakcie wykorzystywania |
| Opiekuńczy | Wspólne limity, podział roku / wieku / orzeczenia | Dokumenty opieki, inne świadczenia, dostępny domownik, kompletna historia | Ocena dowodów i szczególnych wyłączeń |
| Chorobowe | Wyczekiwanie, wynagrodzenie i zasiłek, część po ustaniu | Ubezpieczenia, medyczna niezdolność, historia, podstawa | Przejście ciąży wewnątrz okresu i zbiegi e-ZLA 2027 |
| Rehabilitacyjne | Zwaloryzowana podstawa, stawki, kontynuacja i wykorzystanie; zmiana po ciąży po potwierdzeniu | Wyczerpanie chorobowego, rokowanie, pierwotna podstawa, brak wyłączeń | Orzeczenie i decyzja ZUS; nie automatyczne przyznanie |
| Po ustaniu pracy przed porodem | Jednoznaczna podana ustawowa przesłanka i okres | Przyczyna zakończenia umowy, ciąża i zatrudnienie | Ocena dowodów / prawomocnego rozstrzygnięcia |
| JDG i ulgi | Zwykłe okresy i kwoty przy dostępnych wskaźnikach, próg długu | Historia działalności i ulg, zgłoszenia, spłata / raty | Nietypowe spółki, pełne zmienne zbiegi i historia |
| Pogrzebowe | Jednorazowy standard oraz obsługiwany podział wielu kosztów | Data zgonu, status, pokrewieństwo, rachunki | Mieszany szczególny podział; decyzja ZUS |
| Podwyższenie / wyrównanie | Znane netto i okres, osobna projekcja wyrównania | Faktyczne wypłaty, potrącenia, zamknięta historia roku | Pełny PIT osoby poza zakresem; potwierdzenie płatnika |
| Pozostałe prawa i świadczenia | Proceduralny przewodnik, terminy i instytucje | Indywidualne warunki i dokumenty | Nie wszystkie indywidualne kwalifikatory są zaimplementowane |

## Testowanie jako nowy użytkownik

Podgląd: **http://localhost:61619/**.

Rozpoczęcie od początku: **http://localhost:61619/nowy-uzytkownik.html**. Otwiera formularz powitalny i czyści profil, scenariusze, notatki, rozmowy oraz rejestr tej aplikacji w używanej przeglądarce. Nie resetuje innych aplikacji. Podczas testów automatycznych korzystano z oddzielnych kontekstów, bez kasowania rzeczywistej sesji przeglądarki użytkownika.
