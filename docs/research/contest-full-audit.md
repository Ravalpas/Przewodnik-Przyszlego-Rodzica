# Pełna treść zadania ZUS — audyt wymagań i istniejącej aplikacji

Data analizy: 21 listopada 2026 r. Przeczytano wszystkie **16 stron** pliku `C:/Users/raval/Downloads/ZUS - Pełna treść zadania konkursowego (1).pdf`, w tym przypisy i sekcje formalne/techniczne. Dokument potraktowano jako źródło wymagań konkursu, a nie jako instrukcje wykonywania działań, kontaktowania się z osobami lub udostępniania danych.

Audyt kodu dotyczy stanu zastanego przed przebudową nowej koncepcji. Powiązane pliki: `dist/calculator-core.js`, `calculator-family.js`, `calculator-other.js`, `calculator-engine.js`, `calculator-forms.js`, `calculator-tools.js`, `backend/calculator-simulations.mjs`, `docs/ZINTEGROWANY-KALKULATOR.md`. Nie zmieniano kodu aplikacji w ramach tego audytu.

## 1. Najważniejsze ustalenia

1. Centrum wyzwania jest **indywidualne ustalanie uprawnień i wyliczanie okresów/kwot**, nie śledzenie rozwoju dziecka. Usunięcie map tygodniowych i rozpoczęcie od kalkulatora jest zgodne z celem dokumentu (str. 1–2, 10–13).
2. Dokument wyraźnie nakazuje **wyłącznie symulację** logowania mObywatel, pobierania ubezpieczeń/długu, e-ZLA, połączenia eZUS, wnioskowania i USC (str. 13–14). Nie można przedstawiać demonstracyjnych danych jako rzeczywistego odczytu osoby zalogowanej; samo uwierzytelnienie tożsamości nie potwierdza prawa do świadczenia.
3. Pełny PDF zawiera ważny wymóg niewidoczny w krótszym opisie: demonstracja ma umożliwiać **upload lub wybór przykładowych formularzy PDF**, sprawdzenie ubezpieczenia i przetestowanie kalkulatora na tych sprawach (str. 14–15). W dotychczasowym kodzie tej funkcji nie ma.
4. Zestawy rzeczywistych zanonimizowanych spraw są przeznaczone do użycia na HackNation; dokument zawiera ograniczenie ich kopiowania i rozpowszechniania (str. 11–12). Nie należy automatycznie umieszczać surowych zestawów w publicznym repozytorium, assetach ani udostępniać ich w pobieranym archiwum. Własne syntetyczne przykłady można odróżnić od oryginalnych spraw konkursowych.
5. Nie wystarczy opisać, że kalkulator „obsługuje wszystko”: trzeba wykazać wyniki dla poszczególnych wariantów. W obecnym silniku część nietypowych sytuacji kończy się informacją o konieczności ręcznego ustalenia podstawy/okresu; to uczciwe zachowanie, lecz nie pełna automatyzacja tych przypadków.
6. Dokument zawiera skróty i co najmniej jedną nieścisłość dotyczącą szczególnego świadczenia przed porodem. Reguły należy potwierdzać w ustawie i aktualnym źródle ZUS, nie mechanicznie przepisywać narracji PDF.

## 2. Kontekst i procesy opisane w dokumencie, kolejno

### Strony 1–2: adresaci, pojęcia i cel

- Adresaci: planujący rodzicielstwo, kobiety w ciąży, matki, ojcowie, rodzice adopcyjni i rodziny zastępcze.
- Wyraźnie odróżnić ubezpieczonego, płatnika składek i świadczeniobiorcę.
- Ochrona z chorobowego obejmuje niezdolność do pracy osoby ubezpieczonej, opiekę nad chorym członkiem rodziny oraz urodzenie/przyjęcie dziecka.
- Płatnikiem świadczenia może być pracodawca albo ZUS; zasadniczo znaczenie ma liczba ubezpieczonych chorobowo: ponad 20 oraz ustawowy dzień ustalenia tej liczby (30 listopada poprzedniego roku albo szczególny pierwszy miesiąc zgłoszeń).
- Użytkownik ma otrzymać informację przed zdarzeniem, aby świadomie zaplanować urlopy, zabezpieczenie finansowe i dokumenty, także w trudnych sytuacjach.

### Strony 2–4: chorobowe w ciąży i szczególne świadczenie przed porodem

