# Tożsamość, eZUS i rzeczywiste dane do kalkulatora

Weryfikacja: 21.11.2026. Badano wyłącznie oficjalne materiały MC, ZUS, BIP ZUS i ELI. Nie wykonano logowania na konto użytkownika, połączenia z kontem ZUS ani zapytań do modelu. Raport rozróżnia potwierdzone funkcje państwowe od propozycji implementacji prototypu.

## 1. Zasadniczy podział: uwierzytelnienie i udostępnienie danych

Samo zalogowanie przez mObywatel, Profil Zaufany, bankowość lub e-dowód potwierdza tożsamość w systemie, do którego użytkownik się loguje. Nie daje naszej aplikacji sesji eZUS ani uniwersalnego uprawnienia do pobierania zarobków, składek czy zwolnień. Logowanie na stronie ZUS oraz logowanie w zewnętrznym kalkulatorze to odrębne integracje. ZUS opisuje uzupełnianie danych identyfikacyjnych podczas rejestracji w eZUS; nie jest to deklaracja udostępnienia konta dowolnej aplikacji. [ZUS — rejestracja i uwierzytelnianie](https://www.zus.pl/portal/pomoc/rejestracja_i_uwierzytelnianie.html), [ZUS — rejestracja przez login.gov.pl](https://bip.zus.pl/pl/web/guest/baza-wiedzy/o-portalu-pue-/jak-zarejestrowac-konto-na-pue).

W dokumentacji Węzła Krajowego zestaw minimalny obejmuje imiona, nazwiska, datę urodzenia oraz trwały identyfikator osoby. Nie należy bez weryfikacji schematu zamieniać każdego identyfikatora na PESEL. Integracja DU wymaga formalnego przyłączenia oraz spełnienia wymogów interoperacyjności i bezpieczeństwa; nie jest dodaniem zwykłego przycisku OAuth. [MC — integratorzy](https://www.gov.pl/web/login/dla-integratorow2), [MC — dokumentacja integracji](https://www.gov.pl/web/cyfryzacja/wezel-krajowy---dokumentacja-dotyczaca-integracji-z-wezlem-krajowym), [oficjalne FAQ, pytanie 4](https://www.gov.pl/attachment/591f8473-49dd-4476-b75d-6425aa81beff).

## 2. mObywatel jako osobna usługa przekazania danych

MC udostępnia również usługę dla podmiotów publicznych i prywatnych: użytkownik świadomie przekazuje wybrany zestaw danych, a podmiot integruje mObywatel_BackSystem/API, uzyskuje certyfikaty i przechodzi wymagane procedury oraz testy. Wniosek i akceptacja OWU poprzedzają produkcję. To inny mechanizm niż samo logowanie przez Węzeł. [MC — usługa przekazywania danych](https://www.gov.pl/web/cyfryzacja/informacje-o-aplikacji-mobywatel.).

OWU 0.8, §2 ust.6: zestaw 0 zawiera imiona, nazwisko, PESEL i obywatelstwo; zestaw 1 obejmuje też określone dane z PESEL/RDO, m.in. datę i miejsce urodzenia oraz dokument tożsamości. Zakres jest ustalany w integracji i przedstawiany użytkownikowi. Nie oznacza dostępu do dowolnej usługi widocznej w aplikacji mObywatel. Do kalkulatora potrzebne są najwyżej podstawowe dane identyfikacyjne i data urodzenia rodzica; zdjęcie i seria dokumentu nie ułatwiają wyliczenia. [OWU 0.8 — oficjalny PDF](https://www.gov.pl/attachment/90d46899-76bd-4b1f-9df2-344ddb6e2f59).

Roli matka/ojciec/opiekun nie ustala się z imienia, płci ani PESEL. Podobnie tożsamość nie potwierdza ciąży, przewidywanego porodu, adopcji, ustania zatrudnienia, zaświadczenia „Za życiem” lub historii drugiego rodzica. Są to osobne dane/formalne dokumenty lub deklaracje użytkownika.

## 3. Co użytkownik rzeczywiście może dostarczyć z eZUS

### Ubezpieczony

ZUS umożliwia utworzenie zaświadczenia obejmującego wybrane aktualne zgłoszenia, podstawy składek, przerwy w pracy i członków rodziny zgłoszonych do zdrowotnego. Dokument można pobrać jako PDF/XML; jest opatrzony pieczęcią ZUS. Nie wszystkie sekcje muszą być wybrane. Sam parser XML nie weryfikuje pieczęci. [ZUS — zaświadczenie ubezpieczonego](https://www.zus.pl/baza-wiedzy/o-portalu-pue-/samodzielne-tworzenie-potwierdzen-z-danymi-z-zus/dla-ubezpieczonych).

### Płatnik

Zaświadczenie płatnika może obejmować saldo i rozliczenia miesięczne, status płatnika, liczby ubezpieczonych oraz wybrane dane zdrowotnego JDG. Eksport to PDF/XML. Bieżące saldo nie jest automatycznie historyczną kwotą długu na dzień powstania prawa; trzeba sprawdzić datę i znaczenie salda. [ZUS — zaświadczenie płatnika](https://www.zus.pl/baza-wiedzy/o-portalu-pue-/samodzielne-tworzenie-potwierdzen-z-danymi-z-zus/dla-platnikow).

### Świadczeniobiorca i oficjalne schematy

BIP ZUS publikuje trzy XSD do automatyzacji odczytu tych dokumentów. Pobrano niezmienione publiczne schematy do `identity-schemas/insured.xsd`, `payer.xsd`, `beneficiary.xsd`. Schemat świadczeniobiorcy pozwala rozpoznać m.in. wypłacone zasiłki i ich okresy/kwoty. [BIP ZUS — schematy XSD](https://bip.zus.pl/inne/wymagania-dla-oprogramowania-interfejsowego/potwierdzenia-danych-z-zus-schemat-plikow-xsd).

W plikach nie znaleziono zakazu rozpowszechniania ani dołączonej licencji ograniczającej implementację. ZUS udostępnia je wprost dla instytucji przyjmujących zaświadczenia; zachowano oryginalne pliki i wskazano pochodzenie. To stwierdzenie o opublikowanych materiałach, nie nadanie im przez aplikację własnej licencji.

## 4. Dokładna struktura do parsera XML

W trzech XSD korzeniem jest `potwierdzenie`, bez zadeklarowanego targetNamespace. Liście poniżej są `xs:string`, także kwoty, kody i daty — XSD nie zapewnia ich semantycznej poprawności. Daty i pieniądze wymagają osobnej walidacji; nie stosować `Number('')`, nie przekształcać pustych dat w dzisiejsze.

| Sekcja / ścieżka od `potwierdzenie` | Pola liściowe | Zastosowanie w kalkulatorze |
|---|---|---|
| metadane dokumentu | `data_pisma`, `znak_pisma`, `data_potwierdzenia` | Zachować osobno datę pisma i datę potwierdzenia; nie ma pola `data_dokumentu` |
| `blok_danych_ubezpieczonego` | `imie`, `nazwisko`, `pesel`, `seria_nr_dok` | Wybór właściciela importu, nie rola rodzicielska |
| `zgloszenia_do_ubezpieczen/zgloszenia_do_ubezpieczen_chorobowe/zgloszenie_do_ubezpieczen` | `platnik`, `kod_tytulu_ubezpieczenia`, `data_od`, `data_do` | Osobny tytuł/okres chorobowego; pokaż przed zastosowaniem |
| analogiczne grupy `_emerytalne`, `_rentowe`, `_wypadkowe`, `_zdrowotne` | Te same cztery pola | Nie utożsamiać zdrowotnego z chorobowym |
| `podstawy_wymiaru_skladek_emerytalne_rentowe/podstawa_wymiaru_skladek_emerytalne_rentowe` | `platnik`, `okres`, `kwota` | Odczyt porównawczy, **nie automatyczna pensja/podstawa zasiłku** |
| `podstawy_wymiaru_skladek_zdrowotne/podstawa_wymiaru_skladek_zdrowotne` | `platnik`, `okres`, `kwota` | Nie wypełnia podstawy chorobowego |
| `przerwy_w_pracy/przerwa_w_pracy` | `platnik`, `swiadczenie`, `data_od`, `data_do` | Historia do potwierdzenia; nie sumować automatycznie wszystkich przerw jako jednego okresu zasiłkowego |
| `czlonkowie_rodziny/czlonek_rodziny` | `imie_nazwisko`, `pesel`, `data_od`, `pokrewienstwo` | Dane zgłoszenia zdrowotnego; nie potwierdzenie adopcji ani pełna lista dzieci |
| `blok_danych_platnika` | m.in. `nazwa_skrocona`, `nip`, `regon`, `pesel`, `imie`, `nazwisko` | Wybór własnego płatnika / identyfikacja dokumentu |
| `salda/saldo` | `saldo_calosc`, `ostatnia_dra`; pod `saldo_podzial`: `okres_sprawozd`, `okres_rozl`, `kwota_dra`, `wplata_sprawozd`, `saldo_sprawozd` | Wyświetlić kwoty i daty; ręcznie potwierdzić dług na dzień prawa |
| `liczba_ubezp/okresy` | `okres`, `liczba_ubezp_raporty`, `liczba_ubezp_dra` | Pomocnicze, nie automatyczny wybór płatnika zasiłku bez właściwego dnia ustawowego |
| `blok_danych_swiadczeniobiorcy` | `imie`, `nazwisko`, `pesel`, `seria_nr_dok` | Właściciel historii świadczeń |
| `zasilki/lista_swiadczen/swiadczenie` | `rodzaj_swiadczenia`, `okres_od`, `okres_do`, `kwota_brutto`, `kwota_netto` | Rozpoznany okres i wypłata; potwierdzić rodzaj/tytuły przed wykorzystaniem |
| `zasilki/ma_przyznane_prawo_do/swiadczenie` | `rodzaj_swiadczenia`, `okres_od`, `okres_do` | Prawo wykazane w dokumencie, bez wymyślania podstawy z kwoty |
| `zasilki/po_ustaniu_ubezpieczenia/swiadczenie` | `rodzaj_swiadczenia`, `okres_od`, `okres_do`, `status` | Historia po ustaniu, nie oznacza automatycznie obecnego prawa |

Puste `data_do` odczytuj jako brak wskazanej daty końca. Zaświadczenie sprzed planowanego zdarzenia nie potwierdza, że ubezpieczenie nadal będzie trwało w przyszłości. `data_do` nie jest dowodem przyczyny rozwiązania umowy; nie ustawiaj `endReason` na podstawie samej daty. Brak sekcji chorobowego może wynikać z zakresu zamówionego zaświadczenia; nie ustawiaj wtedy `coverage=none`.

W XSD występują nietypowe kombinacje `xs:choice` i powtarzalności oraz znaki zastępcze w niektórych nieużywanych nazwach. Nie zgadywać napraw schematu i nie pobierać `schemaLocation` z importowanego XML. Bezpieczny parser powinien rozpoznawać tylko opublikowane struktury i czytelnie odrzucać pozostałe. Nie wykonywać DTD, encji zewnętrznych, XSL ani instrukcji z pliku. Publiczne schematy nie są plikami z danymi klientów.

## 5. Kod tytułu: ścisłe, ograniczone mapowanie

Podstawa: [Dz.U. 2026 poz.518, załącznik 24](https://eli.gov.pl/api/acts/DU/2026/518/text/O/D20260518.pdf), strony PDF48–51. Kod ma sześć cyfr: podstawowy tytuł to pierwsze cztery, dalsze cyfry niosą odrębne informacje. Usuwaj wyłącznie odstępy; wymagaj sześciu cyfr, zachowuj zera i oryginalną wartość.

Bezpieczna **sugestia**, nie automatyczne przyznanie:

| Prefiks | Sugestia |
|---|---|
| `0110`, `0111` | `occupation=employee` |
| `0411`, `0417` | `occupation=contract` |
| `0510`, `0512`, `0570`, `0572`, `0590`, `0592` | `occupation=business` |
| `0540` | `occupation=startup`, brak chorobowego z tego konkretnego tytułu |
| pozostałe | Brak mapowania; zachować opis i poprosić o potwierdzoną klasyfikację |

Nie mapować wszystkich `01xx` jako zwykłych pracowników ani wszystkich `05xx` jako JDG: istnieją tytuły historyczne, współpracownicy, spółki, artyści i osoby pobierające świadczenia. Kod nie potwierdza podstawy, etatu, przyczyny ustania ani długości wyczekiwania. Dla rozpoznanego pracownika i wykazanego chorobowego można zasugerować `compulsory`; dla rozpoznanego zleceniobiorcy/JDG i wykazanego chorobowego — `voluntary`, po potwierdzeniu konkretnego tytułu i zbiegu ubezpieczeń. Brak chorobowego w pliku nie jest dowodem nieubezpieczenia. [ZUS — przewodnik dla rozpoczynających JDG](https://www.zus.pl/documents/10182/167567/przewodnik_dla_rozpoczynajacych_dzialalnosc.pdf/2c941ac8-8e3f-4dfe-80a1-1d2340d908ce).

## 6. e-ZLA: plik jest możliwy, pełne API ma odrębny zakres

ZUS opisuje eksport XML/CSV przetworzonych zwolnień; anulowane/skorygowane dokumenty trzeba odróżnić. Instrukcje dotyczą przede wszystkim profilu płatnika/pełnomocnika, więc nie obiecywać identycznych uprawnień każdemu rodzicowi. [ZUS — eksport e-ZLA](https://psz.zus.pl/pl/web/guest/ezla/eksport-e-zla-z-ezus), [ZUS — pytania o oprogramowanie](https://www.zus.pl/pl/ezla/najczesciej-zadawane-pytania/oprogramowanie).

Istnieje rzeczywista usługa raportów dla płatników. Korzysta z odrębnego loginu/hasła usługi ustawianych przy harmonogramie raportu i NIP, nie z tokenu logowania rodzica. Odpowiedź zawiera zaszyfrowany ZIP. Wzór raportu `raportEzla` ma `dokumentyEzla/daneDokumentu/okresZwolnienia/{dataOd,dataDo}`, `status`, `kodChorobyB`, okres szpitalny i dane osoby pod opieką. Kod B jest informacją z zaświadczenia, nie rozpoznaniem diagnozy przez aplikację. Aktualna instrukcja obowiązuje od 13.02.2026. [BIP ZUS — usługa raportów](https://bip.zus.pl/pl/inne/wymagania-dla-oprogramowania-interfejsowego/usluga-do-pobierania-raportow-e-zla-dla-platnikow), [instrukcja PDF](https://bip.zus.pl/documents/493361/0/e-ZLA%2BInstrukcja%2Bskorzystania%2Bz%2B%2Bus%C5%82ugi%2Bdo%2Brapot%C3%B3w%2Bdla%2Bp%C5%82atnika%2B21.11.20....pdf/ccdbcd11-e6f3-46f4-0325-3f1bba207922?t=1765377095363).

Nie znaleziono w przejrzanych źródłach publicznego, uniwersalnego API OAuth „zaloguj rodzica i pobierz całe konto ZUS”. To nie stwierdzenie, że żadna integracja instytucjonalna nie istnieje; produkcyjne udostępnienie wymaga odrębnego uzgodnienia z ZUS. Samo przekierowanie na stronę eZUS nie zwraca danych naszej aplikacji.

## 7. Proponowany model importu i sugestii

Propozycja implementacyjna:

```js
{
  sourceKind: 'zus-insured-xml', // lub payer, beneficiary, ezla-report
  documentDate: null,            // data_pisma po walidacji
  confirmedAsOf: null,           // data_potwierdzenia po walidacji
  signatureVerified: false,      // parser nie sprawdza pieczęci
  personMatch: 'needs-confirmation',
  suggestions: [{
    target: 'parents.0.insuranceFrom',
    value: '2026-01-01',
    sourcePath: 'potwierdzenie/.../data_od',
    sourceLabel: 'Zgłoszenie do chorobowego — wskazany płatnik',
    selected: false,
    requiresConfirmation: true,
    reason: 'Wybierz tytuł i właściciela danych'
  }],
  observed: [], // informacje odczytane, których nie wolno użyć jako innego rodzaju podstawy
  warnings: []
}
```

Najpierw identyfikacja rodzaju dokumentu → podgląd właściciela i daty → wybór rodzica 1/2 → wybór tytułu → zatwierdzenie konkretnych pól. Nie nadpisywać formularza samym wybraniem pliku. Kwotę netto świadczeń można odczytać jako historię; podwyższenie do minimum wymaga właściwego miesiąca i kompletnej sumy wszystkich tytułów tego samego rodzica. Kwota wypłaty nie jest podstawą wymiaru.

Przykładowe komunikaty: „Odczytano plik; pieczęć elektroniczna nie została zweryfikowana”, „Dokument nie zawiera wybranego zakresu — uzupełnij dane”, „Podstawa składek emerytalnych nie jest automatycznie podstawą zasiłku”, „Saldo nie potwierdza długu na wskazany dzień”, „Zgłoszenie członka rodziny do zdrowotnego nie potwierdza przysposobienia”, „W pliku występuje więcej niż jedna osoba/tytuł — wybierz właściwą”.

Najmniej danych wysyła import lokalny w przeglądarce: oryginalny XML i PESEL nie trafiają do backendu ani Bielika. Do obliczeń przekazuje się wyłącznie zatwierdzone pola formularza, a identyfikatory dokumentu można pominąć po potwierdzeniu właściciela. PDF bez ekstraktora i weryfikacji nie może być przedstawiany jako obsłużony automatycznie; zapewnić instrukcję odczytu i ręczne pola. ZIP z e-ZLA wymaga jawnej obsługi szyfrowania, inaczej poprosić o właściwy wyeksportowany XML/CSV.

## 8. Ocena obecnego backendu

`backend/calculator-simulations.mjs` zwraca `simulated:true`, `officiallyValid:false`, `sent:false`. Operacja `login` nie tworzy zweryfikowanej tożsamości ani sesji państwowej. `insurance` wstawia sztuczne wynagrodzenia i dane dwojga rodziców, a `ezla` sztuczny bieżący okres — to demonstracja i tak musi być oznaczona. Nie należy łączyć tych danych z etykietą „rzeczywiste dane pobrane po logowaniu”.

Wymaganie konkursowe symulacji można spełnić: wybór metody logowania → jawny profil demonstracyjny → symulowany, ograniczony zestaw atrybutów tożsamości → osobne symulowane połączenie eZUS → podgląd i zgoda na wstawienie zakresu do kalkulatora. Niezależnie można rzeczywiście analizować lokalny plik użytkownika w udokumentowanym formacie. Produkcyjne logowanie lub pobranie z ZUS pozostaje zależne od zatwierdzonych integracji, certyfikatów i rzeczywistych uprawnień użytkownika.
