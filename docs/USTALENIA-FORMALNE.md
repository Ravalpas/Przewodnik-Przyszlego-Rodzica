# Wdrożenie ustaleń formalnych — 22 listopada 2026

Zakres: załącznik użytkownika „Najważniejsze ustalenia”, punkty 1–20. To raport implementacji, nie merytoryczne zatwierdzenie instytucji. Interfejs dopracowywany dla komputera; układu mobilnego nie przeprojektowywano. Nie wykonywano połączeń z modelem AI ani działań na GitHubie.

## Zasada wyniku

Każdy wynik ma trzy możliwe stany: warunki wskazane podanymi danymi, potrzebne informacje, niespełniony warunek. Nie jest decyzją administracyjną. Problemy formalne mają identyfikator, opis, pole do uzupełnienia, podstawę i dalszą procedurę. W sprawach nieobsługiwanych w pełni automatycznie nie pokazujemy pewnej kwoty; można zapisać i pobrać sprawę.

## Pokrycie zaleceń w kolejności załącznika

| Punkt | Realizacja |
|---|---|
| 1. Ryzyka | Oddzielny rejestr formalny i ocena przed obliczeniem; brak nieznanej danej nie jest zerem. |
| 2. Rodzicielstwo/adopcja | Zachowane limity i rezerwacje; dodana kompletna procedura dla różnych dat dzieci, różnych przyjęć, historii pieczy i późniejszej adopcji. Granice 7/10/14 lat mają test przed i w dniu granicy. |
| 3. Zdrowie/hospitalizacja | Osobne tematy zdrowotne. Ukończony tydzień i dzień z dokumentacji oraz masa każdego dziecka. Nie łączymy szpitala, przerwy, opiekuńczego, orzeczenia i „Za życiem”. |
| 4. Opiekuńczy | Dokładny wiek z daty, kontrola granicy wewnątrz okresu, dokumenty, rodzaj potrzeby opieki, orzeczenie i jego ważność/bezterminowość, zdolność domownika i wyjątki. Poprawiono limit chorego dziecka z niepełnosprawnością przed 14 lat. |
| 5. Strata i przejęcie | Dokument martwego urodzenia bez wymogu płci; aktualny urlop; procedura zakończenia rodzicielskiego/ojcowskiego; odrębna ścieżka pogrzebowego. W pierwszych 8 tygodniach szpital matki kieruje do odrębnej oceny dodatkowej opieki. Dostosowano okno 81,5% dla ustawowego zdarzenia dotyczącego nieubezpieczonej matki. |
| 6. Chorobowe | Zachowane wyczekiwanie/wyjątki/ubezpieczenia, sprzęgnięto dodatkowe daty poprzedniej niezdolności, granica 60/61 dni przetestowana. |
| 7. Rehabilitacyjne | Warunkowość przed decyzją, jednorazowa waloryzacja, osobne terminy zalecanego wniosku, sprzeciwu i odwołania. Zmiana stanu ciąży wymaga podziału i indywidualnego ustalenia. |
| 8. Utrata pracy | Rodzaj umowy i faktyczne potwierdzenie przedłużenia; nie uznajemy samej wybranej przyczyny za dowód. Zakończone zlecenie/JDG nie są automatycznie likwidacją pracodawcy. |
| 9. Działalność | Zachowane rozróżnienia tytułów, baz, zadłużenia i rat. Rejestr okresów ujawnia zbiegi; nietypowe zbiegi nie są potwierdzane samym sumowaniem podstaw. Nie powstał pełny automatyczny kwalifikator wszystkich tytułów i form spółek. |
| 10. Kwoty | Zachowane podstawy, stawki dzienne, historie i podwyższenie z rzeczywistej sumy netto. Brak automatycznego PIT. Wyrównanie 100% jest osobnym wnioskiem i historią; bez potwierdzenia nie doliczamy kwoty. |
| 11. Daty | Oddzielnie zdarzenie, prawo, wypłata, wniosek, wydanie/doręczenie/prawomocność decyzji; daty medyczne, dokumenty, zatrudnienie i zmiana etatu. Sprzeczna data prawa nie jest nadpisywana datą porodu. |
| 12. Terminy | Centralny rejestr: zdarzenie, jednostka, adresat, skutek, wyjątki i podstawa. Integracja wyniku z kalendarzem. Wyprzedzenie zalecane nie jest utratą prawa. Dni wolne i reguły końca terminu wymagają zatwierdzenia dla konkretnej procedury; nie ma uniwersalnego automatycznego przesuwania. |
| 13. Dokumenty | Centralny dobór według daty złożenia: nowy Z-15 i ZAM; rozróżnione historyczne wzory. Dokumenty zagraniczne i wyjątek od tłumaczenia nie są automatycznie rozstrzygane. Pobranie aktu przez ZUS nie oznacza obowiązku papierowego odpisu od każdego użytkownika. |
| 14. Pozostałe prawa | Przewodnik zawiera świadczenia ZUS i pozostałych instytucji, trzy warianty Aktywnego Rodzica z wyłączeniem jednoczesnego pobierania, świadczenia rodzinne, pieczę i prawa pracownicze. To informacje i przekierowania; nie nowe automatyczne kalkulatory wszystkich programów. |
| 15. Wspólny stan | Wykorzystane/wypłacone okresy z różnych spraw pomniejszają znane limity opieki rodziny. Osobodni różnych rodziców nie znikają przy wspólnej dacie. Plany pozostają alternatywami. Zbiegi wnioskowanych/zatwierdzonych/wykorzystanych okresów wymagają sprawdzenia. Oznaczenia osoby i tego samego dziecka muszą być zgodne. |
| 16. Wyjaśnienie | Widoczna ocena, powody, dalsze kroki, dokumenty, źródła, data, reguły i założenia. Brak kwoty nie jest odmową innych form pomocy. |
| 17. Testy | Testy istniejących reguł plus nowy zestaw formalny i Edge z rzeczywistym lokalnym backendem. Nie są to wyniki zaakceptowane przez specjalistów ZUS. |
| 18. Wersje | Reguły mają identyfikator, podstawę, zakres dat i kotwicę; okresy na przełomie 2027 z kilkoma tytułami kierują do oceny przejściowej. Archiwum obliczeń i lista różnic przy zmianie. |
| 19. Organizacja/ochrona | API nie pozwala zmieniać zasad bez skonfigurowanego tokenu administratora. Zmiana wymaga odpowiedzialnej osoby, podstawy, oficjalnego URL i oceny przejściowej; to weryfikacja redakcyjna, nie urzędowa akceptacja. Dokumenty i historia nie są przekazywane do AI. |
| 20. Priorytety | Wdrożono kontrolę prawa przed kwotami, wspólną historię, rejestry oraz procedury kontynuacji; opis poniżej wskazuje pozostałe granice. |

