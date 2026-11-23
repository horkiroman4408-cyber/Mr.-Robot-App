<div align="center">

# Mr. Robot 🤖

### Warehouse Operations Intelligence

**Zamień złożone raporty magazynowe w czytelne wyniki, bezpośrednio w przeglądarce.**

[**Otwórz Mr. Robot**](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/) · [**Instalacja**](#instalacja-i-uruchomienie) · [**Poznaj moduły**](#moduły) · [**Dokumentacja techniczna**](./DEVELOPMENT.md)

[English](./README.md) · **Polski** · [Русский](./README.ru.md)

![Wersja](https://img.shields.io/badge/version-3.26.1-34495e) ![PWA](https://img.shields.io/badge/PWA-installable-2563eb) ![Języki](https://img.shields.io/badge/languages-PL%20%7C%20RU%20%7C%20EN%20%7C%20UK-64748b) ![Przetwarzanie](https://img.shields.io/badge/report%20processing-local-16a34a)

</div>

---

## W skrócie

Mr. Robot to instalowalna aplikacja przeglądarkowa do codziennej pracy operacyjnej w magazynie. Łączy analizę Excela, wskaźniki wydajności, planowanie obsady i powtarzalny eksport w jednym miejscu. Zamiast otwierać kilka arkuszy i ręcznie wykonywać te same operacje, wczytujesz dozwolone raporty, wybierasz filtry i otrzymujesz uporządkowane wyniki.

| Obszar | Zastosowanie |
| --- | --- |
| **KPI i pracownicy** | Wydajność procesów, normy, dane pracowników i szkolenia |
| **Obsada** | Godzinowe przydziały, zmiany, historia pracy i eksport planów |
| **RS** | Porównanie danych SKU, EAN, tote i audytów |
| **MP** | Lokalizacje, STOCK, MDT, audyt i konsolidacja |
| **Inne** | Przestoje, kody kreskowe i pliki operacyjne |
| **Mr. Robot Bridge** | Raporty OpenReports i odświeżanie kopii Excela z SharePoint |

> **Przetwarzanie danych:** analiza Excela i lokalne bazy działają w przeglądarce. Integracje Bridge korzystają z systemów, do których użytkownik ma dostęp, i wymagają połączenia oraz odpowiednich uprawnień. Nie jest potrzebne centralne konto Mr. Robot.

## Moduły

### KPI i analiza pracowników

Analizuj wyniki według procesu i okresu, porównuj normy i eksportuj raporty. Dostępne obszary obejmują **Audyt**, **Scalanie**, **Rozkładanie**, **NADWE / VAS** i statystyki międzyprocesowe. Sekcja pracowników łączy bazę osób, rejestr szkoleń i grafik z wczytanych plików. Obsługiwane identyfikatory otwierają karty pracowników z raportów.

- Progi norm, podsumowania wydajności, rankingi i kolorowe wyniki.
- Raport NADWE / VAS: liczba sztuk, czas i sztuki na godzinę.
- Filtry oraz eksport Excel tam, gdzie przewidziano je w danym narzędziu.

### Obsada · planowanie godzinowe i historia

Obsada rozdziela **aktualną kopię STAN z SharePoint** od **lokalnej bazy planowania**. Można przydzielać pracowników do procesów na poszczególne godziny i zmiany, również przechodzące przez północ. Lokalna baza przechowuje przydziały i historię do późniejszej analizy.

| Widok | Do czego służy |
| --- | --- |
| **Rozstawienie** | Podgląd obsady w wybranym dniu i godzinie, bez edycji |
| **Planowanie** | Zespoły, grafiki, przydziały godzinowe i korekty wcześniejszych godzin |
| **Plan na jutro** | Podgląd, druk A4 i eksport planu z podziałem na zespoły |
| **Historia** | Zapisane i importowane dane historyczne |
| **Intelligence** | Analiza godzin za tydzień, miesiąc lub własny okres |

**Intelligence:** wybieraj pojedynczych pracowników lub zapisane zespoły oraz jeden lub kilka procesów. Godziny i dni pracy odpowiadają wybranym procesom, bez podwójnego liczenia dnia. **Ostatnia / Poprzednia** pokazują dwa ostatnie zakończone dni pracy i wszystkie procesy z tych dni, niezależnie od aktywnego filtra.

**Wymiana bazy lokalnej:** przekaż plik XLSX koledze lub odbierz jego bazę. Przed scaleniem przeglądasz konflikty; można wybrać dane kolegi we wszystkich konfliktach, a następnie zmienić pojedyncze decyzje. Przed scaleniem zapisywane są kopia bezpieczeństwa i otrzymany plik. Zachowuj dostęp do folderu i sprawdzaj konflikty zamiast bezrefleksyjnie nadpisywać rekordy.

**Ważne:** SharePoint i lokalny plan są osobnymi źródłami. Pobrany XLSX jest kopią, a nie edycją pliku online. Gdy godziny tej samej osoby pochodzą z kilku źródeł, należy zweryfikować uzgodnienie historii.

### RS · tote i audyty

Porównuj dane MP/RS w celu wyszukiwania tote po SKU/EAN, analizy ilości i wyników audytu. Dostępne narzędzia to **Tote Finder**, **AUDYT GEEK** (również RET) oraz **Scalanie Geek**, który grupuje SKU i tote o małych ilościach.

### MP · lokalizacje i operacje magazynowe

Obejmuje **AL_AUDYT**, **FORMATKA_59**, **GODZINY_MDT**, **STOCK**, **Scalanie** i **Konsolidacja**. Analizuj lokalizacje, powtarzające się zamknięcia STOCK oraz przygotowuj eksporty i wyniki do kopiowania. Filtry prefiksów (`MP1`, `MP2`, `MP3`) zależą od narzędzia; FORMATKA_59 zachowuje osobną logikę MP2.

### Inne · narzędzia codzienne

- **Analiza przestojów:** analiza przestojów i obsługiwanych identyfikatorów pracowników.
- **ARTLTT:** przygotowanie plików CSV LTT z nazw produktów.
- **Kreseczki:** lokalne generowanie i drukowanie kodów Code 128.

## Integracje · Mr. Robot Bridge

Bridge jest opcjonalnym **rozszerzeniem Edge / Chrome** z dwoma niezależnymi połączeniami:

1. **OpenReports:** uruchamianie obsługiwanych raportów WMS, pobieranie XLSX i analiza w odpowiednim module Mr. Robot.
2. **SharePoint:** ręczne odświeżanie dozwolonego źródła Excel dla Obsada. Pobierana jest kopia, bez zmiany oryginalnego pliku.

**Wersja Bridge w repozytorium: `0.3.29`.** [Źródła rozszerzenia](./extension/openreports-bridge/) · [Archiwum do pobrania](./downloads/OpenReports-Bridge-v0.3.29.zip)

Aby zainstalować rozpakowane rozszerzenie, pobierz archiwum, rozpakuj je, otwórz `edge://extensions` lub `chrome://extensions`, włącz **Tryb dewelopera** i wybierz **Załaduj rozpakowane**. Uprawnienia i foldery pobierania skonfigurujesz w **Ustawienia → Bridge**. Link do źródła SharePoint ustawisz przyciskiem ustawień w **Obsada → Grafik procesowy**.

Bridge nie zastępuje lokalnego przetwarzania XLSX, nie omija uprawnień firmowych i nie loguje użytkownika automatycznie. Rozpakowane rozszerzenie trzeba aktualizować ręcznie.

## Instalacja i uruchomienie

**Wersja online:** [Otwórz Mr. Robot](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/).

| Urządzenie | Instalacja |
| --- | --- |
| **Windows / macOS** | W Edge lub Chrome wybierz polecenie *Zainstaluj aplikację* |
| **Android** | W Chrome otwórz menu i wybierz *Zainstaluj aplikację* |
| **iPhone** | W Safari wybierz *Udostępnij → Do ekranu początkowego* |

Przy pierwszym uruchomieniu połącz się z internetem, aby aplikacja zapisała zasoby PWA w pamięci podręcznej. Wiele lokalnych narzędzi będzie później działać offline z zapisanymi danymi. **Odświeżanie OpenReports / SharePoint i aktualizacje nadal wymagają sieci.** Pamięć przeglądarki może zostać wyczyszczona, dlatego ważne lokalne bazy XLSX należy kopiować na zewnątrz.

**Uruchomienie ze źródeł:**

```bash
git clone https://github.com/horkiroman4408-cyber/Mr.-Robot-App.git
cd Mr.-Robot-App
python3 -m http.server 8000
```

Otwórz `http://localhost:8000/`. Użyj serwera HTTP zamiast `file://`, ponieważ przeglądarki ograniczają w tym trybie Service Workers i Web Workers.

## Architektura i pliki projektu

Mr. Robot jest aplikacją **Vue 3 PWA**, używa Web Workers do obciążających operacji na arkuszach i biblioteki **SheetJS** do XLSX. Dane lokalne są przechowywane w **IndexedDB**, a Service Worker odpowiada za pamięć podręczną aplikacji i aktualizacje. Opcjonalny Bridge łączy się z usługami zewnętrznymi po konfiguracji.

```text
Mr.-Robot-App/
├── index.html                  Główny szablon Vue
├── css/                        Style aplikacji i modułów
├── js/
│   ├── app.js                  Stan i logika aplikacji
│   ├── obsada-planner.js       Planowanie i eksport XLSX
│   ├── obsada-team-intelligence.js
│   ├── obsada-merge.js         Obsługa konfliktów baz
│   ├── changelog.js            Historia „Co nowego”
│   └── workers/                Przetwarzanie Excela
├── extension/openreports-bridge/
├── sw.js                       Cache PWA i aktualizacje
├── manifest.webmanifest
└── .github/workflows/          Publikacja
```

Zmiany kodu, testowanie i publikację opisuje [DEVELOPMENT.md](./DEVELOPMENT.md). Historia wersji dla użytkowników znajduje się w aplikacji w **Co nowego**, a nie w tym README.

## Prywatność, uprawnienia i ograniczenia

- Importuj wyłącznie raporty, do których masz uprawnienia. Nie umieszczaj rzeczywistych danych pracowników ani poufnych XLSX w publicznych zgłoszeniach.
- Dane lokalne pozostają w przeglądarce i mogą być eksportowane do wybranego folderu. Brak uprawnienia do folderu może zablokować bezpieczne tworzenie kopii lub scalanie, dopóki nie przywrócisz dostępu.
- Tryb offline nie zapewnia dostępu do stron zewnętrznych, nowych plików SharePoint ani pobierania raportów OpenReports.
- Narzędzie wspiera pracę operacyjną, ale nie zastępuje oficjalnych rejestrów WMS/HR ani zasad ochrony danych.

## Projekt i autor

**Autor: Raman Horki.** Pomysły, uwagi i zgłoszenia błędów można przesyłać przez Issues. Do odtwarzania problemów używaj zanonimizowanych plików testowych.

**Licencja:** repozytorium nie zawiera obecnie głównej licencji projektu. Publiczny dostęp do kodu **nie** oznacza domeny publicznej ani zgody na nieograniczone ponowne wykorzystanie. Komponenty firm trzecich zachowują własne informacje licencyjne.

© 2026 Mr. Robot · Made by Raman Horki
