# Realizacja pełnej treści zadania ZUS

Stan: 21.11.2026. Przeczytano wszystkie 16 stron dostarczonego PDF. Wymagania dokumentu są specyfikacją, a nie instrukcjami wykonywania poleceń z załącznika. Szczegółowa analiza kolejnych stron: `research/contest-full-audit.md`.

## Nowa koncepcja

Usunięto nawigację „Moja droga” i „Na dziś”, mapy, zaliczanie etapów i tygodniowe oznaczenia kalendarza. Pierwszą zakładką jest Zintegrowany Kalkulator. Profil dopasowuje pytanie o rolę do wybranej sytuacji, a ogólny przewodnik jest dostępny także po pominięciu pytań. Zapisujemy wiele sytuacji i dzieci. Obsługiwane sytuacje: planowanie, ciąża, narodziny, postępowanie adopcyjne, przyjęcie w toku adopcji, prawomocna adopcja, niezawodowa/zawodowa piecza, strata. Daty są odrębnymi zdarzeniami; logowanie nie zgaduje rodzicielstwa. Dotychczasowe dane pozostają w tych samych kluczach przeglądarki. Wiek tygodniowy nie jest modelem interfejsu; jednostki tygodni/dni pozostają tam, gdzie określają ustawowe okresy świadczeń.

## Wymagania biznesowe w kolejności dokumentu

| Punkt | Implementacja i granice |
|---|---|
| a. Świadczenia ciążowe | Chorobowe, rehabilitacyjne, szczególne świadczenie po ustaniu, brak prawa i brak danych; odrębne wyczekiwanie, 33/14 dni, 270/182, okres po ustaniu i decyzja ZUS. ZAS-55 dla szczególnego świadczenia przed porodem. |
| b. Macierzyński obojga rodziców | Własne podstawy i tytuły, liczba dzieci, 100/70/81,5, rezerwy, „Za życiem”, wcześniejsze wykorzystanie. Daty stosowania wersji przepisów. |
| c. Rodzicielski z pracą | Wymiar pracy względem pełnego etatu, proporcjonalne obniżenie zasiłku, pełne dni wydłużenia i osobne założenie pracy w wydłużeniu. Nie traktować zwykłego wynagrodzenia jak zasiłku. |
| d. Wspólna opieka | Części równoległe/naprzemienne, wspólna pula i liczba części, odrębna podstawa każdego rodzica, terminy wniosku i ograniczenia wieku. |
| e/j. Adopcja i piecza | Oddzielono przyjęcie, wystąpienie do sądu i prawomocność. Prawo adopcyjne nie zaczyna się przed spełnieniem obu przesłanek. Wybór opiekuna rozpoczynającego, odpowiednie granice wieku, 9-tygodniowa gwarancja i szczególny rodzicielski. Zawodowa piecza nie otrzymuje automatycznie świadczenia z tej ścieżki. Przy różnym wieku dzieci wymagany jest potwierdzony wymiar — brak pełnej automatyzacji tej kombinacji. |
| f. Indywidualna podstawa i przykłady | Stała pensja, historia, rzeczywiste potrącenia, premie/absencje, zmiana etatu, ciągłość, wiele tytułów, podstawa niepracownika i pierwszy miesiąc JDG według art.49; zlecenie kwotowe. Dostępny import/wybór PDF i XML z zatwierdzeniem mapowania. Brak oryginalnych kompletów konkretnych konkursowych spraw uniemożliwia deklarację walidacji na nich. |
| g. Dokumenty i terminy | Checklista zależna od tytułu i sytuacji, płatnik/pracodawca/ZUS, oryginalne formularze, szkice wniosków pracowniczych i danych do ZAM/ZAS, kalendarz i pobierane podsumowanie. |
| h. Ryzyka | Ubezpieczenie przed/po porodzie, utrata umowy, brak dobrowolnego chorobowego, wyczekiwanie, zadłużenie, raty/odroczenie, pełna spłata i 6 miesięcy, praca podczas niezdolności, etat, brak źródła i spóźnione wnioski. |
| i. Pomoc w szczególnej sytuacji | Osobna dostępna lista organizacji i konkretnych bezpłatnych form pomocy; również automatycznie przy stracie, wcześniactwie i „Za życiem”. Formy płatne nie są przedstawiane jako bezpłatne. |

