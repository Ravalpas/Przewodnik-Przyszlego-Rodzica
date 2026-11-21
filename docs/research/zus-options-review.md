# Przegląd opcji i luk kalkulatora — ZUS

Weryfikacja: 21 listopada 2026 r. Przejrzano `calculator-core.js`, `calculator-family.js`, `calculator-other.js`, parametry i wcześniejsze analizy. Nie zmieniano kodu, nie wywoływano modelu AI i nie odczytywano `.env`. Poniższe punkty to zalecenia do wdrożenia, a nie deklaracja, że zostały już wykonane.

## Najpilniejsze błędy obecnej implementacji

1. **Prawo nabyte przy porodzie przenosi się wstecz na prenatalny okres.** `calcFamily.add()` wybiera `acquired[parent]` również dla okresu przed porodem. Reprodukcja: poród 1.11.2026, ubezpieczenie matki od 31.10.2026, 42 dni przed porodem, podstawa 6000 zł. Obecny wynik nalicza 140 płatnych dni od 20.09.2026 i 28000 zł. Nie wolno przyznać wypłaty za okres przed rozpoczęciem ubezpieczenia. Prenatalny okres trzeba ocenić osobno i ewentualnie rozciąć w dacie rozpoczęcia tytułu; nabytego przy porodzie prawa nie odbierać natomiast tylko z powodu późniejszego zwykłego ustania umowy. [ZUS — komu przysługuje](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/komu-przysluguje).
2. **Przejęcia wymagają rozróżnienia ubezpieczonej i nieubezpieczonej matki.** Obecny `mother-death` zawsze dodaje dzień, a `mother-incapacity` przyjmuje datę zdarzenia. ZUS rozróżnia zgon uprawnionej matki (od dnia śmierci), porzucenie (od następnego dnia, z warunkiem 8 tygodni w odpowiedniej ścieżce) i niesamodzielność matki bez ubezpieczenia powstałą po porodzie (od następnego dnia). Niesamodzielność istniejąca przed porodem może uruchamiać prawo od porodu. Zwykłe przejęcie po 14 tygodniach nie zastępuje tych wyjątków. [ZUS — okres macierzyńskiego, końcowe sekcje](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego).
3. **Dług jest oceniany zbyt uproszczoną regułą.** Brak pól dotyczących umowy ratalnej/odroczenia, jej terminowego wykonywania i długu poza umową. Terminowo wykonywana umowa oraz brak zaległości poza nią pozwalają uznać brak długu wyłączającego świadczenie. Spłata całości do 6 miesięcy pozwala odzyskać wcześniejszy okres; po tym terminie możliwe jest prawo za dalszy okres od dnia pełnej spłaty. Obecny `blocked` nie rozcina okresu przy późnej spłacie. Termin 6 miesięcy powinien odnosić się do rzeczywistego powstania prawa, a nie być odnawiany przy każdej planowanej części. [ZUS — zadłużenie a macierzyński](https://bip.zus.pl/web/guest/swiadczenia/zasilki/zasilek-macierzynski/komu-przysluguje).
4. **Role indeksów są sztywne.** `parents[0]` jest matką, `parents[1]` ojcem; samo `role` w danych nie steruje obliczeniem. Dla biologicznego porodu trzeba zachować jawny mapping roli i wnioskującego, a dla adopcji/pieczy wskazać opiekuna rozpoczynającego okres. Ojciec powinien mieć dostęp do samodzielnego rodzicielskiego i ojcowskiego bez założenia ubezpieczenia matki. Nie wolno przypisywać każdemu rodzicowi płatnego macierzyńskiego od narodzin. [ZUS — rodzicielski](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-rodzicielskiego).
5. **Różne daty urodzenia jednocześnie przyjmowanych dzieci nie są w pełni obliczane.** Obecny wariant przyjmuje jedną datę i odsyła do ustalonego wymiaru. Należy zebrać daty każdego dziecka i daty przyjęcia/wniosku/przysposobienia; to różne zdarzenia prawne. Nie wolno twierdzić, że ta gałąź jest już w pełni automatyczna.

## Limity podstawy po ustaniu — można wypełnić brakującą tabelę

Limit dotyczy chorobowego i odpowiednio rehabilitacyjnego, nie samego macierzyńskiego. Jest równy 100% właściwego przeciętnego wynagrodzenia. Zmienia się od trzeciego miesiąca kwartału na kolejne trzy miesiące. [ZUS — podstawa pracownika](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-chorobowy/podstawa-wymiaru/dla-pracownikow).

| Okres stosowania | Kwota limitu miesięcznej podstawy |
|---|---:|
| 1.12.2025–28.02.2026 | 8771,70 zł |
| 1.03.2026–31.05.2026 | 9197,79 zł |
| 1.06.2026–31.08.2026 | 9562,88 zł |
| 1.09.2026–30.11.2026 | 9233,13 zł |
| 1.12.2026–28.02.2027 | 9317,01 zł |

Pierwsze cztery wartości potwierdza [tabela ZUS](https://www.zus.pl/baza-wiedzy/skladki-wskazniki-odsetki/wskazniki/minimalne-i-przecietne-wynagrodzenie); ostatnią [komunikat Prezesa GUS z 9.11.2026, MP 2026 poz.1122](https://eli.gov.pl/eli/MP/2026/1122/ogl/pol). Tabela ZUS odczytana w tej weryfikacji kończy się na II kwartale 2026, więc nowego komunikatu nie należy szukać wyłącznie na tej jednej stronie. Nie zamieniać tego wskaźnika na przeciętne wynagrodzenie w sektorze przedsiębiorstw ani na kwotę bez wypłat nagród z zysku.

Pole `postInsuranceCap` jest obecnie puste. Wpisy powinny mieć `from`, `to`, `amount`, dokładnie według powyższych dat. Dalszych kwartałów nie przedłużać bez końca; po wyczerpaniu zweryfikowanej tabeli wskazać brak wskaźnika. Macierzyńskiego nie ograniczać tym limitem.

## Pierwszy niepełny miesiąc — art.49

Źródło: [oficjalne objaśnienie ZUS dla niepracowników](https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/podstawa-wymiaru/dla-ubezpieczonych-niebedacych-pracownikami), sekcja „Niezdolność do pracy powstała przed upływem pełnego kalendarzowego miesiąca ubezpieczenia chorobowego”. Obecna aplikacja obsługuje tylko część tych opcji.

Potrzebne rozróżnienie: czy określono najniższą podstawę, czy istnieje poprzedni tytuł z przerwą do 30 dni, sposób odpłatności i kwota po uzupełnieniu do pełnego miesiąca. Dla JDG nie wystarczy samo podanie przychodu z faktur.

```text
k = 1 − 13,71% = 0,8629

bez poprzedniego tytułu lub przerwa >30 dni, minimum określone:
B = minimum × k

zadeklarowana podstawa, poprzedni tytuł i przerwa ≤30 dni:
n = min(12, 1 + pełne miesiące poprzedniego tytułu)
B = [minimum + max(0, uzupełniona podstawa − minimum) × n/12] × k
```

Uzupełnioną kwotę ogranicza właściwy limit 250% prognozowanego wynagrodzenia. Zlecenie bez ustawowego minimum: kwota miesięczna umowna albo przychód porównywalnych ubezpieczonych, a przy ich braku faktyczny przychód — po właściwym potrąceniu. Dla pełnych miesięcy krótszego ubezpieczenia zachować odrębną formułę art.48a. [Ustawa zasiłkowa, art.48a–49](https://api.sejm.gov.pl/eli/acts/DU/2026/854/text/U/D20260854Lj.pdf).

W interfejsie należy pytać o kwotę uzupełnioną z informacji płatnika albo zebrać dni podlegania i właściwe przychody; nie zastępować brakujących danych zerem. Obecne `first-month` dla zlecenia nie umie tego obliczyć i powinno dostać tę gałąź albo jawny tryb podstawy ustalonej.

## Pozostałe istotne gałęzie

| Obszar | Co zachować lub uzupełnić |
|---|---|
| Wspólna opieka | Obecne pule 41/43, „Za życiem” 65/67, w wariancie szczególnym 38/62, rezerwy po 9, limit 5 części i podwójne zużycie przy równoczesnej opiece są zasadniczo pokryte. W UI nie utożsamiać płatnika z pracodawcą ani ubezpieczonego z osobą zalogowaną. |
| Zasiłek a urlop | Niepracownik może mieć zasiłek bez pracowniczego urlopu. Terminowy wniosek o wariant uśredniony nie jest terminem wygaśnięcia całego prawa. Ojcostwo pozostaje odrębną pulą. |
| Rehabilitacyjne | Można oszacować kwotę z przyjętej podstawy, waloryzacji i okresu. Samo uznanie dalszej niezdolności, rokowania i faktyczny okres wymagają decyzji ZUS. Stawki 90% pierwsze90 dni, następnie75%, w ciąży100%; brak automatycznego przyznania12 miesięcy. [Oficjalna usługa](https://www.gov.pl/web/gov/uzyskaj-swiadczenie-rehabilitacyjne-z-tytulu-ubezpieczenia-chorobowego). |
| Wyłączenia rehabilitacyjnego | Trzeba pytać również o bezpłatny/wychowawczy i urlop dla poratowania zdrowia oraz inne wyłączające świadczenia; obecne flagi nie pokrywają jednoznacznie wszystkich aktywnych tytułów. [ZUS — prawo do rehabilitacyjnego](https://www.zus.pl/pl/swiadczenia/zasilki/swiadczenie-rehabilitacyjne/z-ubezpieczenia-chorobowego/prawo-do-swiadczenia-i-okres-przyslugiwania). |
| Ulgi | Od2026 nowy okres Małego ZUS Plus36 miesięcy na60; wcześniejsza pula do2025 nie pomniejsza nowej. Zbierany licznik ma mieć datę początku aktualnego60-miesięcznego okresu. Obecne `eligible` do preferencji jest uproszczeniem i nie pyta o faktycznie zakończone24 miesiące preferencji; nie powinno na stałe blokować Małego ZUS Plus. [ZUS — reguły2026](https://www.zus.pl/pl/-/%E2%80%9Ema%C5%82y-zus-plus-nowe-zasady-od-2026-r.). |
| Podstawa | Pracownik: faktyczne potrącenia, składniki zachowane podczas świadczenia, premie, absencje, zmiana etatu i ciągłość. Pole 13,71% jest uproszczeniem. Niepracownik: faktyczny przychód bez uzupełniania zwykłych miesięcy absencji; wyjątki pierwszego miesiąca wyżej. |
| Zmiany2027 | Wcześniejsza analiza lokalnych wyciągów wskazuje przyszłe art.9ust4 i art17ust1d–1e oraz zmianę trybu rehabilitacyjnego. Nie aktywować ich w2026. Aktualny odczytany tekst Sejmu ma datę16.09.2026; każdą przyszłą regułę trzeba powiązać z właściwą nowelizacją, datą wejścia i zakresem, nie samym rokiem kalkulacji. |
| Dokumenty | ZAM aktualizowany24.10.2026, wcześniejsze ZUR/ZAO połączone; nie wymagać starych formularzy jako odrębnego obowiązku. Sprawdzić faktyczny wariant wniosek pracowniczy/ZUS, tytuł i adresata. [ZUS — formularz ZAM](https://www.zus.pl/-/wniosek-zas-54-1). |

## Co da się policzyć, a czego kalkulator nie rozstrzyga

Automatycznie: daty i pule z potwierdzonych zdarzeń, wspólne wykorzystanie, stawki z własnej podstawy, reguły pracy w okresie rodzicielskiego, pułapy i wartości według datowanych parametrów, suma wypłat brutto, termin wniosku i porównanie wariantów. Rozliczenie skomplikowanej podstawy jest możliwe przy kompletnych danych, nie na podstawie samego logowania.

Do potwierdzenia: autentyczność tytułu i zatrudnienia, charakter orzeczenia medycznego, podleganie ubezpieczeniu w zbiegu tytułów, rzeczywisty stan konta i umowy ratalnej, wykorzystanie przez drugiego rodzica, uznanie dokumentu sądowego, prawo do świadczenia i jego ostateczna wypłata. Nie oznaczać danych demonstracyjnych jako danych pobranych z państwowej bazy. Pełne pokrycie zadania oznacza widoczną obsługę każdej gałęzi i jawne braki, a nie bezwarunkową gwarancję uprawnienia.

## Testy regresji do dodania przy implementacji

- Powyższy prenatalny przykład: brak kwoty za20.09–30.10 przed ubezpieczeniem.
- Zgon matki ubezpieczonej i nieubezpieczonej: odpowiednie różne daty początku przejęcia; przypadek niesamodzielności sprzed porodu i po porodzie.
- Terminowe raty oraz brak długu poza umową: nominalny dług nie blokuje automatycznie świadczenia.
- Pełna spłata po6 miesiącach: część po spłacie jest możliwa, wcześniejsza nie odzyskuje automatycznie prawa.
- Pierwszy miesiąc JDG po innym tytule: `n=1+poprzednie miesiące`, nie samo minimum.
- Zlecenie kwotowe bez pełnego miesiąca: podstawa z miesięcznej kwoty umownej, nie pracownicza pensja.
- Przejście limitu podstawy31.08/1.09 i30.11/1.12; przyszłego wskaźnika nie stosować wcześniej.
- Adopcja: rozpoczęcie procedury bez przyjęcia nie jest jeszcze spełnieniem obu przesłanek; prawomocność wyroku nie zastępuje daty przyjęcia.
- Rodzina po wykorzystanej preferencji: możliwość oceny Małego ZUS Plus zamiast stałego odrzucenia.