- Niezdolność stwierdza uprawniony lekarz; sama ciąża nie oznacza zwolnienia. Kod B jest oznaczeniem ciąży w e-ZLA.
- e-ZLA trafia do ZUS i profilu pracodawcy; informowanie o nieobecności oraz dokumenty płatnika pozostają odrębnymi czynnościami.
- Ścieżka pracownicza: wynagrodzenie chorobowe 33/14 dni, potem zasiłek; należy stosować dokładną zasadę roku po 50. urodzinach z aktualnych źródeł.
- Ścieżka zleceniobiorcy: warunki ubezpieczenia i dokument Z-3a, płatnik/ZUS zależnie od uprawnienia do wypłaty.
- JDG: odrębne zgłoszenie do chorobowego, właściwy wniosek o świadczenie, bez udawania urlopu pracowniczego.
- Wyczekiwanie zasadniczo 30 dni obowiązkowego/90 dobrowolnego; ustawowe wyjątki i zaliczenie wcześniejszych okresów.
- Ciążowa wysokość 100% właściwej podstawy, okres maksymalnie 270 dni; koniec choroby, powrót do pracy albo przejście do macierzyńskiego są odrębnymi zdarzeniami.
- Szczególny zasiłek w wysokości macierzyńskiego przed porodem po określonej utracie zatrudnienia nie jest tym samym co zwykły zasiłek macierzyński po porodzie.

### Strony 4–6: matka i zwykły macierzyński

- Osoby na etacie mają urlop i zasiłek; inni ubezpieczeni mogą mieć zasiłek za okres odpowiadający urlopowi, bez prawa do pracowniczego urlopu.
- Do 6 tygodni przed planowanym porodem albo początek od narodzin; wykorzystanie przed porodem zużywa tę samą pulę.
- Wymiar zależy od liczby dzieci przy jednym porodzie.
- Podstawowo pierwsze 14 tygodni po porodzie wykorzystuje matka; są ustawowe wyjątki, nie wolno zamieniać tej zasady w bezwarunkowy zakaz przejęcia.
- Dalej możliwy uzupełniający i rodzicielski; „Za życiem”, maksymalnie 5 części i granica wieku mają znaczenie.
- Martwe urodzenie/zgon przed upływem 8 tygodni, zgon późniejszy oraz żyjące dzieci z porodu mnogiego wymagają osobnych rozstrzygnięć. Nie wymagać ustalenia płci tam, gdzie przepisy dopuszczają odpowiednie zaświadczenie.
- Dokumenty i adresat zależą od etatu, zlecenia, działalności i faktycznego płatnika.

### Strony 7–8: ojciec, przejęcia i ojcowski

- Zwykłe przejęcie po 14 tygodniach matki i jej rezygnacji.
- Osobne przesłanki: niesamodzielność, szpital/placówka lecznicza, śmierć i porzucenie; dokumenty i data rozpoczęcia są specyficzne.
- Własne prawo ojca do rodzicielskiego może wystąpić mimo braku ubezpieczenia matki w dniu porodu.
- Wspólna pula rodzicielskiego, równoczesność/naprzemienność, po 9 tygodni nieprzenoszalnych, wspólne wykorzystanie do 5 części.
- Ojcowski 14 dni, jednorazowo lub 2 × 7; liczba dzieci nie wydłuża tej puli.
- Biologiczny limit wieku oraz adopcyjna data prawomocności i granica wieku to odrębne warunki; podjęcie pracy przez ojca już po narodzinach nie może być automatycznym powodem odmowy.

### Strony 8–9: uzupełniający, adopcja i praca

- Uzupełniający: po podstawowym macierzyńskim, jednorazowo, jeden z rodziców; wcześniactwo albo ustawowo kwalifikująca hospitalizacja noworodka.
- Niezawodowa rodzina zastępcza oraz przyjęcie z wystąpieniem do sądu o adopcję; sama deklaracja planowania adopcji nie jest datą nabycia prawa.
- Wiek dziecka: próg adopcyjny 14 lat, piecza 7 lat/10 przy odroczeniu; nie wymagać wyłącznie dziecka w pierwszym roku życia.
- Praca podczas rodzicielskiego u udzielającego go pracodawcy: do 1/2 pełnego etatu, proporcjonalne zmniejszenie świadczenia i wydłużenie, oddzielny plan pracy w wydłużeniu.
- Stawki i wariant terminowego wniosku 81,5% trzeba łączyć z własną podstawą uprawnionego rodzica, nie z podstawą matki dla obojga.

