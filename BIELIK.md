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

Połączenie używa `redirect: manual` i odrzuca odpowiedzi 3xx bez wykonywania kolejnego żądania, aby nie przekazać klucza pod inny adres. To zachowuje zgodność z Node.js i [API Request w Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/request/), które nie obsługuje trybu `redirect: error`.

## Dostęp w aplikacji

- Okrągły portret lekarza nad przyciskiem „Mój tydzień”.
- Zakładka „Doktor Bielik” między kalendarzem i profilem.
- Rozmowy zachowują się automatycznie w tej przeglądarce. „Nowa rozmowa” zapisuje bieżącą przed rozpoczęciem kolejnej. Do zapisanych konwersacji można wrócić przyciskiem „Rozmowy” w nagłówku.
- Zapisana rozmowa jest aktualizowana przy kolejnych odpowiedziach i odtwarzana po odświeżeniu strony. Szkic zachowuje się automatycznie; po przeładowaniu podczas generowania pytanie wraca jako szkic, bez automatycznego ponawiania płatnego zapytania. Archiwum nie jest synchronizowane między urządzeniami.
- Linki do oficjalnych fragmentów i przyciski otwierające istniejące karty spraw.

## Zakres i kontekst

Ogólne zasady są wspólne dla frontendu i backendu: `dist/chat-policy.js`. Ten moduł określa kategorie i hierarchię decyzji, a jego instrukcje są włączane do komunikatu systemowego Bielika. `dist/chat-personal.js` odczytuje dozwolone pola według schematu; nie porównuje pytań z jednym konkretnym zdaniem.

| Rodzaj pytania | Zasada odpowiedzi |
| --- | --- |
| Dane dziecka, ciąży i oznaczenia w aplikacji | Odczyt aktualnego profilu lub listy spraw. Bez wymagania źródła urzędowego i bez zgadywania brakujących wartości. |
| Brak części danych | Odpowiedź na znaną część i wskazanie, czego brakuje. Brak danych nie oznacza obcego tematu. |
| Codzienna organizacja, wsparcie, przygotowanie pytań do specjalisty | Pomoc praktyczna, bez przedstawiania niesprawdzonych twierdzeń medycznych lub prawnych. |
| Warunki świadczeń, formalności, kwoty, terminy i zalecenia medyczne | Fakty wyłącznie z dostępnych oficjalnych materiałów. Brak dowodu oznacza wyjaśnienie ograniczenia i drogę sprawdzenia, nie odmowę z powodu tematu. |
| Pytanie uzupełniające | Uwzględnienie ostatnich wypowiedzi i aktualnych danych. Nowy, wyraźnie obcy temat nie dziedziczy automatycznie zakresu rodzicielskiego. |
| Pytanie mieszane | Obsługa części rodzicielskiej, z osobnym ograniczeniem pozostałej części. Dane osobiste można dołączyć lokalnie, bez przekazywania ich do modelu. |
| Prośba o zmianę danych | Pomoc w znalezieniu ustawień. Asystent nie udaje wykonania zmiany i nie zapisuje jej samodzielnie. |
| Niejasne pytanie | Doprecyzowanie zamiast automatycznej odmowy. |
| Rzeczywiście obcy temat lub ujawnienie sekretów | Uprzejma odmowa lub pominięcie niedozwolonej części. Samo słowo „dziecko” nie uprawnia do wykonywania obcego zadania. |

Backend sprawdza również rodzaj zwróconej odpowiedzi. Błędna klasyfikacja modelu jako `out_of_scope` dla rozpoznanego pytania rodzicielskiego nie jest przekazywana jako taka odmowa; odpowiedź wraca do danych profilu, doprecyzowania lub informacji o potrzebie potwierdzenia. Odpowiedź praktyczna nie może zastępować wymaganych źródeł dla twierdzeń medycznych i prawnych. Nie wymaga to dodatkowego zapytania do modelu.

Pytania mieszane zachowują historię części obsłużonej przez AI, a lokalne dane osobiste pozostają poza nią, również po zapisaniu i ponownym otwarciu rozmowy. Źródła do dalszego sprawdzenia mają inną etykietę niż materiały użyte do potwierdzonej odpowiedzi.

Asystent służy do tematów bezpośrednio lub pośrednio związanych z ciążą, połogiem, rodzicielstwem i początkowym etapem życia dziecka, także po pierwszych urodzinach. Pierwszy rok pozostaje obecnym zakresem mapy i katalogu, a nie granicą tematyki czatu. Reguły serwera blokują oczywiste obce tematy i próby zmiany roli; model dodatkowo klasyfikuje zakres pytania. Odpowiedź `out_of_scope` jest zastępowana stałą odmową z przekierowaniem do rodzicielstwa. Brak materiału źródłowego nie oznacza, że pytanie o dziecko jest spoza zakresu.

