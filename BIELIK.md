# Doktor Bielik

Integracja korzysta z istniejącego backendu JavaScript: `backend/api.mjs`, lokalnego serwera `server.mjs` i tej samej implementacji opublikowanej jako Worker. Nie ma dodatkowego backendu ani zależności Pythona.

## Uruchomienie

1. Konfiguracja lokalna znajduje się w `backend/.env`. Wzór bez sekretów: `backend/.env.example`.
2. Uruchom `npm start` z folderu `aplikacja` lub dotychczasowy plik `Uruchom.cmd`.
3. Wprowadzone zmienne środowiska mają pierwszeństwo przed plikiem `.env`.
4. Docker Compose przekazuje `backend/.env` w czasie uruchomienia. Plik jest wykluczony z obrazu przez `.dockerignore`.

Wymagane nazwy:

```dotenv
FABRYKA_API_KEY=
FABRYKA_BASE_URL=https://fabryka.ai/v1
FABRYKA_MODEL=bielik-11b-v3.1
```

Hosting korzysta z tych samych nazw skonfigurowanych jako sekrety środowiska wykonawczego Sites. Klucz nie jest zapisany w manifeście, repozytorium, dokumentacji, froncie ani paczce wdrożeniowej. Zmiana lokalnego `.env` nie zmienia automatycznie sekretów hostingu.

Dokumentacja dostawcy: [Fabryka AI — integracja API](https://fabryka.ai/platform), [schemat API](https://fabryka.ai/docs). Backend wysyła `POST /v1/chat/completions`, używa uwierzytelnienia Bearer, jednego komunikatu systemowego i odpowiedzi JSON. Nie pokazuje surowych błędów dostawcy ani nagłówków autoryzacji.

## Dostęp w aplikacji

- Okrągły portret lekarza nad przyciskiem „Mój tydzień”.
- Zakładka „Doktor Bielik” między kalendarzem i profilem.
- Czat zachowuje rozmowę podczas przechodzenia między zakładkami; można ją wyczyścić. Odświeżenie strony usuwa rozmowę z pamięci karty.
- Linki do oficjalnych fragmentów i przyciski otwierające istniejące karty spraw.

## Zakres i kontekst

Asystent służy do tematów bezpośrednio lub pośrednio związanych z ciążą, połogiem, rodzicielstwem i pierwszym rokiem życia. Reguły serwera blokują oczywiste obce tematy i próby zmiany roli; model dodatkowo klasyfikuje zakres pytania. Odpowiedź `out_of_scope` jest zastępowana stałą odmową z przekierowaniem do rodzicielstwa.

Każde pytanie zawiera aktualny kontekst, zbudowany na serwerze z dozwolonych pól. Wiek i terminy liczone są tymi samymi funkcjami co w aplikacji; data odniesienia pochodzi ze strefy Europe/Warsaw. Statusy rozróżniają wykonanie, „Nie dotyczy”, sprawę otwartą, przyszły okres, okres miniony i brak daty. Status zadeklarowany w aplikacji nie jest potwierdzeniem urzędowym.

Frontend nie przekazuje imienia, nazwiska, płci, godziny porodu ani pozostałej zawartości przeglądarki. Do Fabryki AI trafia pytanie, ograniczona historia, wiek, daty potrzebne do terminów, oznaczenia spraw i wybrane materiały publiczne. Wpisana przez użytkownika treść rozmowy również trafia do modelu. Aplikacja nie zapisuje rozmów w bazie ani w logach.

Asystent nie ma narzędzi do zmiany profilu lub wykonania formalności. Może otworzyć kartę, na której rodzic sam zaznaczy wykonanie. Jest oznaczony jako asystent AI; nie diagnozuje ani nie ustala dawek leków.

## Oficjalne informacje

Źródłem jest aktualny zatwierdzony katalog aplikacji: Gov.pl, ZUS, KRUS, Pacjent.gov.pl, Ministerstwo Zdrowia, GIS i PIP. Serwer wybiera do trzech dopasowanych źródeł i pobiera wyłącznie adresy z tego katalogu. Przekierowania podlegają tej samej liście dozwolonych instytucji; użytkownik i model nie mogą podać dowolnego adresu do odczytu.

Czat korzysta z zaakceptowanej treści istniejącego monitora. Gdy jej brakuje albo ostatnie sprawdzenie jest starsze niż 24 godziny, wykonuje odczyt oficjalnej strony z pamięcią podręczną do 15 minut. Wykryta rozbieżność względem zaakceptowanego skrótu oznacza źródło jako zmienione w odpowiedzi czatu, bez automatycznej zmiany zatwierdzonych reguł. Niedostępność źródła nie usuwa zatwierdzonego opisu. Właściwy przegląd i aktualizacja katalogu pozostają w dotychczasowym panelu weryfikacji. Integracja nie zmienia harmonogramu monitora ani jego włączenia.

Model wskazuje identyfikatory źródeł, a serwer buduje linki wyłącznie z katalogu. Wymyślone źródła są odrzucane; odpowiedź rzeczowa bez poprawnego źródła nie jest wyświetlana jako potwierdzona porada. Tekst odpowiedzi jest wstawiany bez wykonywania HTML. Karty powiązanych spraw pokazują rzeczywiste okresy i oznaczenia aplikacji.

Instrukcje wymagają rozróżnienia obowiązku, zalecenia i świadczenia warunkowego oraz wskazania właściwej instytucji i podstawy terminu. Dodatkowa kontrola obejmuje wykryty w teście błąd modelu: podawanie Pacjent.gov.pl jako kanału zgłoszenia do ubezpieczenia. Taka odpowiedź jest zastępowana zatwierdzoną procedurą. To kontrola konkretnego zaobserwowanego błędu, nie gwarancja bezbłędności odpowiedzi modelu.

## Endpointy i ograniczenia

- `GET /api/chat/status` — dostępność konfiguracji, bez sekretów.
- `POST /api/chat` — pytanie do 3000 znaków, do 8 wcześniejszych wiadomości i dozwolone pola profilu.
- Obowiązuje kontrola pochodzenia, limit 40 KB, do 8 pytań na minutę na klienta i 3 równoległe generacje na proces/instancję. Limity planu Fabryki AI obowiązują dodatkowo; limity instancji nie są globalnym limitem całego konta.
- Błędy dostawcy, limit i przekroczenie czasu mają czytelne komunikaty; automatyczne powtarzanie płatnych generacji jest wyłączone.

## Sprawdzenie

```sh
npm test
npm run check
npm run build
node scripts/check-secrets.mjs
node tests/chat-browser.mjs
node scripts/test-bielik.mjs
```

Ostatnie polecenie wykonuje rzeczywiste zapytania przez API i wykorzystuje limit dostawcy. Wysyła wyłącznie fikcyjny profil. Pozostałe testy czatu korzystają z kontrolowanych odpowiedzi i nie wywołują płatnego modelu. Test ochrony sekretów sprawdza pliki przeznaczone do Git, frontend i wynikowy Worker, również pod kątem zakodowanej wartości klucza.