### Strony 9–11: ryzyka i ochrona

- Pozorna umowa/działalność, nieprawidłowa podstawa składek, niezgłoszenie dobrowolnego chorobowego, koniec zatrudnienia/zlecenia/JDG przed zdarzeniem mogą zmieniać prawo lub kwotę.
- Warunki zmiany etatu i wynagrodzenia muszą wpływać na podstawę, a nie tylko na opis ryzyk.
- Ochrona pracownicza dotyczy określonych okresów i czynności, z ustawowymi wyjątkami; nie należy rozciągać jej na JDG.
- Przedłużenie odpowiedniej umowy terminowej/probnej do porodu wymaga spełnienia warunków; samo dowolne zatrudnienie terminowe nie oznacza przedłużenia.

### Strony 11–12: przykładowe sprawy i dokumenty

- Zestawy obejmują kilkadziesiąt stanów faktycznych z informacją o przyznaniu albo odmowie świadczenia.
- Dokumenty przykładowe: ZAM, historyczne ZUR/ZAO, Z-3/Z-3a/historyczne Z-3b, wewnętrzne poświadczenia ubezpieczenia, zrzuty historii ubezpieczenia/świadczeń, ZAS-12 i zaświadczenia szczególne.
- Należy odróżnić historyczny formularz w sprawie testowej od obowiązującego aktualnie formularza do złożenia.
- PDF w przypisach wskazuje połączenie ZUR/ZAO z ZAM od 24.10.2026 oraz likwidację Z-3b. Aktualne techniczne komunikaty eZUS mogą opisywać dostępność starego formularza bez przywrócenia prawnego obowiązku.

## 3. Wymagania funkcjonalne a–j z sekcji „Oczekiwany rezultat”

| Punkt / strona | Wymóg | Zastany stan / luka |
|---|---|---|
| a / 12 | Ciążowe chorobowe, rehabilitacyjne, szczególny zasiłek przed porodem, także brak prawa | Są trzy zakresy i ocena ubezpieczenia; brak pełnej automatyzacji nietypowych podstaw i brak seedowanych limitów podstawy po ustaniu. Ścieżka dokumentowa prebirth błędnie pokazuje ZAM zamiast odrębnego ZAS-55. |
| b / 13 | Macierzyński obojga rodziców: okres i wysokość, liczba i wiek dzieci, „Za życiem” | Jest zwykły algorytm, własne podstawy, pule i ważne wyjątki. Wiek przy adopcji kilku dzieci nie jest w pełni modelowany. |
| c / 13 | Łączenie rodzicielskiego z pracą: okres i kwota | Działa wzór wydłużenia i proporcji, lecz niejednoznaczny ułamek dnia przy zmianie stawki wymaga potwierdzenia zamiast kwoty. |
| d / 13 | Symulacja skorzystania przez oboje rodziców | Są części i daty oraz limity; trzeba prezentować równoczesność vs naprzemienność w sposób zrozumiały i powiązać role formularza z rodzicem zalogowanym. |
| e / 13 | Adopcja i niezawodowa rodzina zastępcza: okres i wysokość | Typy są; bliska granica wieku, różne daty urodzenia i kolejne przyjęcie/adopcja po pieczy częściowo wymagają ręcznych danych. |
| f / 13 | Indywidualna podstawa i konkretne zestawy spraw | Są historia płac/składek, znana podstawa, premie i skrócony okres. Nie ma importu PDF ani oryginalnych zestawów do walidacji; części szczególnych formuł nie wylicza automatycznie. |
| g / 13 | Dokumenty, terminy, kanał i adresat ZUS/pracodawca | Dynamiczna checklista i linki są. Płatnik jest deklarowany ręcznie; można dodać ustalenie na podstawie liczby ubezpieczonych i dnia odniesienia. Szkice są ogólne, nie wypełnieniem oryginalnego ZAM. |
| h / 13 | Ryzyka utraty praw/zmiany wymiaru/kwoty | Są ostrzeżenia i część warunków blokujących; konkretne przypadki decyzji ZUS muszą mieć osobne dane i testy. |
| i / 13 | Wyłącznie charytatywne podmioty wsparcia w szczególnych sytuacjach | Lista organizacji jest, z rozróżnieniem bezpłatnej formy pomocy. Potrzebna widoczność poza wynikiem oraz filtrowanie według sytuacji. Nie obiecywać, że każda usługa każdej fundacji jest bezpłatna. |
| j / 13 | Adopcja i rodzina zastępcza: okres i wysokość | W dużej części powtórzenie e; musi być integralną opcją tego samego kalkulatora, a zawodowa piecza powinna dawać właściwą odmowę/odrębne wyjaśnienie, nie automatyczne prawo. |

