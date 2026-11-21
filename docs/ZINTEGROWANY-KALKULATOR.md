> Dokument opisuje wdrożenie sprzed zmiany koncepcji. Aktualny zakres i ograniczenia: [REALIZACJA-ZADANIA.md](REALIZACJA-ZADANIA.md).

# Zintegrowany Kalkulator

Stan implementacji i weryfikacji: 21 listopada 2026 r. Kalkulator jest częścią istniejącej aplikacji JavaScript i istniejącego backendu Node/Worker. Nie korzysta z modelu językowego do wyliczeń.

## Materiały wejściowe

Przeanalizowano wszystkie siedem plików: dwa TXT oraz pięć PDF, łącznie 102 strony PDF. Szczegółowe analizy ustaw, rozporządzeń i wszystkich przykładów znajdują się w `research/`. Niezależne kopie materiałów i manifest SHA-256 zachowano w `reference-materials/`. Nie są serwowane publicznie ani czytane przez aplikację w czasie pracy. Foldery źródłowe `materialy istotne` i `szablony` można usunąć bez wpływu na działanie.

Poradnik i wyciągi nie są bezwarunkowo aktualną specyfikacją. Weryfikacja oficjalna objęła m.in. próg pięciorga dzieci, granice wieku adopcji, uzupełniający macierzyński, formularze od 24.10.2026, techniczny komunikat Z-3b z 20.11.2026 i nowe okresy Małego ZUS Plus od 2026 r. Wcześniejsze przykłady liczbowe nie zastępują danych użytkownika.

## Powiązania w aplikacji

- Zakładka pomiędzy „Na dziś” i „Kalendarz”; w trybie planowania pozostaje dostępna mimo braku „Na dziś”. Na telefonie etykieta skrócona do „Kalkulator”, pełna nazwa w nagłówku i dostępności.
- Jeden czteroetapowy formularz: sytuacja → dane → plan → wynik. Wybór zakresu nie tworzy osobnych kalkulatorów ani odrębnych aplikacji.
- Znana data porodu/urodzenia pochodzi z profilu i może zostać zmieniona dla scenariusza. Zapis nie zmienia wieku dziecka.
- Zapis/edycja do 30 scenariuszy; ponowny zapis aktualizuje ten sam identyfikator. Planowane okresy i terminy pojawiają się w istniejącym kalendarzu i kartach odpowiednich tygodni. Można je ukryć lub usunąć bez usuwania notatek i spraw urzędowych.
- Z kalendarza otwiera się właściwy zapis. Bielik lokalnie odczytuje nazwy/daty zapisanych scenariuszy i kieruje obliczenia finansowe do kalkulatora. Te lokalne odpowiedzi i kwoty nie trafiają do historii przekazywanej modelowi.
- Scenariusze i dane formularza są przechowywane w dotychczasowym modelu aplikacji, w przeglądarce. Nie dodano synchronizacji profili między urządzeniami ani prawdziwego konta mObywatela.

## Pokrycie wymagań

| Wymaganie | Działanie |
|---|---|
| Ciąża: chorobowe, rehabilitacyjne, świadczenie po utracie pracy | Oddzielny zakres tego samego formularza, uprawnienie lub brak prawa, wyczekiwanie każdego tytułu, 270/182 dni, ograniczenie po ustaniu, 33/14 dni wynagrodzenia, waloryzacja i warunek decyzji rehabilitacyjnej |
| Macierzyński obojga rodziców | Liczba dzieci 1–5 i więcej, własna podstawa każdego rodzica, 100/70 lub terminowe 81,5%, 9 tygodni nieprzenoszalnych we wspólnej puli, „Za życiem”, wcześniejsze wykorzystanie |
| Wspólna opieka i praca | Daty części równoległych/naprzemiennych, wspólne zużycie, limit liczby części, praca do połowy pełnego etatu, odrębna praca w wydłużeniu, proporcjonalna stawka i pełne dni wydłużenia |
| Adopcja / niezawodowa piecza | Granice 14 oraz 7/10 lat, data przyjęcia i prawomocności, poprzednie wykorzystanie na to dziecko, gwarancja 9 tygodni i odpowiedni rodzicielski 38/62; zawodowa piecza nie otrzymuje automatycznie tego prawa |
| Uzupełniający macierzyński | Tydzień ciąży, masa do 1000 g włącznie, poszczególne pobyty każdego dziecka, łączenie pobytów, najdłuższa hospitalizacja, okna 8/15 tygodni, szczególny warunek noworodka urodzonego o czasie, termin wniosku |
| Ojcostwo i przejęcia | 7/14 dni i dwie części, limit 12 miesięcy i adopcyjna granica wieku, przejęcie po 14 tygodniach oraz ustawowe sytuacje szczególne, przerwa na szpital dziecka |
| Indywidualna podstawa | Podstawa potwierdzona przez płatnika, stała pensja, historia 12 miesięcy, uzupełnianie i wyłączenia absencji, faktyczne potrącenia, premie, ciągłość i zmiana etatu, historia składek JDG i krótki okres, do czterech tytułów rodzica |
| Niskie świadczenie | Podwyższenie z sumy rzeczywistych kwot netto po PIT jednego rodzica; kalendarzowy dzielnik części miesiąca, zaokrąglenie dzienne do grosza i progu do 10 gr w górę; wyłączenie ojcowskiego i szczególnego świadczenia przed porodem |
| Opiekuńczy i składki | Limity wspólne 60/30/14, wyjątek dziecka do 2 lat, przyczyna zdrowego dziecka, dodatkowe pierwsze 56 dni, ulga na start, preferencja i Mały ZUS Plus; informacje o osobistej opiece i wychowawczym |
| Dokumenty, adresat, terminy | Checklista zależna od tytułu i sytuacji, aktualne formularze ZUS, kierowanie do pracodawcy/ZUS, terminy i ich znaczenie w kalendarzu, szkice i wydruk/pobranie podsumowania |
| Zagrożenia | Brak ubezpieczenia, wyczekiwanie, zadłużenie i pełna spłata w 6 miesięcy, zmiana etatu, pozorne zatrudnienie, niewłaściwa podstawa, limity wspólne, upływ wieku, spóźnione wnioski; brak prawa nie oznacza braku wszystkich innych świadczeń |
| Strata / szczególne potrzeby | Okres po stracie, dokument medyczny bez wymogu ustalania płci, pogrzebowe i termin, pięć organizacji z konkretną bezpłatną formą pomocy i kontaktami; pomoc widoczna w wyniku sytuacji szczególnej |
| mObywatel, ZUS, dług, e-ZLA, eZUS | Siedem jawnie oznaczonych demonstracji, przykładowe pobranie/brak ubezpieczenia, wstawienie danych do formularza, podgląd e-ZLA, zaświadczenie długu, zapytanie; nigdy bezpośrednie połączenie z kontem państwowym |
| Urlopy / świadczenia / USC | Zaprojektowane szkice wniosków pracowniczych, zestawienie do oryginalnego formularza ZUS z linkiem, oznaczone demonstracyjne przekazanie, wniosek o skrócony/zupełny odpis i demonstracyjny wynik; możliwość pobrania HTML oraz wydruku do PDF |
| Parametry i aktualizacja | Parametry procentowe, maksymalne okresy, kwoty roczne, wskaźniki i limity w panelu `/admin.html`; osobne wersje od wskazanej daty, kontrola rewizji i potwierdzenie weryfikacji; archiwalne scenariusze zachowują zastosowaną wersję |