## Odtworzenie i zależności

`formal-registry.js` — przesłanki, reguły, terminy, dokumenty i uzasadnienie.
`family-ledger.js` — wspólne okresy rodziny, osobodni, zbiegi, porównanie wyników.
`formal-view.js` — pytania warunkowe i wyjaśnienia.
`rights-guide.js` — informacyjny przewodnik pozostałych uprawnień.

Każda sprawa ma status planowany/wnioskowany/zatwierdzony/wykorzystany/wypłacony. Są to oznaczenia użytkownika na podstawie własnych dokumentów. Nie pochodzą z integracji urzędowej. Zmiana sprawy zwiększa rewizję historii i ostrzega przy starszym wyniku. Przy ponownym zapisie zachowanych jest do 10 wcześniejszych wersji tej sprawy; archiwum nie jest nieograniczonym archiwum instytucjonalnym. Surowe kwoty nie są samoczynnie nadpisywane. Kalendarz pokazuje dane i ostrzeżenie o konieczności przeliczenia.

## Granice wdrożenia instytucjonalnego

Nie można uznać tego wdrożenia za kompletny, zatwierdzony system urzędowy. Wciąż potrzebne są:
1. merytoryczny właściciel i zatwierdzenie reguł oraz referencyjnych przypadków przez uprawnionych specjalistów;
2. pełny automatyczny kwalifikator zbiegu wszystkich tytułów, szczególnych przejść oraz każdego przebiegu wielu dzieci; obecnie niepewne przypadki kończą się procedurą ustalenia, a nie wymyśloną kwotą;
3. zaakceptowane reguły weekendów, świąt i przepisów przejściowych dla każdego właściwego terminu; nie należy traktować wskazanego wyliczenia kalendarzowego jako prawomocnego rozstrzygnięcia przedawnienia;
4. produkcyjna tożsamość, role urzędników, bezpieczna baza i retencja oraz dziennik odporny na modyfikację. Dzisiejszy zapis w przeglądarce nie zastępuje takich zabezpieczeń;
5. instytucjonalna podstawa przetwarzania i ocena ryzyka danych zdrowotnych, pełny audyt dostępności i bezpieczeństwa oraz formalne przyłączenie integracji;
6. dokładne rozliczenie wyrównania na podstawie potwierdzonych rzeczywistych wypłat, podział pogrzebowego pomiędzy kilku płatników i pełne finansowe kalkulatory świadczeń poza obecnym zakresem.

Są to jawne wymagania przed produkcją, a nie funkcje oznaczone jako gotowe. Samo zaznaczenie zgody administratora lub pozytywny test kodu nie oznacza zatwierdzenia przez ZUS.

## Oficjalne źródła sprawdzone 22.11.2026

- [ZUS — wysokość macierzyńskiego](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc)
- [ZUS — opiekuńczy](https://www.zus.pl/swiadczenia/zasilki/zasilek-opiekunczy/prawo-do-zasilku-i-okres-przyslugiwania)
- [ZUS — Z-15 od 24.10.2026](https://www.zus.pl/-/oswiadczenie-zus-z-15)
- [ZUS — zmiany przepisów](https://psz.zus.pl/web/guest/o-zus/aktualnosci/-/asset_publisher/aktualnosci/content/id/13705743)
- [ZUS — pogrzebowe](https://www.zus.pl/swiadczenia/zasilki/zasilek-pogrzebowy)
- [ZUS — Aktywny Rodzic](https://www.zus.pl/aktywnyrodzic)
- [MRPiPS — świadczenia rodzinne](https://www.gov.pl/web/rodzina/wiadczenia-rodzinne)
- [MRPiPS — prawa rodzicielskie](https://www.gov.pl/web/rodzina/uprawnienia-zwiazane-z-rodzicielstwem)

Reguły pieniężne wykonuje kod, nie model językowy. Nie wysyłano wiadomości do urzędów ani wniosków i nie wykonywano rzeczywistych wywołań AI podczas prac.

## Końcowa walidacja

153 testy automatyczne przeszły (w tym 26 nowych przypadków formalnych), kontrola składni, kompilacja Workera, odizolowane testy D1/API oraz dwa scenariusze testowe Edge: cały nowy formularz i krytyczne procedury formalne. Testy przeglądarkowe tylko dla komputera, bez wywołań AI. Kontrola sekretów zakończona pozytywnie. Testy nie są zatwierdzeniem merytorycznym przez ZUS.
