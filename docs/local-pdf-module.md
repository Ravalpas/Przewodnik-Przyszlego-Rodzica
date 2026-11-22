# Dokumenty PDF w Zintegrowanym Kalkulatorze

Moduł jest częścią istniejącej aplikacji. Otwiera się przez „Uzupełnij kalkulator z dokumentów”, z zakładki „Dane i dokumenty” lub przyciskiem na ekranie początkowym bez logowania. Użytkownik wybiera lokalne pliki, własny syntetyczny przykład lub ręczne wprowadzanie danych.

## Przepływ i wspólny silnik

Sprawa → wiele dokumentów → propozycje pól z numerem strony i obszarem → przypisanie osoby/tytułu/dziecka → sprawdzenie sprzeczności i potwierdzenie → istniejący `calcNormalizeInput` i `calculateIntegrated` → wynik. Moduł nie zawiera drugiego algorytmu świadczeń. Odczyt nie przesądza prawa do świadczenia.

Import jest jawną operacją zastąpienia wybranych pól bieżącego formularza. Profil i zapisane wcześniej scenariusze nie są nadpisywane. Potwierdzone propozycje pozostają w pamięci podczas ponownego odczytu dokumentu; nowe propozycje wymagają ponownego sprawdzenia. Usunięcie dokumentu usuwa jego propozycje z bieżącej sprawy; wcześniej świadomie zapisany scenariusz pozostaje odrębnym zapisem użytkownika.

Rejestr typów obejmuje ZAM, ZUR, ZAO, Z-3/Z-3a/Z-3b, ZAS-12/53/55, Z-15/Z-15a/Z-15b, ZNp-7, OL-9/10 oraz dokumenty rodzinne, ubezpieczeniowe, finansowe i rozstrzygnięcia. Symbol i wersja wzoru to osobne informacje. Nie rozpoznajemy wersji na podstawie samej nazwy pliku lub symbolu. Jeżeli nie ma jednoznacznych metadanych, wersja pozostaje nieustalona. Historyczne symbole nie stanowią rekomendacji do nowych wniosków.

Oficjalne materiały kontrolne:

- [ZUS: uproszczenia formularzy od 24 października 2026](https://www.zus.pl/-/kolejne-uproszczenia-w-zasi%C5%82kach).
- [ZUS: wzory związane z macierzyństwem](https://www.zus.pl/wzory-formularzy/zasilki/zasilek-macierzynski).
- [ZUS: dokumenty do rehabilitacyjnego](https://www.zus.pl/swiadczenia/zasilki/swiadczenie-rehabilitacyjne/z-ubezpieczenia-chorobowego/niezbedne-dokumenty).

## Prywatność i uruchomienie

Plik `File`, pełny tekst, obrazy stron, nazwiska, numery PESEL, hasła i fragmenty źródłowe istnieją wyłącznie w pamięci karty. Nie ma endpointu przesyłania PDF, chmurowego OCR ani zapisu oryginałów w IndexedDB/localStorage. Brak treści w telemetrii/logach. Treść PDF nie jest instrukcją dla programu. Aktywne adnotacje, XFA i skrypty PDF nie są wykonywane. Odczyt nie sprawdza autentyczności ani podpisu dokumentu.

Zwykły automatyczny zapis szkicu jest wyłączony dla danych z PDF. Przy zapisie scenariusza potrzebna jest osobna zgoda. Zapisywane są tylko potwierdzone dane wejściowe, wynik i ograniczona proweniencja (losowy identyfikator, strona, metoda, nazwa pola), bez pliku, fragmentów i identyfikatorów osobowych. Zgodnie z aktualnym ustawieniem aplikacji cały profil, notatki, rejestr oraz scenariusze pozostają wyłącznie w pamięci otwartej strony; zamknięcie, ponowne wejście lub odświeżenie rozpoczyna nową sesję. Starsze dane osobiste aplikacji w localStorage/sessionStorage są usuwane przy uruchomieniu. Scenariusze są dostępne w kalendarzu w bieżącej sesji. Zakładka Doktora Bielika została usunięta; aplikacja nie uruchamia czatu ani nie przekazuje mu kontekstu.

PDF.js i Tesseract.js mają lokalne workery; polski i angielski model, WASM, mapy znaków i fonty są w `dist/vendor`. Nie są potrzebne żadne klucze/API AI. Adresy zasobów są jawnie lokalne, a cache Tesseract jest wyłączony. Do zwykłego uruchomienia wystarczy dotychczasowy serwer Node/kontener, który dostarcza statyczną aplikację. Odczyt i wyliczenie dokumentowej sprawy wykonuje przeglądarka, nie backend. Nie używamy CDN ani ukrytego fallbacku. Zasoby zwiększają wielkość dystrybucji o około 40 MB.

Granice bezpieczeństwa: do 40 plików/sprawę, 32 MB/plik, 180 MB/zestaw, 120 stron/plik i 400 stron/sprawę. Pliki są analizowane kolejno. Render ograniczony do 6 mln pikseli, odczyt jednej strony do 16 tys. elementów; przekroczenie wymaga podziału lub kontroli ręcznej. OCR można przerwać i ponowić. Dokument hasłowany wymaga lokalnego hasła. Rozmiar i nagłówek PDF są sprawdzane, uszkodzenie otrzymuje komunikat bez ujawniania treści.

## Kontrola jakości i granice automatyzacji

Bezpośredni tekst/pola mają pierwszeństwo. Skany i większe obrazy analizuje lokalny OCR pol+eng. Rozpoznawanie korzysta ze współrzędnych, etykiet, nagłówków oraz przypisania miesięcy w tabelach. Brak wartości nie staje się zerem. Składki, pensja brutto i podstawa zasiłku są rozdzielone. Historia płac wymaga rzeczywistych dni pracy/wymaganych; nie wpisuje automatycznie 20 dni.

Niejednoznaczne wydruki nie są „rozwiązywane” zgadywaniem. Odczytane daty i kwoty bez pewnej etykiety są dostępne do ręcznego przypisania z podglądem strony. Rozpoznanie typu nie gwarantuje automatycznego wypełnienia każdego pola każdej wersji formularza. Nie wdrożono weryfikacji kryptograficznej wersji wszystkich urzędowych wzorów ani uniwersalnego semantycznego odczytu dowolnych tabel. Formularze o nietypowym układzie, złożone okresy, niska jakość skanu i brakujące dane wymagają kontroli. Nie potwierdzamy zgodności wszystkich spraw konkursowych z ich rozstrzygnięciami.

Wynik decyzji/wykazu wypłat jest oddzielony od danych wejściowych. Panel testowy porównuje kwoty brutto dopiero po niezależnym obliczeniu i potwierdzeniu osoby, rodzaju świadczenia i zakresu. Różnych zakresów nie porównuje pozornie jako tego samego wyniku. Wynik referencyjny nie jest zapisywany w zwykłym scenariuszu.

Testy: `node --test --test-isolation=none tests/documents.test.mjs`; przeglądarka przy działającym `localhost:61619`: `node tests/documents-browser.mjs` i `node tests/document-session-browser.mjs`. Opcjonalny `document-private-browser.mjs` czyta lokalny prywatny zestaw bez kopiowania, utrwalania, zrzutów ekranu i logowania jego treści; raportuje wyłącznie liczbę stron/pól i stan przetwarzania. Do publicznych testów używamy tylko własnych fikcyjnych PDF-ów, odtwarzalnych przez `scripts/create-document-fixtures.py`.

Licencje i sumy SHA-256 zależności zapisano w `pdf-vendor-manifest.json`; odpowiednie pliki LICENSE są obok zasobów. PDF.js/Tesseract/core: Apache-2.0; szczegóły dodatkowych zasobów, fontów i profili ICC znajdują się w ich dołączonych licencjach. Prywatne foldery i `.env` są ignorowane przez reguły repozytorium. Moduł nie odczytuje w czasie działania folderów materiałów ani szablonów.
