# Analiza poradnika ZUS 2026: reguły, przykłady i testy kalkulatora

Przejrzano cały ekstrakt wszystkich **42 stron PDF** „Poradnik dla rodziców i opiekunów dzieci”, stan prawny **1.04.2026**, wraz ze wszystkimi tabelami i przykładami. Źródło lokalne: `materialy istotne/Poradnik dla rodziców, ZUS 2026.pdf`; ekstrakt: `aplikacja/artifacts/material-analysis/Poradnik dla rodziców, ZUS 2026.txt`. Weryfikacja internetowa: **21.11.2026**. Nie zmieniano aplikacji ani materiałów, nie wywoływano Fabryka AI i nie kontaktowano się z organizacjami. Ten raport zapisano na osobne polecenie.

**Najważniejszy wniosek:** PDF jest dobrym materiałem wejściowym, ale wymaga korekt i aktualizacji formularzy z października 2026. Reguły opisane jako pochodzące z PDF nie zastępują indywidualnej decyzji ZUS. Liczbowe testy poniżej są specyfikacją do implementacji, nie wynikiem uruchomienia aplikacji.

## Wszystkie nazwane przykłady z PDF — dokładnie trzy

| ID / strona PDF | Wejście | Oczekiwany wynik |
|---|---|---|
| PDF-01 / 16, Adam | Rozpoczęcie JDG 7.05.2026; spełnione warunki ulgi na start | Maj nie jest jednym z sześciu pełnych miesięcy; ulga kończy się 30.11.2026; w tym okresie zdrowotne obowiązkowe, brak chorobowego i świadczeń z tego tytułu |
| PDF-02 / 17, Krzysztof | Nowa JDG 1.03.2026; jednoosobowa sp. z o.o. od 1.09.2023 do 10.02.2024 | Brak prawa do preferencyjnej podstawy 30% minimalnego wynagrodzenia: wcześniejsza pozarolnicza działalność mieści się w ostatnich 60 miesiącach |
| PDF-03 / 21, Maria | Urlop wychowawczy; rozpoczęcie JDG 1.01.2026 | Od tej daty obowiązkowe emerytalne, rentowe i wypadkowe z JDG; ustaje finansowanie emerytalnego/rentowych z tytułu wychowawczego |

Pozostałe fragmenty są opisami reguł, wariantów i przykładami czynności, a nie odrębnymi liczbowymi case studies.

## Korekty, których nie wolno przenieść z PDF do kalkulatora

