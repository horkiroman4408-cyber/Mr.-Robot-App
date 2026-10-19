# Mr. Robot 🤖

**[ ENG ](./README.md)** | **[ RUS ](./README.ru.md)** | **[ PL ](./README.pl.md)**

> **Od raportów magazynowych do gotowych wyników — prosto w Twojej przeglądarce.** Instalowalna aplikacja webowa, która zastępuje makra Excela, copy-paste z VLOOKUP-iem i codzienne półgodzinne rytuały.

![status](https://img.shields.io/badge/status-working%20prototype-success)
![wersja](https://img.shields.io/badge/version-3.6.6-blue)
![działa](https://img.shields.io/badge/runs%20in-your%20browser-0a84ff)
![PWA](https://img.shields.io/badge/PWA-installable%20app-9333ea)
![offline](https://img.shields.io/badge/offline-ready-success)
![auto-update](https://img.shields.io/badge/auto--update-service%20worker-brightgreen?style=flat-square)
![prywatność](https://img.shields.io/badge/privacy-local%20processing-blue?style=flat-square)
![języki](https://img.shields.io/badge/languages-PL%20%2F%20RU%20%2F%20EN%20%2F%20UK-42b883)
![vue](https://img.shields.io/badge/vue-3-42b883)

> **Wypróbuj teraz:** [otwórz wersję na żywo](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/) — wszystko działa w Twojej przeglądarce. Bez instalacji, bez rejestracji, bez serwera. Podoba się? Zainstaluj jako aplikację — będzie działać offline.

---

## 📖 Spis treści

- [Co to jest](#-co-to-jest)
- [Instalacja jako aplikacja](#-instalacja-jako-aplikacja)
- [Zawsze aktualna wersja](#-zawsze-aktualna-wersja)
- [Dlaczego to powstało](#-dlaczego-to-powstało)
- [Szybkość i wydajność](#-szybkość-i-wydajność)
- [Moduły](#-moduły-szczegóły)
- [Jak to działa od środka](#%EF%B8%8F-jak-to-działa-od-środka)
- [Struktura projektu](#-struktura-projektu)
- [Uruchomienie](#-uruchomienie)
- [Dla deweloperów](#-dla-deweloperów)
- [Wzajemna pomoc](#-wzajemna-pomoc)
- [Co dalej](#%EF%B8%8F-co-dalej)
- [Podziękowania](#-podziękowania)
- [Autor](#-autor)

---

## 💡 Co to jest

Mr. Robot to aplikacja przeglądarkowa, która robi magazynową robotę na plikach: parsuje raporty, porównuje dwie duże bazy, filtruje lokalizacje, liczy KPI i eksportuje czyste wyniki.

To działający prototyp. Nie koncept, nie slajdy — możesz otworzyć go teraz i użyć na prawdziwych plikach.

Raporty przetwarzane są **lokalnie, w Twojej przeglądarce**. Pliki raportów nie są wysyłane do żadnego backendu aplikacji. (Samo ładowanie aplikacji i sprawdzanie aktualizacji korzysta z sieci — ale Twoje dane nie.) Wczytane pliki są zapamiętywane (IndexedDB) i przeżywają przeładowanie strony oraz aktualizacje aplikacji.

Aplikacja instaluje się jak zwykły program: na ekranie telefonu, na pulpicie, w docku. Po instalacji otwiera się i działa **bez internetu** — kod aplikacji jest zapisany w pamięci przeglądarki przez service worker.

Nie chodzi o to, że to największe czy najbardziej dopracowane narzędzie. Chodzi o to, że dziś takie coś może złożyć jedna osoba — w przeglądarce. I to zmienia to, czym może być „szybkie wewnętrzne narzędzie”.

---

## 📲 Instalacja jako aplikacja

Wersja na żywo to **PWA** (Progressive Web App). Instalacja to jedno kliknięcie — daje prawdziwą ikonę aplikacji, własne okno i pracę offline:

| Platforma | Jak |
|-----------|-----|
| **Android (Chrome)** | Otwórz stronę → menu **⋮** → **Zainstaluj aplikację** |
| **iPhone (Safari)** | Otwórz stronę → Udostępnij → **Dodaj do ekranu początkowego** |
| **Windows / macOS (Chrome, Edge)** | Kliknij ikonę instalacji na pasku adresu |

**O offline uczciwie:** pierwsze otwarcie wymaga internetu (aplikacja pobiera i zapisuje siebie w pamięci). Potem internet ani serwer nie są już potrzebne — aplikacja działa z pamięci przeglądarki. Internet potrzebny jest ponownie tylko po to, by odbierać aktualizacje. Twoje pliki żyją w pamięci przeglądarki i zostają tam, dopóki przeglądarka nie wyczyści tego magazynu.

---

## 🔄 Zawsze aktualna wersja

Niczego nie trzeba pobierać ani reinstalować ręcznie. Aktualizacje przychodzą tak:

1. Na stronę trafia nowa wersja.
2. Aplikacja zauważa ją w tle i pokazuje baner: **„Dostępna aktualizacja / Zaktualizuj teraz”**.
3. Klikasz — nowa wersja się aktywuje. **Wczytane pliki, filtry i dane zostają nietknięte.**

Aktualizacja włącza się tylko po Twoim kliknięciu — raport w pracy nigdy nie zostanie przerwany. (Znaczek ✨ **„Co nowego”** to osobna sprawa: oznacza nieprzeczytane wpisy historii zmian.)

---

## 🔥 Dlaczego to powstało

Kto pracował z raportami magazynowymi, zna ten schemat. Przychodzi plik `.xlsx`. Ktoś otwiera go w Excelu, ustawia filtry, kopiuje kolumny do innego pliku, odpala makro VBA — dopóki makro nie padnie po kolejnej aktualizacji Excela. Potem każdy robi to po trochu inaczej i nikomu się liczby nie zgadzają.

Ten prototyp pyta: a co, gdyby cała ta karuzela żyła w przeglądarce? Co, gdyby filtry były zdefiniowane raz, w kodzie, i wszyscy mieli ten sam wynik? Co, gdyby codzienna rutyna skurczyła się do dwóch kliknięć?

To nie zamiennik prawdziwego systemu produkcyjnego — to działający szkic tego, jakim mógłby być.

### Otwarty z założenia
To nie zamknięte wewnętrzne narzędzie. Jest udostępnione, żeby rosło w obie strony — od tego, co wiedzą inni, i ku temu, czego inni potrzebują. Jeśli rozwiązałeś podobny problem sprytniej — chętnie usłyszę. Jeśli coś tutaj oszczędzi Ci tydzień prób i błędów — po prostu bierz.

---

## ⚡ Szybkość i wydajność

To najważniejsza część.

### Jak zwykle bywa
| Zadanie | Zwykłe podejście |
|---------|------------------|
| Otworzyć duży raport `.xlsx` | Excel otwiera wolno, czasem zawiesza |
| Filtry i przemapowanie kolumn | Ręcznie, z błędami |
| Porównać dwa duże pliki | Copy-paste, VLOOKUP, czekanie |
| Zrobić czysty eksport | Za każdym razem formatowane ręcznie |
| Powtórzyć jutro | Ten sam nakład pracy, codziennie |

### Co robi Mr. Robot
| Zadanie | Mr. Robot |
|---------|-----------|
| Otworzyć duży raport `.xlsx` | Parsowanie w tle — interfejs nie zamraża |
| Filtry i kolumny | Zdefiniowane raz w kodzie — ten sam wynik u wszystkich |
| Porównać dwa duże pliki | Mapy hashowe w pamięci — bez akrobacji z VLOOKUP |
| Czysty eksport | Jedno kliknięcie → sformatowany `.xlsx` lub `.csv` |
| Powtórzyć jutro | Pliki i filtry są zapamiętane |

Obliczenia trzymają się stałych reguł zapisanych w kodzie: to samo wejście daje ten sam wynik u każdego, kto uruchamia aplikację — koniec z „u mnie liczby nie zgadzają się”.

---

## 🧩 Moduły (szczegóły)

Aplikacja to hub z czterema sekcjami. Każda zastępuje powtarzające się zadanie.

### 1. KPI Norms — wydajność pracowników
Raporty `.xlsx` wrzucasz przeciągnięciem, łączysz z grafikiem (`Grafik.xlsx`), filtrujesz po grupie, procesie lub zmianie — i czytasz liczby.

**Podmoduły:**
- **Audyt** — rozbicie KPI i INFO.
- **Scalanie** — KPI scalania / pickingu.
- **Rozkładanie** — KPI rozkładania, z detekcją RSORT i zwrotów.
- **NADWE / VAS** — KPI z dwoma wierszami na login.
- **Statistics** — jeden widok na wszystkie procesy: rankingi, efektywność, mediana, średnia.

**Co robi dobrze:**
- Progi norm na podstawie mediany, regulowane per proces.
- Rankingi Top-3 / Top-5 / Top-10.
- Kolorowy eksport do Excela z formatowaniem warunkowym.
- Filtry budowane z pliku grafiku (grupa, proces, zmiana).

### 2. RS — Tote Finder
Porównuje dwie duże bazy w pamięci.

**Podmoduły:**
- **MP → RS Tote Finder** — dopasowuje EAN-y z MP do lokalizacji TOTE w RS.
- **Szukaj tot po EAN** — wklej listę, dostaniesz TOTE i ilość zapasu.
- **AUDYT GEEK** — czyta plik Stocktake order i raportuje po nim, bez eksportowania czegokolwiek.

**Detale, które mają znaczenie:**
- Strategia mediany lub ilości minimalnej przy wyborze TOTE.
- Wykrywanie i filtrowanie multi-tot.
- Świadomość 2×2 pop-tote.
- Kopiowanie do schowka i eksport do Excela.

### 3. MP — audyt i scalanie
**Podmoduły:**
- **AL_AUDYT** — KPI i INFO z raportu audytu.
- **FORMATKA_59** — format kontroli jakości z własnymi metrykami.
- **GODZINY_MDT** — analiza MDT, półki 1/1, listy lokalizacji.
- **STOCK** — raporty lokalizacji pogrupowane po godzinach przyjęcia.
- **Scalanie** — filtrowanie lokalizacji po typie półki, ABC, zakresie SKU.
- **Konsolidacja** — znajdowanie małych lokalizacji wartych konsolidacji.

**Uwagi:**
- Tam, gdzie istniało już makro VBA, logika jest z nim dopasowana — liczby zgadzają się z tym, do czego ludzie byli przyzwyczajeni.
- Kopiowanie do schowka pozwala wklejać wyniki prosto do Excela lub WMS.
- Pliki CSV eksportowane są z dokładnie takimi nazwami, jakich oczekują dalsze narzędzia.

### 4. Inne
- **Analiza_Przestojów** — analiza przestojów po USER ID, od 8 do 300 minut.
- **ARTLTT** — wklej nazwy produktów, dostaniesz pliki LTT w CSV.
- **TH Reports** — generowanie i parsowanie raportów (w trakcie).

---

## ⚙️ Jak to działa od środka

Kilka decyzji, które dają szybkość i łatwość utrzymania:

- **Ciężka robota w Web Worker-ach.** Parsowanie Excela dzieje się poza głównym wątkiem — interfejs nie zamraża na dużych plikach. Każdy moduł ma swój plik workera w `js/workers/`.
- **Mapy hashowe do zlepiania plików** — powtarzalne wyszukiwania stają się pracą liniową.
- **Reaktywny stan w pamięci**, zapisywany do IndexedDB — przeładowanie (i aktualizacja aplikacji) nie traci Twoich plików.
- **Tailwind CSS w przeglądarce.** Style kompilują się na bieżąco — bez builda, bez Node, bez npm install.
- **PWA z atomowym, wersjonowanym cache.** Service worker zapisuje całą aplikację jako jeden release; zepsuty deploy nigdy nie trafia do użytkowników. Aktualizacja włącza się dopiero po kliknięciu baneru.
- **Auto-deploy przez GitHub Actions:** każdy push publikuje wersję na GitHub Pages i nadaje świeżą rewizję cache — użytkownicy dostają baner aktualizacji automatycznie.
- **4 języki interfejsu** (polski, rosyjski, angielski, ukraiński), przełączane w locie bez utraty danych.

---

## 🗂 Struktura projektu

```
Mr.-Robot-App/
├── index.html              # szkielet strony + znaczniki aplikacji (szablony Vue)
├── css/styles.css          # wszystkie style
├── js/
│   ├── app.js              # ★ główny kod aplikacji (UI + logika)
│   ├── changelog.js        # ★ historia zmian „Co nowego”
│   ├── i18n.js             # tłumaczenia (PL / RU / EN / UK)
│   ├── theme.js            # jasny / ciemny motyw
│   ├── data/shifts.js      # listy zmian AB/CD
│   ├── workers/            # procesory plików w tle, po jednym na moduł
│   │   ├── kpi.js          #   KPI Norms
│   │   ├── tote.js         #   RS · Tote Finder
│   │   ├── audyt.js        #   MP · Audyt
│   │   ├── mdt.js          #   MDT
│   │   ├── stock.js        #   STOCK
│   │   ├── przestoje.js    #   analiza przestojów
│   │   ├── pracownicy.js   #   grafik (pracownicy)
│   │   ├── geek.js         #   audyt Stocktake order
│   │   └── common.js       #   konstruktor workerów
│   └── vue.global.js, xlsx.js, cptable.js, vendor-tailwind.js   # biblioteki
├── manifest.webmanifest    # manifest PWA (nazwa, ikony, tryb standalone)
├── sw.js                   # service worker: cache offline + aktualizacje
├── icons/                  # ikony aplikacji (192 / 512 / maskable)
└── .github/workflows/pages.yml   # auto-deploy na GitHub Pages
```

★ — pliki, które będziesz edytować najczęściej.

---

## 🏃 Uruchomienie

**Wersja na żywo (najprościej):**
**[Otwórz Mr. Robot](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/)** — albo zainstaluj jako aplikację (wyżej).

**Ze źródeł:**
1. Sklonuj lub pobierz to repozytorium.
2. Uruchom mały lokalny serwer w folderze:
   ```bash
   python3 -m http.server 8000
   ```
3. Otwórz `http://localhost:8000/`.

Po co serwer? Przeglądarki nie pozwalają service workerom i web workerom działać na plikach otwartych bezpośrednio (`file://`). To zasada bezpieczeństwa przeglądarki, nie wymóg aplikacji — hostowana wersja niczego takiego nie potrzebuje.

---

## 🔧 Dla deweloperów

Krótko, cykl pracy wygląda tak:

1. Wprowadź zmiany (zwykle `js/app.js`, `css/styles.css`, `index.html`).
2. Commit i push na `main`.
3. GitHub Actions sam publikuje wersję na Pages i nadaje nową rewizję cache — wszyscy użytkownicy dostają baner aktualizacji. Ręcznie niczego nie trzeba podbijać.

Przy istotnym wydaniu dodaj wpis na początek `CHANGELOG_ALL` w `js/changelog.js` i zaktualizuj numer wersji w `<title>`.

Szczegółowy przewodnik po utrzymaniu (po rosyjsku) — w **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

---

## 🤝 Wzajemna pomoc

To repozytorium to otwarty prototyp. Może rosnąć w obie strony.

### Co to może dać Tobie
Jeśli budujesz coś dla magazynu lub inwentaryzacji, oto pomysły warte zabrania:
- Instalowalna strona webowa, którą każdy otworzy, bije repo wymagające Node, Dockera i CI — dla narzędzia na pięć osób.
- Parsowanie `.xlsx` obciąża procesor. Wyrzucenie go do Web Workera utrzymuje płynny interfejs na dużych plikach.
- Dwa duże pliki złączone w pamięci wygrywają z każdym VLOOKUP-iem, jaki napiszesz.
- IndexedDB sprawia, że przeładowanie strony to nic.
- Filtry i wzory w kodzie znaczą, że każdy ma te same liczby.
- Jeśli rutyna zajmuje dwadzieścia kliknięć, każdy zrobi ją po swojemu. Jeśli jedno — zrobią ją wszyscy tak samo.

Bierz je, adaptuj, przepisuj w swoim stacku. Jeśli coś z tego trafi do Twojego projektu — notka, link zwrotny albo po prostu „cześć” będą naprawdę miłe. Nie jest wymagane, ale właśnie tak małym otwartym projektom chce się dzielić dalej.

### Co pomoże temu projektowi
Jeśli chcesz pomóc mu rosnąć, realnie przydatne jest:
- **Pomysły.** Sprytniejszy filtr, brakujący moduł, workflow, którego tu nie ma.
- **Bug reporty.** Plik, który parsuje się źle, KPI, które wygląda podejrzanie, przypadek brzegowy, który coś łamie.
- **Pull requesty.** Małe poprawki, nowe filtry albo cały nowy podmoduł.
- **Feedback o designie.** Co myli, co wolno, co „nie tak”.
- **Zanonimizowane przykłady plików.** Małe przykłady formatów raportów na fikcyjnych danych — proszę nie załączaj publicznie prawdziwych danych pracowników ani poufnych raportów.
- **Inne języki.** Interfejs jest po polsku, rosyjsku, angielsku i ukraińsku; kolejne mile widziane.

Jeśli budujesz coś podobnego — otwórz issue i się przywitaj. Wolę wymienić się notatkami niż pracować w izolacji.

---

## 🛣️ Co dalej

**Zrobione:**
- [x] Dashboard KPI ze statystykami i rankingami
- [x] Zestawianie wielu plików (Tote Finder)
- [x] Analiza audytu w aplikacji, bez eksportu do Excela
- [x] Trwałe przechowywanie plików w IndexedDB
- [x] Parsowanie Excela poza głównym wątkiem (Web Workery)
- [x] Sprawdzanie aktualizacji w tle
- [x] PWA: instalacja jako aplikacja, praca offline
- [x] Modularny kod (workery per moduł, osobny changelog)

**Zaplanowane lub rozważane:**
- [ ] Moduł TH Reports (w trakcie)
- [ ] Eksport do PDF
- [ ] Przetwarzanie wsadowe wielu plików
- [ ] Wzory i filtry definiowane przez użytkownika
- [ ] Opcjonalna synchronizacja chmurowa (opt-in)

---

## 🏆 Podziękowania

Prototyp jest udostępniony otwarcie, żeby można go było czytać, uczyć się z niego i budować na jego bazie.

Opiera się na otwartej pracy innych — przede wszystkim [Vue.js](https://vuejs.org/) i [SheetJS](https://sheetjs.com/) — których noty licencyjne zachowano w plikach źródłowych. Samo repozytorium nie ogłasza jeszcze licencji; dopóki tego nie zrobi, traktuj kod jako udostępniony do czytania i nauki, a nie jako domenę publiczną.

Jeśli weźmiesz stąd kod, pomysły albo całe moduły do własnego projektu — małe podziękowanie gdzieś (link, imię, wzmianka w Twoim README) będzie bardzo miłe. Nie dlatego, że jest należne, ale dlatego, że tak małym otwartym projektom chce się dzielić dalej.

A jeśli wolisz po prostu powiedzieć „cześć” i pokazać, co z tego zbudowałeś — też świetnie. Otwórz issue albo napisz — chętnie zobaczę.

---

## 👨‍💻 Autor

**Raman Horki**
> *Jeśli robisz to samo dwa razy — zautomatyzuj to.*

Otwarty na feedback i współpracę. Masz przemyślenia — otwórz issue w tym repozytorium.

© 2026 Mr. Robot · Made by Raman Horki
