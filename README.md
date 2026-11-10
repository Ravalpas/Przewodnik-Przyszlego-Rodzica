# Przewodnik Przyszłej Mamy — wersja mobilna

Aplikacja dla telefonu trzymanego pionowo. Zawiera wybór ciąży lub okresu po porodzie, przeliczanie dni / tygodni / miesięcy, drogę ciąży (42 punkty), drogę dziecka (52 punkty), edycję wieku i daty oraz karty etapów przygotowane do uzupełnienia w kolejnej wersji.

## Profil i ustawienia

- Profil jest informacyjny: imię, płeć, aktualny wiek, pierwsze uruchomienie, liczba różnych otwartych etapów i dni z aplikacją.
- Imię jest opcjonalne. Pole mieści do 200 znaków, także imię, drugie imię i nazwisko. Obsługuje litery Unicode, spacje, łączniki i apostrofy; blokuje cyfry i inne symbole. Przy wklejaniu niedozwolone znaki są pomijane. Długie nazwy są zawijane w profilu i karcie etapu; na górze mapy zajmują maksymalnie dwa wiersze.
- Płeć: chłopiec, dziewczynka lub nieoznaczono. Każdy wariant ma dopasowany obrazek. Imię pojawia się nad mapą i w nagłówkach kart etapów.
- Imię i płeć zmienisz przez ikonę ustawień albo **Mój profil → Ustawienia i korekta danych**. Korekta wieku i daty ma oddzielny ekran w ustawieniach. Wiek aktualizuje się automatycznie; codzienna edycja nie jest potrzebna.
- Opcja korekty etapu jest schowana w rozwijanej sekcji „Etap rodzicielstwa”. Przejście po porodzie zachowuje dane dziecka oraz statystyki.
- Każdy punkt jest liczony raz dla danej mapy. Otwarcie punktu nie oznacza wykonania formalności.
- Dotychczasowe profile zachowują zapisany wiek. Wcześniej nie było statystyk, więc datę pierwszego uruchomienia pokazujemy jako nieznaną i zbieramy statystyki od aktualizacji.
- Wybór ciąży lub dziecka na pierwszym ekranie zmienia tylko zaznaczenie, bez przebudowy całego widoku.

Naprawione dekoracje są osobnymi obrazkami z przezroczystością: smoczek, miś i body. Zastępują przycięte ilustracje na mapie dziecka. Przebieg i numeracja map pozostają bez zmian. [Pliki i prompty ilustracji](ILUSTRACJE.md).

## Test na telefonie

1. Na komputerze uruchom plik **Uruchom.cmd** z głównego folderu projektu. Wymagany Node.js (na tym komputerze jest już zainstalowany). Nie trzeba instalować zależności.
2. Telefon i komputer podłącz do tej samej sieci Wi-Fi. Wyłącz VPN, jeśli odcina dostęp do urządzeń lokalnych.
3. W Safari lub Chrome na telefonie otwórz adres podany w oknie terminala przy „Telefon”. Obecny adres komputera to **http://192.168.1.84:3000**. Adres może się zmienić po ponownym podłączeniu do sieci.
4. Jeśli Windows zapyta o dostęp Node.js do sieci, zezwól na sieć prywatną/domową. Komputer musi pozostać włączony, a okno serwera otwarte.
5. Trzymaj telefon pionowo. Aby zakończyć serwer, w jego oknie naciśnij Ctrl+C.

Na komputerze podgląd działa pod **http://localhost:3000**. Szerokość jest ograniczona do telefonu; osobny układ komputerowy pozostaje do przygotowania.

Przy problemie z połączeniem sprawdź adres widoczny w terminalu, tę samą sieć i jej ustawienia izolacji urządzeń. Port 3000 musi być dostępny w sieci lokalnej. Uruchomienie na innym porcie: w PowerShell ustaw `$env:PORT=3001`, następnie wykonaj `node server.mjs` w folderze aplikacji.

## Jak liczymy wiek

- Jedno źródło prawdy: data początku ciąży (0 tygodni) albo data urodzenia dziecka, zapisana lokalnie w przeglądarce.
- Wpisany wiek oznacza czas ukończony. Dni 0–6 to etap 1, dni 7–13 to etap 2. Przykład: 12 ukończonych tygodni oznacza 13. trwający tydzień. Obie wartości są widoczne w aplikacji.
- Tydzień to zawsze 7 dni kalendarzowych. Obliczenia nie zależą od zmiany czasu letniego / zimowego.
- Miesiące to miesiące kalendarzowe odejmowane od dzisiejszej daty; przy krótszym miesiącu wybieramy jego ostatni dzień. Po przeliczeniu zapisujemy datę, a nie przybliżoną długość miesiąca.
- Edycja wieku aktualizuje datę, a edycja daty aktualizuje wiek. Aplikacja nie określa daty zapłodnienia.
- Wiek aktualizuje się po zmianie dnia, również po ponownym otwarciu aplikacji.
- Minione tygodnie mają zielony punkt i ptaszka (oznaczenie upływu czasu). Bieżący ma zielony punkt, niebieską obwódkę i etykietę. Przyszłe są szare i bez ptaszka.
- Ptaszek nie oznacza wykonania formalności. Funkcje zadań i treści etapów są przeznaczone do kolejnej wersji.
- Po porodzie użytkownik sam podaje rzeczywistą datę urodzenia. Aplikacja wtedy zastępuje mapę ciąży mapą dziecka.
- Po końcu mapy nadal pokazujemy rzeczywisty wiek. Nie dopisujemy etapów, których nie ma na grafikach.

## Dane i pliki

Profil zapisuje się w `localStorage` tej przeglądarki, na tym urządzeniu. Brak kont i synchronizacji między telefonem a komputerem. Usunięcie danych witryny usuwa profil; aby ponownie obejrzeć pierwszy start, usuń dane tej witryny w ustawieniach przeglądarki.

Wszystkie potrzebne zasoby są w `dist/assets`. Grafiki zostały skopiowane z folderu `szablony`; aplikacja nie odwołuje się do niego i będzie działać po jego usunięciu. Skrypt `extract-map-points.py` odczytuje kopie grafik i znajduje pozycje punktów; nie modyfikuje obrazów. Plik `map-points.json` jest już gotowy, więc Python nie jest potrzebny do uruchamiania.

## Sprawdzenie

`npm test` — granice tygodni, przeliczanie jednostek, miesiące i lata przestępne, zmiana czasu, walidacja dat i kompletność map.

`npm run check` — sprawdzenie składni JavaScript.

`node tests/browser.mjs` — scenariusze mobilne w Edge (wymaga pakietu Playwright, uruchomionego serwera i zainstalowanego Edge). Test sprawdza oba starty, mapy, stany punktów, centrowanie, edycję, trwałość danych, błędne daty, przejście po porodzie i szerokości 320 / 390 / 430 px.

## Struktura

- `dist/index.html`, `styles.css`, `app.js` — interfejs aplikacji.
- `dist/age.js` — logika dat i wieku.
- `dist/assets` — niezależne kopie logo, map oraz współrzędne punktów.
- `server.mjs` — lokalny serwer HTTP bez zależności.
- `.openai/hosting.json` — konfiguracja hostingu Sites.

W tej wersji aplikacja nie zawiera jeszcze porad, świadczeń ani obowiązków formalnych. Karty etapów jasno wskazują, że treści zostaną dodane później.