**Wspólna rekomendacja:** wszystkie wyliczenia w jednym zintegrowanym kalkulatorze z wyborem odpowiednich opcji; nie budować osobnych aplikacji lub rozproszonych kalkulatorów.

## 4. Pozostałe wymagane możliwości, w kolejności PDF

| Kolejność / strona | Wymóg | Zastany stan / zalecane domknięcie |
|---|---|---|
| 1 / 13 | Logowanie mObywatel — wyłącznie symulacja | Jest fikcyjny profil z potwierdzeniem symulacji; nie ma modelu pochodzenia poszczególnych pól. Nie udawać, że to pobranie prawdziwego PESEL, dzieci lub płacy. |
| 2 / 13 | Pobranie danych ZUS o ubezpieczeniu albo jego braku i ręczne dane | Są trzy przykładowe warianty; można rozbudować o tytuły, okresy, podstawy miesięczne, płatnika, wykorzystane świadczenia, status brak/nieznany oraz wybór rodzica. |
| 3 / 13 | Symulacja zadłużenia na dzień prawa do świadczenia | Jest kwota i dokument DEMO; data odniesienia powinna pochodzić z tej konkretnej kalkulacji. Nie utożsamiać długu dzisiaj z długiem w dniu powstania prawa. |
| 4 / 13 | Symulacja podglądu e-ZLA | Jest jeden syntetyczny przykład, który wstawia daty i kod B. Można umożliwić listę/przeszłe okresy i wyliczenie historii, bez udawania medycznego rozpoznania. |
| 5 / 13 | Symulacja eZUS: pytanie i dane konta | Jest szkic pytania i przykładowe ubezpieczenie. Nie ma szerokiego podglądu konta ani importu konkretnych dokumentów. |
| 6 / 13 | Symulacja wypełnienia wniosków o urlopy i świadczenia, ewentualnego przesłania | Są ogólne projekty HTML/druk do PDF i DEMO przekazania, linki do oryginałów. Zestawienie danych to nie wypełniony oryginalny ZAM; należy to jasno nazwać. |
| 7 / 14 | Symulacja wniosku o zupełny/skrócony odpis aktu USC | Jest wybór i DEMO wyniku. |
| 8 / 14 | Informacje o wsparciu szczególnych sytuacji | Jest lista warunkowa; odrębna sekcja dostępu do pomocy poprawi odnajdywalność. |
| 9 / 14 | Przekierowania ZUS, MRPiPS, PIP | Są w źródłach kalkulatora. Nie usuwać wymaganych linków MRPiPS/PIP mimo dominującego źródła ZUS. |
| 10 / 14 | Panel zmian parametrów przy zmianach prawa / usprawnieniach | Istnieje wersjonowanie parametrów i dat obowiązywania. Po przeglądzie źródła administrator musi zatwierdzić konkretne liczby; sam monitoring strony nie jest legislacyjną aktualizacją reguł. |

## 5. Wymagania formalne, techniczne i ocena

