> Aktualizacja koncepcji: mapy i tygodniowe etapy usunięto. Obecny start prowadzi do kalkulatora; aktualny opis: [README.md](README.md) i [pokrycie zadania](docs/REALIZACJA-ZADANIA.md). Infrastruktura źródeł i harmonogram pozostają aktualne.

# Oficjalne sprawy, kalendarz i aktualizacje

Ta wersja zawiera wspólny katalog kart dla mapy i kalendarza. Treści startowe są w `dist/data/catalog.json`; źródła i ich okresy obowiązywania należy weryfikować redakcyjnie. Mapa tygodniowa i kalendarz korzystają z tych samych identyfikatorów spraw. Oznaczenie wykonania jest lokalnym oświadczeniem rodzica, niezależnym od niebieskich etapów czasu.

Sprawy są prezentowane w kolejności: **Obowiązkowe — ważne**, **Zalecane — zdrowie i opieka**, **Dodatkowe — świadczenia i uprawnienia**. W obrębie grupy otwarte sprawy są uporządkowane według końca okresu, a wykonane są niżej. Świadczenia mają neutralną ikonę zamiast ostrzegawczego trójkąta.

Przycisk **Nie dotyczy** znajduje się pod oznaczeniem wykonania w sprawach dodatkowych i zalecanych. Nie występuje przy obowiązkach urzędowych i kartach obowiązkowych szczepień. Wyłączenie jest zapisywane lokalnie w profilu, usuwa sprawę z aktywnych okresów i wyróżnień; kartę można przywrócić ze zwijanej listy. Wykonanie i wyłączenie są wzajemnie wykluczające. Oznaczenie nie zmienia licznika przebytych tygodni.

## Harmonogram

Sprawdzanie źródeł: codziennie o **00:00 Europe/Warsaw**. To północ lokalna, więc przy zmianie czasu odstęp może wynosić 23 lub 25 godzin. Przycisk „Odśwież” na górze pozwala wybrać zakres: tylko ZUS (domyślnie) albo wszystkie zachowane instytucje. Zakres jest zapisywany na serwerze i obowiązuje także dla harmonogramu, mapy, kalendarza i źródeł Bielika. Strona nie musi być otwarta.

- Kontener / Node: `server.mjs` planuje następne uruchomienie, uwzględnia zmianę czasu i nadrabia brakujące uruchomienie po starcie z `PPM_STARTUP_CHECK=1`.
- Sites: zadanie chmurowe połączone z tą samą prywatną witryną wywołuje `POST /api/scheduled-refresh` z obsługiwanym dostępem serwisowym Sites. Nie przechowujemy poświadczeń w kodzie ani w instrukcji zadania.
- Uruchomienia dzienne są idempotentne. Jednoczesne żądania są łączone; hosted D1 ma dodatkową dzierżawę chroniącą przed równoległym zapisem przez różne instancje.

## Co robi monitor

Odczytuje wyłącznie dozwolone oficjalne adresy HTTPS; kontroluje również przekierowania. Ma limit rozmiaru, timeouty i ograniczoną współbieżność. Porównuje skróty treści po pominięciu nawigacji i stopki. Dla dokumentu PDF porównuje plik. W wybranych źródłach zbiera nowe powiązane odnośniki do programów i dokumentów.

- Zmiana treści → nowa wersja do przeglądu.
- HTTP 404 / 410 → informacja, że źródło zniknęło, bez usuwania zatwierdzonej karty.
- Błąd, blokada dostępu, timeout → nieudane sprawdzenie, bez podmiany opisów i terminów.
- Nowy link → kolejka do sprawdzenia; monitor nie zakłada, że nowy dokument już obowiązuje.

Automatyczne sprawdzenie nie jest automatycznym zatwierdzeniem przepisów. Panel `/admin.html` umożliwia porównanie zapisanej i nowej treści, zmianę oficjalnego adresu, poprawę opisów, dat odniesienia i długości okresów oraz zatwierdzenie wersji od wskazanego dnia. Przyszłe wersje nie zmieniają wcześniejszych terminów przed wejściem w życie. Zachowujemy ograniczoną historię wersji i zmian. Nowe, niepowiązane jeszcze z kartami przepisy wymagają opracowania nowych reguł katalogu; samo znalezienie dokumentu nie tworzy wiarygodnej porady medycznej lub prawnej.

## Dane i trwałość

Hosted: tabela `ppm_monitor` w D1, migracja w `drizzle/`. Profil, daty i wykonane zadania pozostają w lokalnej przeglądarce; nie są wysyłane do źródeł rządowych.

Kontener: trwały wolumen `/app/data`; stan zapisywany atomowo jako JSON. Nie przechowujemy bazy wyłącznie w warstwie kontenera. Po restarcie zachowane są sprawdzenia, kolejka i zatwierdzone wersje.

Uruchomienie: `docker compose up --build -d` w folderze aplikacji. Port 3000. Do panelu redakcyjnego przy wystawieniu kontenera do internetu ustaw `ADMIN_TOKEN` w środowisku oraz zapewnij HTTPS i kontrolę dostępu do całej aplikacji. Przeglądarka podaje token wyłącznie w nagłówku; pole nie jest zapisywane. Na prywatnym Sites dostęp egzekwuje platforma.