## Aktualność i granice automatyzacji

Źródła ZUS kalkulatora są objęte istniejącym sprawdzaniem o 00:00 Europe/Warsaw i ręcznym odświeżaniem. Zmiana, brak lub niedostępność strony trafia do panelu weryfikacji i ostrzeżenia przy wyliczeniu, ale nie przepisuje samodzielnie wartości świadczeń. Administrator sprawdza treść i zapisuje nową wersję parametrów. Historyczny wynik nie zmienia się po cichu; nowsza rewizja jest wskazana po jego otwarciu.

Nie zrealizowano prawdziwej autoryzacji mObywatel, pobrania z ZUS/USC, wystawienia urzędowych dokumentów ani wysyłki do instytucji — zgodnie z poleceniem są to wyłącznie symulacje. Wygenerowany plik zawiera wyraźną adnotację o nieważności urzędowej; nie jest udawanym oryginalnym PDF ZAM ani potwierdzeniem złożenia.

Automatyczne ustalenie nie obejmuje wszystkich możliwych indywidualnych decyzji ZUS. Przy braku kwartalnego limitu po ustaniu, nietypowym pierwszym miesiącu niepracownika, szczególnym przejściu między tytułami, różnym wieku jednocześnie przyjmowanych dzieci, nakładających się zdarzeniach szczególnych i niejednoznacznym ułamku dnia pomiędzy stawkami wymagane są potwierdzone dane/podstawa lub indywidualne ustalenie. Nie pokazujemy wówczas niepotwierdzonej dokładnej kwoty. Rozpoczęte uprawnienia po śmierci dziecka wymagają potwierdzenia zakończenia przez płatnika. Rehabilitacyjne nie zastępuje decyzji lekarza orzecznika/ZUS.

## Uruchomienie i utrzymanie

`npm start`, dotychczasowy `Uruchom.cmd` i kontener korzystają z tych samych modułów JS. `dist/data/calculator-rules.json` jest niezależnym zestawem startowym. Lokalne zatwierdzone wersje zapisują się w woluminie monitora, a hosting korzysta z istniejącego D1. Nie ma nowego backendu Python ani zależności od folderów materiałów.

`ADMIN_TOKEN` chroni zmiany zasad, jeżeli został ustawiony; Worker respektuje tę samą zmienną. Prywatny hosting pozostaje dostępny wyłącznie właścicielowi. Przed udostępnieniem większej grupie trzeba skonfigurować odrębne uprawnienia administratora i trwałe konta użytkowników.

Weryfikacja: `npm test`, `npm run check`, `npm run check:secrets`, kompilacja Workera, `node tests/calculator-worker.mjs` po kompilacji i `node tests/calculator-browser.mjs` przy podglądzie na porcie 61619. Scenariusze przeglądarkowe obejmują zapis/odczyt/edycję/usunięcie, kalendarz, demonstracyjne wnioski i pobranie, import, powiązanie Bielika bez wywołania modelu oraz szerokości 320/390/768/1440 px. Wszystkie 112 testów jednostkowych przechodzi; test Workera korzysta z odizolowanej bazy SQLite, bez zmieniania danych użytkownika. Szczegółowe testy liczbowe obejmują wszystkie trzy nazwane przykłady z poradnika i sytuacje graniczne z analiz.