Proste pytania o imię i wiek dziecka obsługuje lokalnie moduł `dist/chat-personal.js`, z aktualnych danych profilu. Nie wymagają źródła urzędowego ani wywołania modelu. Odpowiedzi te i ich pytania nie są włączane do późniejszej historii wysyłanej do AI, więc imię lub nazwisko z profilu nie trafia tam pośrednio. Wiek jest liczony kalendarzowo, z prawidłową odmianą dni, tygodni, miesięcy i lat. Brak imienia jest wyjaśniany bez odmowy podania dostępnego wieku.

Sugerowane pytania są wybierane lokalnie na podstawie etapu: początek i środek ciąży, jej późny okres i okres przed porodem, noworodek, kolejne miesiące niemowlęce oraz starsze małe dziecko. Nie ma dodatkowych zapytań do AI w celu generowania podpowiedzi.

Każde pytanie zawiera aktualny kontekst, zbudowany na serwerze z dozwolonych pól. Wiek i terminy liczone są tymi samymi funkcjami co w aplikacji; data odniesienia pochodzi ze strefy Europe/Warsaw. Statusy rozróżniają wykonanie, „Nie dotyczy”, sprawę otwartą, przyszły okres, okres miniony i brak daty. Status zadeklarowany w aplikacji nie jest potwierdzeniem urzędowym.

Frontend nie przekazuje imienia, nazwiska, płci, godziny porodu jako danych profilu. Do Fabryki AI trafia pytanie wymagające modelu, ograniczona historia bez lokalnych odpowiedzi osobistych, wiek, daty potrzebne do terminów, oznaczenia spraw wybrane materiały publiczne i dopasowane notatki z kalendarza. Treść wpisana przez użytkownika w pozostałych pytaniach również trafia do modelu. Aplikacja nie zapisuje rozmów w bazie serwera ani w logach. Archiwum rozmów jest lokalne (`ppm-bielik-conversations-v1`) i przechowuje również wiadomości osobiste widoczne w zapisanej rozmowie.

Archiwum mieści do 30 rozmów, po 100 wiadomości każda. Nie usuwa starszych zapisów automatycznie. Można usuwać wybrane konwersacje z listy. Błąd zapisu lub brak miejsca zatrzymuje rozpoczęcie nowej rozmowy, zachowując otwartą treść. Testy odtwarzania, limitów, odmiany wieku oraz interfejsu działają bez prawdziwych zapytań do dostawcy.

Asystent nie ma narzędzi do zmiany profilu lub wykonania formalności. Może otworzyć kartę, na której rodzic sam zaznaczy wykonanie. Jest oznaczony jako asystent AI; nie diagnozuje ani nie ustala dawek leków.

## Osobiste notatki w kalendarzu

Notatki są zapisane w tej przeglądarce pod kluczem `ppm-calendar-notes-v1`, do 500 wpisów po 3000 znaków. Każdy wpis ma datę, opcjonalną godzinę, treść i kolor szpilki (czerwony, zielony, żółty, pomarańczowy). W dniu można dodać kilka wpisów. Notatki są na początku informacji dnia; można je otwierać, edytować, przenieść na inną datę i usunąć po potwierdzeniu. Nie są synchronizowane między urządzeniami ani przechowywane w bazie serwera.

Bielik odczytuje bieżące notatki na moment każdego pytania. Proste odczyty, wyszukiwanie według daty, treści lub koloru działają lokalnie bez zapytania do modelu. Takie pary wiadomości pozostają poza historią wysyłaną później do modelu. Z odpowiedzi można otworzyć aktualny wpis; historyczna treść rozmowy jest zapisem stanu z chwili pytania.

Przy poradzie wymagającej modelu przesyłamy dopasowany podzbiór do 8 wpisów po 700 znaków, wraz z informacją o pominięciach i skróceniu. Użytkownik może zobaczyć całość w kalendarzu. Limit dotyczy kontekstu AI, nie zapisanej treści. Backend ponownie waliduje kontekst; notatki są danymi rodzica, nigdy oficjalnym źródłem, diagnozą, potwierdzeniem czynności ani instrukcjami systemowymi. Model nie edytuje notatek i nie pobiera zawartych w nich dowolnych adresów. Prawne i medyczne objaśnienia nadal wymagają źródeł oficjalnych. Całe żądanie ograniczamy według liczby bajtów UTF-8 przez skrócenie najstarszej historii, bez obcinania bieżącego pytania.

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