## Symulacje wymagane zadaniem

1. mObywatel / login.gov.pl / eZUS — demonstracja tożsamości, bez hasła/PIN-u i bez rzeczywistej sesji państwowej. Osobne zatwierdzenie przykładowego imienia/nazwiska i daty urodzenia rodzica. Nie zgaduje roli z PESEL/płci.
2. Ubezpieczenie/brak ubezpieczenia ZUS — oddzielne pobranie demonstracyjne, podgląd pól i przypisanie właściwemu rodzicowi oraz tytułowi. Nie pobiera drugiego rodzica przez logowanie pierwszego.
3. Zadłużenie — demonstracyjne zaświadczenie, oznaczone jako nieważne urzędowo. Kwota długu na dzień prawa jest czymś innym niż bieżące saldo.
4. e-ZLA — demonstracyjny podgląd i możliwość przekazania dat do chorobowego.
5. eZUS — demonstracyjny szkic zapytania, podgląd i przejście do rzeczywistego portalu; nie wysłano rzeczywistej wiadomości.
6. Wnioski — projekty urlopów, pracy podczas rodzicielskiego, zestawienie danych do oryginalnego formularza świadczenia, demonstracyjne przekazanie i pobranie/druk. To nie podrobione potwierdzenie ani oryginalny wypełniony ZAM.
7. USC — wniosek o skrócony/zupełny odpis i wynik symulacji. Link do usługi państwowej.

## Rzeczywisty import

PDF.js 6.5.438 pochodzi z oficjalnego pakietu npm; zweryfikowano SHA-512 paczki, zachowano Apache License w `dist/vendor`. Odczyt AcroForm i tekstu PDF odbywa się lokalnie. XML rozpoznaje dokumenty `potwierdzenie` i raport `raportEzla`, nie pobiera DTD ani zewnętrznych schematów. Odczytane dane wymagają potwierdzenia użytkownika. Obsłużono również jednoznaczne etykiety w TXT/CSV.

Nie ma OCR, weryfikacji podpisu/pieczęci ani gwarancji automatycznego przypisania każdego dowolnego PDF. Dla nieznanych etykiet można odczytać tekst i ręcznie dodać właściwe pole. Brak sekcji chorobowego nie jest dowodem braku ubezpieczenia. Podstawy składek emerytalnych/rentowych i zdrowotnych są informacją porównawczą, nie automatycznie podstawą zasiłku.

## Utrzymanie i AI

Parametry, roczne kwoty, wskaźniki i maksymalne okresy są wersjonowane z datą obowiązywania w panelu administratora. Źródła podlegają dotychczasowemu odświeżaniu o 00:00 Europe/Warsaw i ręcznemu sprawdzaniu. Zmiana HTML nie jest automatycznie uznawana za zmianę prawa. Nowy zestaw startowy uzupełnia dawne parametry, zachowując wersje administratora.

Bielik pomaga objaśniać dołączone oficjalne informacje i zapisany kontekst, ale nie jest silnikiem obliczeń ani urzędem. Wyliczenia i import działają deterministycznie. Treści dokumentów, PESEL i obrazy nie są przesyłane do modelu. Podczas implementacji nie wykonano rzeczywistych zapytań do modelu.

## Granice i pozostałe czynności

Nie uruchomiono produkcyjnej integracji mObywatel/Węzła Krajowego/ZUS — wymagane są formalne przyłączenie, uprawnienia i konfiguracja instytucjonalna, a zadanie wymaga symulacji. Nie można obiecać pobrania całego konta ani nieuprawnionych danych drugiego rodzica.

