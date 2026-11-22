# Cloudflare Workers Free

Repozytorium: Ravalpas/Przewodnik-Przyszlego-Rodzica. Katalog główny repozytorium to zawartość lokalnego folderu `aplikacja`.

Punkt wejścia: `worker/cloudflare.mjs`, konfiguracja `wrangler.jsonc`. Poprzednie `dist/server/index.js` jest paczką około 68 MB zawierającą zasoby base64; NIE jest odpowiednim artefaktem dla Workers Free. Nowy Worker importuje tylko kod i katalog reguł; PDF.js, modele OCR i obrazy są osobnymi Static Assets. Lokalny `server.mjs` pozostaje serwerem Node, nie punktem wejścia Cloudflare.

## Połączenie z GitHub

1. Wyślij przygotowane pliki do repozytorium. Agent nie wykonuje push ani wdrożenia.
2. W Cloudflare: Workers & Pages → projekt `przewodnik-przyszlego-rodzica` → Settings → Builds, połącz repozytorium GitHub `Ravalpas/Przewodnik-Przyszlego-Rodzica` i gałąź `main`. Jeśli projektu nie ma, utwórz Worker przez Import a repository.
3. Root directory: `/` (nie `aplikacja`). Build command: `npm run build:cloudflare`. Deploy command: `npx wrangler@4 deploy`. Nie używaj dotychczasowego `npm run build` dla tej platformy. Wyłącz automatyczne wdrażanie innych gałęzi, jeśli nie potrzebujesz podglądów.
4. Konfiguracja wymaga bindingu D1 `DB`. Aktualny Wrangler może automatycznie utworzyć bazę bez `database_id`; zaakceptuj provisioning przy pierwszym wdrożeniu. Jeśli panel/CI wymaga wcześniejszej konfiguracji, utwórz bazę D1 o nazwie projektu i dopisz jej prawdziwy `database_id` do `d1_databases` w `wrangler.jsonc`. Identyfikator bazy nie jest sekretem. Nie wpisano fikcyjnego UUID.
5. Opcjonalny sekret runtime `ADMIN_TOKEN` ustaw w Settings → Variables and Secrets. Bez niego edycja parametrów i zatwierdzanie źródeł przez API pozostają zablokowane. Nie są potrzebne klucze AI, `.env`, R2, KV ani płatne dodatki. Token wdrożeniowy obsługuje połączenie Cloudflare Builds; nie umieszczaj go w kodzie.
6. Włącz/zaakceptuj subdomenę konta workers.dev. Docelowy adres: `https://przewodnik-przyszlego-rodzica.<subdomena-konta>.workers.dev`. Subdomena konta nie jest znana z repozytorium.

Static Assets obsługują frontend bez wywoływania Workera. `/api/*` zawsze trafia do backendu i zwraca błędy JSON zamiast HTML aplikacji. Brakujące pliki zwracają 404. Dane profilu, notatek i PDF pozostają lokalne oraz tymczasowe; D1 przechowuje wyłącznie stan oficjalnych źródeł i reguł. Tabela powstaje przy pierwszym uruchomieniu; istniejące migracje zachowano w `drizzle`.

Cron jest w UTC: wywołania 22:00 i 23:00, z kontrolą północy Europe/Warsaw w kodzie, uwzględniają czas letni i zimowy. Tylko właściwe wywołanie uruchamia aktualizację.

## Limity i weryfikacja

Workers Free: 100 tys. żądań kodu dziennie, 10 ms CPU na zwykłe żądanie, 128 MB RAM, skrypt do 3 MiB po kompresji. Static Assets: do 20 tys. plików i 25 MiB na pojedynczy plik; żądania statyczne są bezpłatne. D1 Free ma osobne limity odczytów, zapisów i pojemności. Wybierz Free w koncie i nie aktywuj Workers Paid.

`npm run build:cloudflare` sprawdza limity zasobów. Pierwsza lokalna kontrola: 315 zasobów, największy około 4,53 MiB. OCR działa w przeglądarce i nie zużywa CPU Workera. Monitor pobierający i analizujący strony oraz złożone wyliczenia wymagają sprawdzenia pod realnym limitem CPU Free; nie obiecujemy nieograniczonego obciążenia.

Przed publikacją: `npm run build:cloudflare`, następnie `npx wrangler@4 deploy --dry-run`. Dry-run nie publikuje i pozwala zmierzyć skompresowany kod. Po wdrożeniu sprawdź `/`, `/api/health`, `/api/catalog`, kalkulator, lokalny OCR oraz 404 dla `/api/chat/status`. Przygotowanie lokalne nie oznacza połączenia kont Cloudflare/GitHub ani wykonania wdrożenia.

Źródła: https://developers.cloudflare.com/workers/static-assets/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