- Tabela macierzyńskiego powinna mieć **„5 i więcej” → 37 tygodni**, podczas gdy PDF drukuje „>5”, pomijając dokładnie pięcioro dzieci.
- Adopcja sądowa obejmuje dziecko **przed ukończeniem 14 lat**. Próg 7 lat / 10 lat przy odroczeniu dotyczy niezawodowej rodziny zastępczej. ZUS potwierdza również minimum 9 tygodni urlopu na warunkach macierzyńskiego. [ZUS — macierzyński i adopcja](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego)
- Uzupełniający zasiłek przysługuje również ubezpieczonym z JDG i umów cywilnoprawnych; sam urlop pracowniczy przysługuje pracownikom. Masa graniczna to **≤1000 g**, a nie <1000 g. Nie istnieje ogólny wymóg pięciu dni hospitalizacji wcześniaka. [ZUS — uzupełniający](https://www.zus.pl/-/zasi%C5%82ek-macierzy%C5%84ski-za-okres-uzupe%C5%82niaj%C4%85cego-urlopu-macierzy%C5%84skiego)
- PDF pomija zwykły szczególny wymiar rodzicielskiego **38 tygodni**; odpowiada mu **62 tygodnie „Za życiem”** w przypadku art. 183 §3 KP, czyli ścieżki gwarantowanego dziewięciotygodniowego urlopu adopcyjnego. **Nie wybierać automatycznie 38/62 dla każdej adopcji**: podstawowe warianty to nadal 41/43 lub 65/67. [ZUS — rodzicielski](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-rodzicielskiego)
- Zdanie PDF „zasiłek macierzyński nie przysługuje za czas urlopu wychowawczego” nie może blokować świadczenia przy **urodzeniu kolejnego dziecka podczas wychowawczego**. Taka sytuacja daje prawo do macierzyńskiego. [ZUS — uprawnienia rodzicielskie](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-rodzicielskiego)
- Pogrzebowe: zasadniczy termin to **12 miesięcy od śmierci**, nie zawsze od pogrzebu; termin od pogrzebu dotyczy udokumentowanych, niezależnych przeszkód. [ZUS — pogrzebowy](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-pogrzebowy)
- Chorobowe finansowane przez pracodawcę przez 14 dni po 50. roku życia stosuje się **od następnego roku kalendarzowego po 50. urodzinach**. [ZUS — chorobowy](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania)

## Aktualizacja dokumentów obowiązująca od 24.10.2026

Nowy **ZAM** zastępuje ZAM, ZUR i ZAO, obejmując również ojcowski; nowy **Z-15** zastępuje Z-15A i Z-15B. **Z-3b wycofano** — JDG i osoby współpracujące nie muszą go już dostarczać. Jeśli płaci ZUS, sam pobiera polski akt urodzenia z rejestru po danych rodzica i dziecka; jeśli płaci pracodawca, akt nadal jest załącznikiem. Dopuszczono sądowe postanowienie o pieczy wydane jako zabezpieczenie. [ZUS — zmiany październikowe](https://www.zus.pl/-/kolejne-uproszczenia-w-zasi%C5%82kach)

Od 1.07.2026 pracodawca przekazuje dokumenty do ZUS najpóźniej w **7 dni od otrzymania**; dopuszczono szerszą obsługę elektroniczną. [ZUS — zmiany lipcowe](https://www.zus.pl/-/od-lipca-prostsze-zasady-sk%C5%82adania-wniosk%C3%B3w-o-zasi%C5%82ki)

## Parametry i reguły do zintegrowanego kalkulatora

- Oddzielić **prawo do urlopu** od **prawa do zasiłku za odpowiadający mu okres**. Drugie obejmuje również odpowiednio ubezpieczonych niepracowników.
- Każdy rodzic ma własny tytuł ubezpieczenia, podstawę, historię wynagrodzeń, wykorzystane dni i plan okresów. Nie liczyć świadczenia taty od pensji mamy.
- Macierzyński: liczba dzieci **1/2/3/4/≥5 → 20/31/33/35/37 tygodni**. Do 6 tygodni przed porodem wchodzi do tego wymiaru; zwykłe przekazanie ojcu wymaga wykorzystania przez matkę co najmniej **14 tygodni po porodzie**.
- Rodzicielski: **41/43 tygodnie łącznie**, każdemu rodzicowi zarezerwowane nieprzenoszalne **9 tygodni**; indywidualnie zwykle najwyżej **32/34**. Można korzystać jednocześnie — tydzień obojga zużywa dwa tygodnie wspólnej puli. Maksymalnie 5 części; dla biologicznych rodziców koniec roku, w którym dziecko kończy 6 lat.
- „Za życiem”: **65/67 tygodni**, maksymalnie dla jednego rodzica **56/58**; szczególna ścieżka 62 tygodni daje maksymalnie 53 dla jednego. Wymaga ustawowego zaświadczenia o ciężkim i nieodwracalnym upośledzeniu albo nieuleczalnej chorobie zagrażającej życiu, powstałych prenatalnie lub podczas porodu; samo orzeczenie o niepełnosprawności to inne kryterium.
- Ojciec: **14 dni**, raz lub 2×7, przed ukończeniem przez dziecko 12 miesięcy; adopcja — w ciągu 12 miesięcy od prawomocności, przed 14. urodzinami. Prawo samodzielne, niezależne od ubezpieczenia mamy.
- Stawki: macierzyński, ojcowski, uzupełniający **100%**; rodzicielski **70%**; wariant zadeklarowany w 21 dni **81,5%** dla okresów objętych deklaracją; zastrzeżone 9 tygodni drugiego rodzica zawsze **70%**. Niewykorzystanie nawet jednego dnia rodzicielskiego 81,5% w pierwszym roku życia daje możliwość wyrównania macierzyńskiego do 100% na wniosek, a późniejszy rodzicielski 70%. [ZUS — wysokość](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc)
- Uzupełniający: sumować dni hospitalizacji w odpowiednim oknie i dopiero potem `ceil(dni/7)`; **15 tygodni** dla porodu przed ukończeniem 28. tygodnia **lub masy ≤1000 g**; **8 tygodni** dla pozostałych wcześniaków; terminowy wymaga ≥2 kolejnych dni z początkiem między 5. a 28. dobą, a do wyliczenia wchodzą dni od 5. do końca 8. tygodnia. Wieloraczki: najniższa masa i najdłuższa hospitalizacja jednego dziecka. Jednorazowo, bezpośrednio po macierzyńskim; świadectwo szpitala. Dla pracownika wniosek ≥21 dni przed końcem podstawowego urlopu; niepracownik składa przed końcem podstawowego okresu zasiłku.
- Praca u udzielającego rodzicielskiego: najwyżej **½ pełnego etatu**, proporcjonalnie niższy zasiłek i dłuższy urlop; limity ustawowe **82/86 tygodni**, „Za życiem” **130/134**. Przy niepełnym etacie pytać także o wcześniejszy etat — redukcja świadczenia zależy od relacji pracy do wymiaru objętego urlopem. [ZUS — praca i rodzicielski](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-rodzicielskiego)
- Podstawa pracownika: zasadniczo średnia 12 miesięcy przed miesiącem początku świadczenia, po potrąceniu składek pracownika, standardowo **13,71%**. Przy krótszym stażu — pełne miesiące, z osobną obsługą pierwszego miesiąca. Usprawiedliwione miesiące z pracą <½ wyłącza się, a wymagające uzupełnienia uzupełnia. Uwzględnić premie, składniki kwartalne/roczne i zmianę etatu. PIT odejmuje się od wypłaty, **nie od podstawy świadczenia**. [ZUS — podstawa pracowników](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow)
- Niepracownik: średnia podstaw składek chorobowych, nie przychód z faktur. Przy JDG ubezpieczonej krócej niż 12 miesięcy podwyższona zadeklarowana podstawa podlega szczególnej regule części nadwyżki × liczba miesięcy /12; nie stosować bezwarunkowo zwykłej średniej. [ZUS — podstawa niepracowników](https://www.zus.pl/swiadczenia/zasilki/zasilek-opiekunczy/podstawa-wymiaru/dla-ubezpieczonych-niebedacych-pracownikami)
- Podstawa u tego samego pracodawcy pozostaje bez przeliczenia przy ciągłości lub przerwie krótszej niż miesiąc kalendarzowy; zmiana etatu jest wyjątkiem.
- Zasiłki rozliczać za dni kalendarzowe, z dzielnikiem **30**, zaokrągleniem stawki dziennej do groszy i rozbiciem wypłat na faktyczne miesiące. Nie zakładać jednakowej wypłaty w lutym i miesiącu 31-dniowym.
- Podwyższenie do świadczenia rodzicielskiego **1000 zł netto miesięcznie**: sprawdzać sumę macierzyńskich z wszystkich tytułów; części miesiąca proporcjonalnie; **nie obejmuje ojcowskiego**. [ZUS — podwyższenie](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc)

## Chorobowe, opiekuńczy, rehabilitacja i trudne sytuacje

- Chorobowe w ciąży: niezdolność potwierdzona medycznie, kod B / potwierdzenie ciąży; **100% podstawy**, okres do **270 dni** zamiast 182. Sama ciąża nie uzasadnia L4. Sumowanie chorób przy przerwie ≤60 dni; wcześniejsza choroba sprzed ciąży i następna po przerwie w ciąży mogą rozpocząć nowy okres, nawet przy przerwie ≤60.
- Wyczekiwanie chorobowego: zwykle **30 dni obowiązkowego /90 dobrowolnego**, z ustawowymi wyjątkami; nie przenosić tego wymogu na macierzyński i opiekuńczy. Samopłatnik z długiem **>1% minimalnego** ma wstrzymaną wypłatę, z możliwością odzyskania za wcześniejszy okres po pełnej spłacie w 6 miesięcy. [ZUS — chorobowy i dług](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania)
- Rehabilitacyjne: po wyczerpaniu chorobowego, przy dalszej niezdolności i rokowaniu odzyskania zdolności; decyzja orzecznicza, najwyżej **12 miesięcy**. **90% pierwsze 90 dni, potem 75%; w ciąży 100%**, podstawa po właściwej waloryzacji. Nie przedstawiać jako automatycznego przedłużenia L4. [ZUS — prawo](https://www.zus.pl/pl/swiadczenia/zasilki/swiadczenie-rehabilitacyjne/z-ubezpieczenia-chorobowego/prawo-do-swiadczenia-i-okres-przyslugiwania), [ZUS — wysokość](https://www.zus.pl/en/swiadczenia/zasilki/swiadczenie-rehabilitacyjne/z-ubezpieczenia-chorobowego/wysokosc)
- Opiekuńczy **80%**, bez wyczekiwania: zdrowe dziecko <8 lat w określonych zdarzeniach, chore <14, niepełnosprawne <18, inni chorzy członkowie rodziny we wspólnym gospodarstwie. Limity wspólne dla rodziców: **60 dni**, podlimit niepełnosprawności **30**, dorosłych / starszych dzieci **14**. Gdy wyłącznie opieka nad niepełnosprawnym starszym dzieckiem i innymi chorymi członkami rodziny, łącznie **30**, z podlimitem 14. Dodatkowy opiekuńczy w szczególnych pierwszych 8 tygodniach po porodzie jest poza zwykłymi limitami. [ZUS — opiekuńczy](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-opiekunczy/prawo-do-zasilku-i-okres-przyslugiwania)
- Co do zasady brak innego domownika mogącego zapewnić opiekę; wyjątek chore dziecko <2 lat. Nie traktować jako dostępnego opiekuna osoby chorej, całkowicie niezdolnej do pracy, niesprawnej z racji wieku, rolnika, przedsiębiorcy, odpoczywającej po nocnej zmianie ani niezobowiązanej osoby odmawiającej opieki.
- Martwe urodzenie lub śmierć przed 8. tygodniem: **56 dni po porodzie, co najmniej 7 dni od śmierci**; śmierć późniejsza — 7 dni, z uwzględnieniem żyjącego rodzeństwa z porodu mnogiego. Zaświadczenie lekarza specjalisty, lekarza specjalizującego się lub położnej może zastąpić akt przy martwym urodzeniu; nie wymagać ustalenia płci. [ZUS — dokumenty po stracie](https://bip.zus.pl/pl/web/guest/-/nowe-zasady-sk%C5%82adania-dokument%C3%B3w-do-zasi%C5%82ku-macierzy%C5%84skiego-i-zasi%C5%82ku-pogrzebowego-w-przypadku-gdy-dziecko-urodzi-si%C4%99-martwe)
- Pogrzebowe **7000 zł dla rodzica**, także przy kosztach niższych; potrzebne poniesienie kosztów i dokumenty. Osobie spoza rodziny zwraca się udokumentowane koszty do limitu.
- Hospitalizacja matki/dziecka, śmierć matki, porzucenie, niezdolność do samodzielnej egzystencji i podjęcie pracy przez wcześniej nieubezpieczoną matkę wymagają osobnych ścieżek przejęcia opieki. Zwykła reguła „14 tygodni tylko matka” nie wyczerpuje tych wyjątków. Po 8 tygodniach po porodzie możliwa jest przerwa macierzyńskiego z powodu hospitalizacji dziecka. [MRPiPS — szczególne sytuacje](https://www.gov.pl/web/rodzina/urlop-macierzynski)

## Pozostałe tabele i ubezpieczenia z PDF

Tabela na str. 13 rozróżnia okres obowiązku dla: jednoosobowej sp. z o.o. — wpis/nabycie udziałów do wykreślenia/zbycia wszystkich; spółek osobowych i komplementariusza SKA — wpis/nabycie praw do wykreślenia/zbycia; PSA za pracę/usługi — rzeczywisty okres świadczenia; pozostałej działalności — rozpoczęcie do zaprzestania. Zawieszenia wyłączają odpowiednie okresy.

Tabela na str. 22: osobista opieka po ≥6 miesiącach działalności — emerytalne/rentowe od 60% prognozowanego; po zleceniu dodatkowo ograniczenie średnią wcześniejszych 6 miesięcy i dolnym 75% minimalnego. Bez wymaganych warunków — tylko emerytalne od 75% minimalnego. Wychowawczy: średnia 12 miesięcy ograniczona do 75% minimalnego–60% prognozowanego; inny obowiązkowy tytuł lub emerytura/renta zmienia uprawnienia. Nie przedstawiać składek państwa jako pieniędzy wypłacanych rodzicom.

Etat obowiązkowo obejmuje chorobowe; zlecenie/JDG dobrowolnie wyłącznie przy obowiązkowych emerytalnym/rentowych. Student/uczeń <26 na samym zleceniu, dzieło poza własnym pracodawcą, działalność nierejestrowa i ulga na start nie tworzą samodzielnie chorobowego. Etat ≥minimalnego zwykle wyłącza obowiązkowe społeczne z równoległej JDG/zlecenia, a więc i możliwość dobrowolnego chorobowego z nich. Po macierzyńskim przy dobrowolnym chorobowym konieczne ponowne zgłoszenie.

2026: minimalne **4806 zł**, prognozowane **9420 zł**, zwykła podstawa JDG **5652 zł**, preferencyjna **1441,80 zł**, maksymalna dobrowolnego chorobowego **23550 zł**, roczny limit emerytalnego/rentowych **282600 zł**, próg długu **48,06 zł**. [ZUS — składki 2026](https://www.zus.pl/baza-wiedzy/skladki-wskazniki-odsetki/skladki/wysokosc-skladek-na-ubezpieczenia-spoleczne)

Mały ZUS+: limit przychodu 120000 zł proporcjonalnie do dni prowadzenia w poprzednim roku, co najmniej 60 dni; dochód miesięczny = `dochód roczny / dni × 30`, następnie ×0,5, ograniczony do 1441,80–5652 zł; dla ryczałtu dochód przyjmuje się jako 0,5 przychodu; dolicza się społeczne zaliczone w koszty. PDF opisuje 36 miesięcy w 60 i dodatkowe 12 dla korzystających w 2023. To mechanizm **podstaw składek**, a nie podstawa zasiłku wprost.

## Macierz dodatkowych testów implementacji

| Zestaw wejść | Oczekiwany wynik |
|---|---|
| Liczba dzieci 1,2,3,4,5,6 | Macierzyński odpowiednio 140,217,231,245,259,259 dni |
| Jedno dziecko; mama 32 + tata 9 rodzicielskiego | Pula 41 wykorzystana |
| Jedno dziecko; mama 20 + tata 21 | Pula 41 wykorzystana prawidłowo |
| Jeden rodzic chce 41; drugi nic | Maksymalnie 32; 9 nieprzenoszalnych |
| Dwoje dzieci; jeden rodzic | Maksymalnie 34 z 43 |
| „Za życiem” jedno/dwoje dzieci | Rodzicielski 65/67; jeden rodzic maks. 56/58 |
| Szczególna ścieżka adopcyjna 9 tygodni | Rodzicielski 38; z „Za życiem” 62 |
| 6 tygodni macierzyńskiego przed porodem, potem 14 | Przy jednym dziecku całe 20 zużyte; brak 6 do przekazania |
| 27 tygodni, 1200 g, 1 dzień szpitala | 1 tydzień uzupełniającego |
| 30 tygodni, 1000 g, 70 dni szpitala | Kategoria 15 tygodni; 10 tygodni świadczenia |
| 30 tygodni, 1001 g, 70 dni szpitala | Kategoria 8; uwzględnić najwyżej pierwsze 56 dni → 8 tygodni |
| 35 tygodni, hospitalizacje 3 + 5 dni | Łącznie 8 dni → 2 tygodnie, nie zaokrąglać poszczególnych pobytów przed sumowaniem |
| Terminowy; pobyt tylko do 4. doby | Brak uzupełniającego |
| Terminowy; pobyt 5.–6. doba | 1 tydzień |
| Terminowy; hospitalizacja zaczyna się 29. doby | Nie spełnia warunku rozpoczęcia 5.–28. |
| Wieloraczki 900/1600 g, najdłuższa hospitalizacja 80 dni | Kategoria 15, `ceil(80/7) = 12 tygodni` |
| Etat: wniosek uzupełniający 20 dni przed końcem | Niespełniony termin 21 dni |
| JDG; brak etatu, spełniona hospitalizacja | Nie odrzucać zasiłku z powodu braku urlopu pracowniczego |
| Wniosek wariantu 81,5% dzień 21 / dzień 22 | 81,5% / 100 + 70% |
| Pensja brutto 6000 zł przez 12 miesięcy | Podstawa zasiłku 5177,40 zł; dzień 100% = 172,58; 81,5% = 140,65; 70% = 120,81; 80% = 138,06 |
| Powyższa stawka 81,5%; 28/30/31 dni | 3938,20 / 4219,50 / 4360,15 zł brutto |
| Mama 6000, tata 9000; jego 9 tygodni 70% | Jego podstawa 7766,10; dzień 181,21; 63 dni 11416,23 zł brutto |
| Pełny miesiąc zasiłków netto 600 + 200 z dwóch tytułów | Jedno podwyższenie 200 do łącznej 1000; nie 2 × 1000 |
| Ojcowski netto poniżej 1000 | Brak podwyższenia do 1000 |
| Pełny etat, 32 tygodnie rodzicielskiego stale z pracą ½ także w wydłużeniu | 64 tygodnie kalendarzowe; proporcjonalnie zmniejszony zasiłek; pozostała rezerwa drugiego rodzica osobno |
| 10 tygodni łączone z pracą ½; bez pracy w wydłużeniu | Dodatkowe 5 tygodni |
| 50. urodziny w 2026 | Limit wynagrodzenia chorobowego 33 dni w 2026; 14 od 2027 |
| Choroba przed ciążą, 1 dzień przerwy, kolejna w ciąży | Nowy okres 270 dni |
| Choroby zwykłe; przerwa 60 / 61 dni | Ten sam / nowy okres zasiłkowy |
| Dobrowolne chorobowe 89 / 90 ukończonych dni | Standardowo brak prawa / prawo od następnego dnia po 90 |
| Dług 48,06 / 48,07 zł w 2026 | Nie przekracza / przekracza próg 1% |
| Chore dziecko 18 miesięcy, drugi domownik dostępny | Wyjątek: możliwy opiekuńczy |
| Chore dziecko 3 lata, dostępny zdolny opiekun | Co do zasady brak opiekuńczego |
| Zamknięcie przedszkola; zawiadomienie 6 / 7 dni wcześniej | Nieprzewidziane / nie spełnia tego kryterium |
| Rodzice wykorzystali 35 + 25 dni zwykłego opiekuńczego | Limit 60 wyczerpany wspólnie |
| Wyłącznie dziecko niepełnosprawne 16 lat + dorosły; wykorzystano 30 | Brak kolejnych 30; wspólny limit tej konfiguracji 30 |
| Martwe urodzenie, brak aktu, prawidłowe zaświadczenie | Nie wymagać badania płci ani aktu jako warunku świadczenia |
| Śmierć dziecka 50. dnia | Co najmniej 7 dni od śmierci, nawet jeśli poza 56. dzień |
| Rodzic płaci pogrzeb 3000 zł, śmierć w 2026 | Pogrzebowe 7000 zł |
| Poród podczas wychowawczego | Nowe prawo do macierzyńskiego; nie blokować |
| Listopad 2026; wnioskująca JDG | ZAM, bez obowiązkowego Z-3b |
| Listopad 2026; opieka nad dzieckiem/dorosłym | Aktualny Z-15 w obu ścieżkach |

Dodatkowy liczbowy przykład z oficjalnej strony ZUS, użyteczny do kalendarza: JDG, poród 20.03.2025, 35. tydzień, 2800 g, 3 tygodnie hospitalizacji; podstawowy macierzyński do 6.08.2025, uzupełniający 7–27.08.2025, rodzicielski od 28.08.2025. [ZUS — przykład](https://www.zus.pl/-/zasi%C5%82ek-macierzy%C5%84ski-za-okres-uzupe%C5%82niaj%C4%85cego-urlopu-macierzy%C5%84skiego)

## Kontakty organizacji — oficjalne strony i konkretne bezpłatne formy pomocy

| Organizacja / sytuacja | Kontakt i zakres |
|---|---|
| **Fundacja Ernesta** — poronienie, strata okołoporodowa, trudności psychiczne/prawne | `pomoc.psychologiczna@fundacjaernesta.pl`, 22 350 00 50 wew. 1; prawne: `pomoc.prawna@fundacjaernesta.pl`. Fundacja deklaruje bezpłatność całej swojej pomocy. [Kontakt](https://fundacjaernesta.pl/kontakt/), [wsparcie psychologiczne](https://fundacjaernesta.pl/wsparcie-psychologiczne/) |
| **Fundacja Ernesta — wcześniaki** | `wczesniaki@fundacjaernesta.pl`; bezpłatne konsultacje i koordynacja wybranych specjalistów, m.in. neonatologa, psychologa, fizjoterapeuty; część pomocy stacjonarnie w Warszawie. [Program](https://fundacjaernesta.pl/wczesniaki/) |
| **Fundacja Nagle Sami — strata dziecka/poronienie, żałoba** | **800 108 108**, pon.–pt. 14:00–20:00, bezpłatna i anonimowa linia. W aplikacji kierować do tej konkretnej bezpłatnej formy, ponieważ fundacja prowadzi także odpłatną terapię. [Telefon wsparcia](https://naglesami.org.pl/telefon-wsparcia-zaloba/) |
| **Fundacja Wcześniak Rodzice–Rodzicom** | 22 121 80 55, pon.–pt. 8:00–16:00, `wczesniak@wczesniak.pl`; bezpłatny Niezbędnik, wypożyczalnia sprzętu, wsparcie rodziców w programie Mentor. [Kontakt](https://wczesniak.pl/kontakt/), [bezpłatne działania](https://wczesniak.pl/swiatowy-dzien-wczesniaka/) |
| **Fundacja Gajusz — ciężka nieuleczalna choroba prenatalna, wsparcie rodziny** | **722 003 003** — dyżury także wieczorem/weekend; rejestracja również 722 202 288 pon.–pt. 8:00–16:00. Bezpłatna opieka hospicjum perinatalnego w Łodzi, także dla rodzin spoza województwa; do objęcia opieką potrzebne skierowanie lekarza NFZ. [Zasady pomocy](https://gajusz.org.pl/jak-pomagamy/hospicjum-perinatalne/pomoc/), [kontakt](https://gajusz.org.pl/kontakt/) |
| **Fundacja Hospicyjna — Tumbo Pomaga** — dzieci/rodzeństwo i opiekunowie w żałobie | **800 111 123**, `info@tumbopomaga.pl`; materiały i wsparcie po stracie; bezpłatna terapia stacjonarna dla mieszkańców Gdańska. Godziny dyżurów sprawdzać na stronie zamiast wpisywać niepotwierdzone. [Jak pomagają](https://tumbopomaga.pl/jak-pomagamy.html), [zgłoszenie po pomoc](https://www.tumbopomaga.pl/potrzebuje-pomocy.html) |

Nie rekomenduje się wpisywania `dlaczego.org.pl` jako zweryfikowanego aktualnego kontaktu: oficjalna strona zwracała 403, a wyników z innych organizacji nie potraktowano jako potwierdzenia zgodnego z wymaganiem. Przy Tęczowym Kocyku występują rozbieżne domeny i treści; celowo nie podano niesprawdzonego kontaktu.

## Granice implementacji i pozostałe tematy

**Liczyć:** daty i dzienne/miesięczne kwoty zasiłków; pule rodziców i ich zużycie przy jednoczesności; macierzyński przed i po porodzie; rodzicielski, ojcowski, uzupełniający; „Za życiem”; przejścia między okresami; podstawę w obsługiwanych scenariuszach; chorobowe i opiekuńczy z limitami; porównanie wariantów 81,5% i 100/70%; sprawdzone terminy i warunki ulg. W złożonej historii podstawy, pierwszym miesiącu, podwyższaniu JDG, zmianach etatu i ulgach nakładających się na siebie potrzebna jest jawna informacja o założeniach, a nie pozorna dokładność.

**Informacyjnie z warunkami i dokumentami:** decyzja o rehabilitacyjnym i jego waloryzacji, orzeczenia i zaświadczenia, nietypowe przejęcie świadczeń po śmierci lub porzuceniu, prawo do państwowych składek podczas osobistej opieki, pomoc charytatywna i ochrona zatrudnienia. Wysokość rehabilitacyjnego można oszacować dopiero po podaniu uznanej podstawy i okresu decyzji. Kontakty organizacji nie oznaczają gwarancji dostępnego miejsca, terminu ani finansowania konkretnej terapii.

**Świadczenie rodzicielskie:** PDF wspomina o nim jako alternatywie dla osób bez prawa do zasiłku macierzyńskiego, np. bezrobotnych, studentów i osób na umowie o dzieło. Nie należy mylić go z podwyższeniem zasiłku macierzyńskiego do 1000 zł. Szczegółowego niezależnego kalkulatora kryteriów świadczenia rodzicielskiego nie zweryfikowano w tym badaniu.

**800+ i Aktywny Rodzic:** nie są przedmiotem omawianego 42-stronicowego poradnika o ubezpieczeniach i świadczeniach chorobowych. Nie należy dopisywać ich jako „zbadanych w poradniku”. Aktualne warunki, wyłączenia i kwoty tych programów wymagają oddzielnej weryfikacji przed włączeniem do wspólnego wyniku pieniężnego.

**Prawa pracownicze:** PDF odsyła do PIP w sprawie ochrony stosunku pracy w ciąży. W tym badaniu zweryfikowano oficjalne wyjaśnienie o łączeniu rodzicielskiego z pracą: do ½ etatu u udzielającego urlopu, proporcjonalne wydłużenie; odrębna praca u innego pracodawcy nie podlega temu samemu mechanizmowi. Nie rozstrzygano automatycznie legalności rozwiązania konkretnej umowy ani wszystkich wyjątków ochronnych. [PIP — łączenie rodzicielskiego z pracą](https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/czy-pracownik-moze-laczyc-urlop-rodzicielski-z-wykonywaniem-pracy)

**Dodatkowe parametry ulg z PDF:** ulga na start do 6 miesięcy kalendarzowych; rozpoczęcie pierwszego dnia miesiąca wlicza ten miesiąc, w innym dniu nie wlicza. Warunki: pierwsza działalność lub powrót po co najmniej 60 miesiącach od zawieszenia/zakończenia oraz brak takich samych czynności dla byłego pracodawcy z bieżącego/poprzedniego roku. Zdrowotne pozostaje, społecznego/chorobowego nie ma. Można z ulgi zrezygnować przez zgłoszenie do społecznych. Preferencyjna podstawa: minimum 30% minimalnego, okres 24 miesięcy kalendarzowych, warunek nieprowadzenia pozarolniczej działalności w ostatnich 60 miesiącach oraz wyłączenie takich samych czynności dla byłego/obecnego pracodawcy. Początek po pełnej uldze na start albo po skutecznym wcześniejszym zgłoszeniu. Mały ZUS+ wykluczają m.in. prawo do preferencji, mniej niż 60 dni działalności w poprzednim roku, karta podatkowa ze zwolnieniem VAT, inna pozarolnicza działalność w poprzednim roku oraz odpowiednie czynności dla byłego pracodawcy. To zapis zakresu PDF; aktualizację jego szczegółowych reguł okresów Małego ZUS+ należy osobno zestawić z bieżącym wyjaśnieniem ZUS przed produkcyjnym wdrożeniem.

**Wypłata i przedawnienie z PDF:** płatnik zgłaszający powyżej 20 ubezpieczonych chorobowo zasadniczo wypłaca zasiłki sam, do 20 — ZUS; stan liczby osób zasadniczo na 30 listopada poprzedniego roku. JDG otrzymuje wypłatę z ZUS. ZUS wypłaca do 30 dni od wyjaśnienia ostatniej niezbędnej okoliczności. Roszczenia chorobowego i macierzyńskiego zasadniczo przedawniają się po 6 miesiącach; PDF wskazuje 3 lata przy błędzie płatnika/ZUS dla chorobowego oraz przesunięcie terminu przy niezależnej przeszkodzie w zgłoszeniu macierzyńskiego. Dokumenty i ścieżki wnioskowania trzeba stosować według aktualizacji październikowej powyżej.