## Kalendarz i daty

- Tygodnie życia i ciąży są liczone od zapisanych dat; historia ciąży jest zachowywana przy przejściu po porodzie.
- Rzeczywista data narodzin wynika z wieku dziecka; można dodać godzinę urodzenia.
- Termin przewidywany można wpisać oddzielnie. Bez niego aplikacja pokazuje orientacyjne 40 tygodni od początku datowania ciąży.
- Orientacyjny tydzień poczęcia jest odrębny od początku wieku ciążowego. Przybliżenie nie ustala faktycznego zapłodnienia. Można podać ustaloną datę. Wyjaśnienie i źródło są na karcie.
- USC i ubezpieczenie wymagają daty karty urodzenia i nadania PESEL. Nie zgadujemy ich z dnia narodzin. Planowany urlop wymaga daty rozpoczęcia.
- Miesiące są kalendarzowe. Pierwsze urodziny są rocznicą daty urodzenia, a nie 364. dniem mapy.
- Przy świadczeniach warunkowych karta prosi o sprawdzenie uprawnienia; aplikacja nie przyznaje świadczenia i nie potwierdza wykonania formalności w urzędzie.

## Sprawdzenie

`npm test`: granice tygodni i miesięcy, termin zależny od zdarzenia, przyszłe wersje, wykrywanie zmian / zniknięć / nowych dokumentów, awarie źródeł, idempotencja, DST, migracja SQL i dzierżawa D1.

`node tests/planner-browser.mjs`: mapa i kalendarz, okresy, źródła z podświetlaniem, niebieskie oznaczenia, daty i walidacja, zapis wykonania, ręczne odświeżanie oraz mobilne szerokości. Wymaga serwera na porcie 3001 i Playwright/Edge.

`npm run build`: samodzielny Worker z osadzonymi plikami; istniejący Node serwer i Docker korzystają z tych samych modułów monitora.

## Planowanie i widok na komputerze

Pierwszy ekran wymaga wskazania roli rodzica oraz etapu; płeć trzeba wybrać dla ciąży i narodzonego dziecka, z opcją „Brak informacji”. Braki wskazuje niebieski symbol i komunikat przy danej grupie. Tryb planowania pomija wiek, ukrywa „Na dziś” i pozwala przełączać obie mapy w podglądzie. Nie tworzy dat ciąży, poczęcia ani porodu. Przy przejściu do narodzin nie przenosi daty technicznej jako początku ciąży.

Kalendarz w planowaniu pokazuje własne notatki, przygotowania bez terminu oraz informacyjny coroczny cykl 800+. Samo planowanie nie daje prawa do świadczenia. Opis pochodzi ze zweryfikowanej karty `800-renewal`; `calendarWindow` w katalogu określa daty MM-DD. Panel redakcyjny i API przeglądu pozwalają zmieniać ten okres wraz z datą obowiązywania wersji. Ta sama wersja zasila kalendarz planowania i dziecka. Przygotowanie do zasiłku nie ma ustawowego terminu i nie tworzy alarmu o zaległości.

Od 900 px początkowy wybór ma szeroki układ, kalendarz i informacje dnia są w dwóch kolumnach, czat ma większą przestrzeń, a droga zachowuje szerokość, kształt i numerację. Po bokach znajdują się skróty do spraw i kalendarza. Zakładka „Lekarz” jest dostępna dla każdego etapu; kontakt z lekarzem prowadzącym pojawia się tylko w ciąży.

Weryfikacja nowej wersji: `npm test`, `npm run check`, `npm run build`, `node scripts/check-worker.mjs`, `npm run check:secrets`. Testy przeglądarkowe: `node tests/desktop-planning-browser.mjs` (domyślnie port 61619, inny przez `TEST_URL`). Obejmują wymagane wybory, planowanie, źródła, role, notatki, układ 390/1000/1366/1440 px, zakładkę Lekarz i kolory punktów. Nie wysyłają zapytań do modelu.

## Czytelność i wykorzystanie ekranu

`dist/readability.css` zawiera wspólne rozmiary tekstu, mocniejszy kontrast i dostosowanie dużych ekranów. Układ komputerowy wykorzystuje całą szerokość okna, z logo, podsumowaniem i ustawieniami w jednym pasie. Boczne panele drogi pokazują statystyki, najbliższe notatki i skróty do istniejących spraw. Przebieg i numeracja drogi są zachowane. Powitanie czatu i propozycje pytań mają osobne kolumny; pasek bieżącego etapu zawiera również przycisk nowej rozmowy.

Test `node tests/readability-browser.mjs` sprawdza szerokości 320, 390, 1024, 1366, 1440 i 1800 px, w tym niższy ekran laptopa. Kontroluje wielkość ważnego tekstu i przycisków, widoczność pytań czatu, układ kalendarza i brak nakładania bocznych paneli na drogę. Odpowiedzi modelu nie są wywoływane.