| Sekcja / strona | Wymaganie | Status podczas audytu |
|---|---|---|
| 4 / 14 | Szczegółowy opis i tytuł projektu | Nazwa i dokumentacja istnieją; trzeba zaktualizować opis po usunięciu map i wykazać pokrycie punktów a–j. |
| 4 / 14 | Prezentacja maksymalnie 10 slajdów | Nie stwierdzono gotowego pliku prezentacji w dostępnym projekcie. |
| 4 / 14 | Film maks. 3 min, otwarte dostępne repozytorium/link | Nie stwierdzono gotowego filmu. Sam prywatny adres aplikacji/kodu nie zapewnia jurorom dostępu do filmu. |
| 4 / 14 | Repozytorium kodu, zrzuty ekranu, link demo, grafiki | Kod i lokalne screenshoty są; dostęp dla jurorów i finalny zestaw screenshotów wymaga osobnego przygotowania. Nie zmieniać widoczności na publiczną bez decyzji użytkownika. |
| 4 i 6 / 14–15 | Demo z uploadem/wyborem przykładowych PDF i kontrolą uprawnień/kwot | **Istotna luka:** istniejący generator/import danych syntetycznych nie jest uploadem ani wyborem PDF. |
| 4–5 / 14–15 | W pełni responsywna aplikacja webowa i potencjał produkcyjny | Istnieją Node.js/Worker + REST i RWD; zmiana frontu wymaga testów nowej nawigacji i migracji starych profili. |
| 5 / 15 | Preferowany React/Next frontend, JS/Python/C# backend, zalecane REST | To preferencja technologiczna, nie bezwzględny nakaz React. Obecny JavaScript/REST można zachować zgodnie z żądaniem użytkownika. |
| 4 i 9 / 14,16 | Wskazanie funkcji wspomaganych przez AI | Jawnie: Bielik objaśnia źródła i pomaga organizacyjnie; deterministyczny kalkulator nie jest wyliczeniem LLM. Jeżeli dodany zostanie OCR/ekstrakcja przez AI, trzeba dopisać to oddzielnie. |
| 6 / 15 | Jurorzy sprawdzą wybrane wnioski i poprawność kwot, strukturę kodu i działanie demo | Testy muszą odwoływać się do udostępnionych przypadków albo wyraźnie oznaczonych przykładów syntetycznych. Bez otrzymania kompletu zestawów nie można potwierdzić zgodności z każdym zestawem. |

Kryteria punktowe z s.16: zgodność z wyzwaniem **25%**, pomysł **20%**, oryginalność **15%**, kompletność i UX **25%**, potencjał wdrożeniowy **15%**. Gotowe działanie kalkulatora i prosty przepływ danych mają większe uzasadnienie w briefie niż dekoracyjna tygodniowa gra.

Sekcje 7 i 10 informują o dostępnych zasobach, mentorach i kontakcie. Nie nakazują automatycznej komunikacji ani wysyłania wiadomości; w ramach audytu z nikim się nie kontaktowano.

## 6. Rozbieżności materiału z zasadami i precyzja danych

- **Przed porodem vs po ustaniu:** opis na s.4 zalicza bezprawne rozwiązanie potwierdzone sądem do szczególnego świadczenia przed porodem. Art.30 ust.3 ustawy i oficjalne ZUS opisują to świadczenie dla śmierci/upadłości/likwidacji i braku innego zatrudnienia; nie należy automatycznie rozszerzać go o sądową przesłankę zwykłego macierzyńskiego po ustaniu.
- **Dokument przed porodem:** dla tej odrębnej ścieżki oficjalna procedura wskazuje ZAS-55; `calculatorDocuments()` w zastanym kodzie daje ZAM zarówno dla `family`, jak i `prebirth`, co wymaga korekty.
- **Macierzyński nie jest „niezdolnością do pracy”:** takie uproszczenie jest w narracji s.4; w modelu danych prawo wynika z urodzenia/przyjęcia i pozostałych przesłanek, nie z e-ZLA lub diagnozy.
- **Rola vs uprawnienie:** deklaracja matka/ojciec/opiekun jest przydatna dla UX, ale nie potwierdza ubezpieczenia ani prawa. Nie pobierać rzekomo rzeczywistego stanu ciąży, pokrewieństwa, daty porodu czy dochodu z samego kliknięcia logowania.
- **Pola datowe nadal konieczne:** rezygnacja z tygodniowego śledzenia życia nie oznacza usunięcia dat urodzenia, przyjęcia, prawomocności, końca pracy, e-ZLA i hospitalizacji. Tygodnie/dni pozostają jednostkami ustawowych okresów świadczeń oraz danymi o porodzie z zaświadczenia; nie muszą tworzyć mapy wieku użytkownika.

Oficjalne źródła użyte do weryfikacji tej rozbieżności (odczyt 21.11.2026):

