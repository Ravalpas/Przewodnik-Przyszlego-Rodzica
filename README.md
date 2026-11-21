# Przewodnik Przyszłego Rodzica

Aplikacja dla matek, ojców, rodziców adopcyjnych i opiekunów. Centrum stanowi **Zintegrowany Kalkulator** świadczeń i urlopów, powiązany z kalendarzem, dokumentami i asystentem Bielik. Interfejs nie zawiera map ani tygodniowych etapów rozwoju.

## Uruchomienie

Node.js 24: `npm start` albo `Uruchom.cmd` w tym folderze. Domyślny port 3000; w aktualnej sesji użytkownika podgląd działa na http://localhost:61619. W PowerShell własny port: `$env:PORT=61619`, potem `npm start`. Kontener: dotychczasowe `Dockerfile` i `compose.yaml`, wolumin stanu źródeł zachowany.

## Nowy przebieg

1. Sytuacja: planowanie narodzin, ciąża, dziecko urodzone bez adopcji/pieczy, planowanie/procedura adopcji, adopcja prawomocna, piecza zastępcza albo inna opieka.
2. Pytanie o rolę zależy od sytuacji. Planowana adopcja nie oznacza jeszcze prawnego rodzicielstwa. Pięć form/stanów pieczy i opieka prawna są rozróżnione.
3. Tylko znane daty i dane dzieci — wszystkie można uzupełnić później. Opcjonalny deklarowany tydzień ciąży bez daty porodu nie wyznacza terminów ani uprawnień.
4. Przewodnik ogólny dostępny bez logowania i bez uzupełnienia profilu. Osobny dyskretny odnośnik pomocy w szczególnej sytuacji.
5. Profil: kilka sytuacji jednocześnie i oddzielne informacje o dzieciach w różnym wieku. Dodawanie/edycja w oknie, bez powtarzania rejestracji. Wybór dziecka podpowiada dane nowego scenariusza.
6. Jeden kalkulator: sytuacja → dane ubezpieczeniowe → plan → wynik. Nie traktuje nieustalonej formy opieki jak narodzin dziecka.
7. Zapisane scenariusze z terminami w kalendarzu. Notatki oraz dotychczasowe rozmowy i scenariusze są zachowywane. Oznaczenia spraw nie przechodzą między sytuacjami rodzinnymi.
8. Domyślnie zwinięte wyjaśnienia pojęć i ikonki „i” na miejscu, także w kalkulatorze, dokumentach i kartach kalendarza.

Aktualny zakres dopracowania interfejsu: komputer. Nie zmieniano istniejących reguł CSS przeznaczonych wyłącznie dla telefonu; dopracowanie osobnego układu mobilnego jest odłożone. Logika danych i wspólne komponenty pozostają jedną aplikacją.

## Pochodzenie danych

Przyciski mObywatel/login.gov.pl/eZUS są jawnie oznaczonymi **symulacjami**, zgodnie z zadaniem konkursowym. Logowanie tożsamości nie udostępnia automatycznie wynagrodzeń, ubezpieczenia ani konta drugiego rodzica. Produkcja wymaga formalnej integracji państwowej.

W zakładce „Dane i dokumenty” rzeczywiście działają lokalny odczyt formularzy i tekstu PDF (PDF.js 6.5.438), XML potwierdzeń ZUS, raportu e-ZLA oraz oznaczonych pól TXT/CSV. Podgląd → właściciel danych → tytuł → potwierdzenie poszczególnych pól. Oryginał i identyfikatory dokumentów nie trafiają do AI ani backendu. OCR i kryptograficzna weryfikacja pieczęci nie są zaimplementowane. Nierozpoznane etykiety wymagają ręcznego przypisania; parser nie udaje ustalenia prawa.

## Walidacja i źródła

`npm test`, `npm run check`, `npm run build`, `node tests/calculator-worker.mjs` po kompilacji, `node tests/case-workspace-browser.mjs` przy porcie 61619. Stare testy przeglądarkowe map dokumentują poprzedni koncept; bieżący test interfejsu to case-workspace-browser.

Źródła sprawdzane codziennie o 00:00 Europe/Warsaw i ręcznie. Zmiany parametrów administrator zatwierdza w `/admin.html` jako wersje z datą obowiązywania. Stawki i długości liczy kod deterministyczny; AI pomaga objaśniać oficjalne materiały i zapisane sprawy.

[Pokrycie pełnego zadania i granice](docs/REALIZACJA-ZADANIA.md), [audyt 16 stron](docs/research/contest-full-audit.md), [rzeczywisty zakres integracji i XSD](docs/research/identity-integration.md), [analiza przepisów ZUS](docs/research/zus-options-review.md).

Materiały źródłowe `szablony` i `materialy istotne` są zbędne do uruchomienia. Nie dodawaj do Git pliku `backend/.env`, baz i plików roboczych; zachowano `.gitignore` i kontrolę `npm run check:secrets`. Nie umieszczaj w publicznym repozytorium nieuprawnionych kopii konkursowych zestawów spraw. Udostępnione przykłady PDF w `dist/examples` są własne i syntetyczne.

## Kontrola formalna i wspólna historia

Wdrożenie ustaleń z 22.11.2026: [raport punktów 1–20 i jawne granice](docs/USTALENIA-FORMALNE.md). Trzy stany wyniku, odrębne daty, wersje dokumentów, historia rodzinnych limitów, wykrywanie zbiegów i procedury ustalenia złożonych spraw. Test desktopowy: `node tests/formal-browser.mjs`. System nie ma instytucjonalnego zatwierdzenia ZUS ani produkcyjnego rejestru decyzji.