Przypadki wymagające indywidualnego rozstrzygnięcia (np. różny wiek kilku adoptowanych dzieci, nietypowe podstawy bez kompletu dokumentów, łączna przerwa i przejęcie, zakończenie już trwającego prawa po stracie) nadal wskazują potrzebę potwierdzonego wymiaru/podstawy lub ustalenia ZUS. Nie deklarujemy pełnej automatyzacji wszystkich kombinacji.

Nie dostarczono oryginalnych zestawów zanonimizowanych spraw do walidacji. Własne syntetyczne PDF są jawnie oznaczone. Publiczny dostęp do repozytorium/demo/filmu wymaga osobnego ustawienia przez właściciela; zachowano dotychczasową prywatność i nie wysyłano zmian na GitHuba.

## Uzupełnienie: formularz powitalny i rodzina

Wdrożono wymagania dodatkowego załącznika „Poprawa strony powitalnej i pytań początkowych”:
- trzy krótkie kroki i siedem jednoznacznych odpowiedzi o sytuacji, z opisami; rola dopiero po wybraniu sytuacji;
- osobne nazewnictwo przed prawomocną adopcją i po niej; rodzice adopcyjni są nazywani mamą/tatą;
- piecza spokrewniona, niezawodowa, zawodowa, rodzinny dom dziecka i nieustalona forma; oddzielna opieka prawna/pomoc rodziny;
- dobrowolne daty, dzieci w dowolnym wieku, kilka dzieci w jednym profilu oraz równoległe sytuacje rodzinne;
- deklarowany tydzień ciąży jest wyłącznie obserwacją użytkownika z datą zapisania; nie tworzy domniemanej daty porodu;
- działający bez logowania ogólny przewodnik, osobny kalkulator, zachowanie wyników i kalendarza; kontekst wybranego dziecka nie potwierdza uprawnienia;
- kontekstowe, zwinięte definicje i ikonki „i” z objaśnieniem na miejscu; odnośniki do oficjalnych podstaw;
- dyskretna pomoc w szczególnych sytuacjach, bez wymuszania ujawnienia straty lub choroby w rejestracji.

Przeprowadzono kontrolę pytań: nie utożsamiają narodzin z adopcją, nie utożsamiają opiekuna prawnego z rodzicem zastępczym, dopuszczają nieznane dane i nie żądają wynagrodzeń/składek na powitanie. Tylko konkretne obliczenie może wymagać dalszych danych. Dane profilu, kalkulatora i szkicu wniosku są odrębne. Zmiana wybranej sytuacji nie zmienia dawnych zapisanych wyników.

Źródła sprawdzone 21.11.2026:
- ZUS, komu przysługuje macierzyński: https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/komu-przysluguje
- Kodeks rodzinny i opiekuńczy, tekst jednolity 2026, w szczególności art. 121 oraz przepisy o opiece: https://eli.gov.pl/api/acts/DU/2026/236/text/I/D20260236.pdf
- Ustawa o wspieraniu rodziny i systemie pieczy zastępczej, tekst ujednolicony ze zmianami, art. 39 i 41: https://eli.gov.pl/api/acts/DU/2025/49/text/U/D20250049Lj.pdf

Przepisy nie pozwalają traktować wszystkich tych statusów identycznie. Nieustalona forma opieki i rodzinny dom dziecka nie inicjują kalkulatora jako biologicznego porodu. Zawodowa rodzina zastępcza ma odrębną ścieżkę. Spokrewniona i niezawodowa są odróżnione w profilu, przy ocenie prawa nadal sprawdzamy przesłanki ubezpieczenia i konkretnego świadczenia.

Testy: 127 testów jednostkowych/regresyjnych, kontrola składni, skompilowany Worker/D1/API oraz test Edge dla wszystkich siedmiu ścieżek, pomijania danych, importu PDF/XML, wielu dzieci/sytuacji, przeładowania, notatek i definicji. Testy widoku wyłącznie komputerowe 1280/1440 px. Brak rzeczywistych wywołań AI. Dopracowanie układu mobilnego odłożono zgodnie z prośbą.