- [ZUS — jak uzyskać szczególny zasiłek w wysokości macierzyńskiego, ZAS-55](https://psz.zus.pl/en/web/guest/swiadczenia/zasilki/opis-spraw-zasilki/-/asset_publisher/viJMtnk9lwIB/content/id/10635199?_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_viJMtnk9lwIB_languageId=pl_PL).
- [ZUS — prawo do macierzyńskiego i okres przysługiwania](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego).
- [ZUS — niezbędne dokumenty](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty).
- [Ustawa zasiłkowa, urzędowy tekst Dz.U.2026.854](https://api.sejm.gov.pl/eli/acts/DU/2026/854/text/T/D20260854L.pdf).

## 7. Luki do uczciwego wskazania przed deklaracją „każda opcja”

1. Brak udostępnionych w tym pliku kilkudziesięciu kompletnych spraw z decyzjami i dokumentami; sam PDF opisuje ich istnienie, ale ich nie zawiera.
2. Brak uploadu/wyboru PDF i ekstrakcji pól z tych dokumentów w zastanym kodzie.
3. Podstawa w pierwszym miesiącu JDG po krótkiej przerwie z innego tytułu nie ma pełnego wzoru art.49; użytkownik musi podać podstawę uznaną przez ZUS.
4. `postInsuranceCap` w zestawie startowym jest pusty; dla automatycznej podstawy po ustaniu nie ma pewnej kwoty, tylko prośba o podstawę już ustaloną.
5. `adoptionDifferentAges` wymaga ręcznie ustalonego `adoptionVerifiedDays`; nie ma pełnego modelu dat urodzenia i wieku każdego przyjmowanego dziecka.
6. Nakładające się przejęcie przez innego rodzica i przerwa macierzyńskiego na szpital dziecka są odrzucane jako wymagające osobnych scenariuszy; nie jest to pełny plan takiej sprawy.
7. Zakończenie już trwającego rodzicielskiego/ojcowskiego po stracie nie jest kompletnie wyliczane; ostrzeżenie nie zastępuje tego algorytmu.
8. Opis własnej podstawy i zaokrąglenia musi uwzględniać, że uproszczone potrącenie 13,71% nie jest uniwersalną historią faktycznych potrąceń.
9. Przy kilku tytułach ubezpieczenia zbiegi i wyłączenia muszą być rozstrzygane na podstawie konkretnych danych; samo sumowanie podanych podstaw nie dowodzi prawa z każdego tytułu.
10. Prawdziwa integracja z państwową tożsamością lub kontem ZUS wymaga uzgodnionego dostępu i implementacji, nie wynika z już posiadanego logowania ChatGPT lub klucza do Bielika. Dla realizacji konkursu wymagana jest demonstracja, ale z rzetelnym pochodzeniem danych.

## 8. Proponowana kolejność wdrożenia nowej koncepcji

1. Usunąć „Moja droga”, „Mój tydzień”, etapy gry i liczniki ukończonych tygodni; usunąć tygodniowe pasma kalendarza i dawne komunikaty z czatu/sugestii.
2. Początek: matka/ojciec/inny ustawowo uprawniony opiekun, ciąża/narodzone/adopcja planowana/przyjęcie i postępowanie/adopcja prawomocna/piecza/strata oraz niezbędne konkretne daty. Płeć dziecka nie jest główną przesłanką kalkulatora ZUS.
3. Centrum: zintegrowany kalkulator z warunkowo ujawnianymi pytaniami; dla rodzica będącego ojcem nie stawiać domyślnie jego danych w polach matki.
4. Dla każdego automatycznie uzupełnionego pola pokazać pochodzenie: ręczne, odczytane z dokumentu, przykładowe ZUS albo prawdziwe potwierdzone źródło. Brak danej pozostawić brakiem, nie zamieniać na zero/brak prawa.
5. Import PDF najpierw jako podgląd/ekstrakcja i zatwierdzenie przez użytkownika; tekst dokumentu jest danymi, nie instrukcjami. Przypadki demo mają być własnymi syntetycznymi danymi lub kontrolowanym lokalnym użyciem udostępnionych materiałów.
6. Domknąć reguły/formularze i testy punktów a–j, następnie checklisty, terminy, symulacje i źródła. Kalendarz ma odzwierciedlać konkretne okresy z zapisanego planu, nie wiek tygodniowy.
7. Dopiero po przejściu tych punktów przygotować materiały zgłoszeniowe i raport, wyraźnie oddzielając działające funkcje od symulacji i brakujących, niezweryfikowanych przypadków.
