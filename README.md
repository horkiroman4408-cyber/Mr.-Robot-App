# Mr. Robot 🤖

**[ ENG ](./README.md)** | **[ RUS ](./README.ru.md)** | **[ PL ](./README.pl.md)**

> **From warehouse reports to usable results — right in your browser.** An installable web app that replaces Excel macros, VLOOKUP copy-paste and half-hour daily routines.

![status](https://img.shields.io/badge/status-working%20prototype-success)
![version](https://img.shields.io/badge/version-3.6.6-blue)
![runs in](https://img.shields.io/badge/runs%20in-your%20browser-0a84ff)
![PWA](https://img.shields.io/badge/PWA-installable%20app-9333ea)
![offline](https://img.shields.io/badge/offline-ready-success)
![auto-update](https://img.shields.io/badge/auto--update-service%20worker-brightgreen?style=flat-square)
![privacy](https://img.shields.io/badge/privacy-local%20processing-blue?style=flat-square)
![languages](https://img.shields.io/badge/languages-PL%20%2F%20RU%20%2F%20EN%20%2F%20UK-42b883)
![vue](https://img.shields.io/badge/vue-3-42b883)

> **Try it now:** [open the live version](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/) — it runs entirely in your browser. No install, no sign-up, no server. Like it? Install it as an app — it then works offline.

---

## 📖 Table of Contents

- [What it is](#-what-it-is)
- [Install it as an app](#-install-it-as-an-app)
- [Always up to date](#-always-up-to-date)
- [Why it exists](#-why-it-exists)
- [Speed and performance](#-speed-and-performance)
- [The Modules](#-the-modules-deep-dive)
- [How it's built](#%EF%B8%8F-how-its-built-under-the-hood)
- [Project structure](#-project-structure)
- [Running it](#-running-it)
- [For developers](#-for-developers)
- [Helping each other](#-helping-each-other)
- [What's next](#%EF%B8%8F-whats-next)
- [Credit](#-credit)
- [Author](#-author)

---

## 💡 What it is

Mr. Robot is a browser app that does warehouse file work: parsing reports, comparing two large spreadsheets, filtering locations, calculating KPIs, exporting clean results.

It's a working prototype. Not a concept, not a slide deck — you can open it right now and use it on real files.

Your reports are processed **locally, in your browser**. Report files are never uploaded to any application backend. (Loading the app itself and checking for updates does use the network — but your data doesn't.) Files you load are remembered (IndexedDB) and survive page reloads and app updates.

It installs like a regular app: on the phone's home screen, on the desktop, in the dock. Once installed, it opens and works **without the internet** — the app code is cached inside the browser by a service worker.

The point isn't that it's the biggest or most polished tool. The point is that this is something one person can put together in a browser today — and that changes what a "quick internal tool" can look like.

---

## 📲 Install it as an app

The live version is a **PWA** (Progressive Web App). Installing takes one tap and gives you a real app icon, its own window, and offline work:

| Platform | How |
|----------|-----|
| **Android (Chrome)** | Open the site → menu **⋮** → **Install app** |
| **iPhone (Safari)** | Open the site → Share → **Add to Home Screen** |
| **Windows / macOS (Chrome, Edge)** | Click the install icon in the address bar |

**Offline, explained honestly:** the first open needs the internet (the app downloads and caches itself). After that, no internet and no server are needed — the app runs from the browser cache. Internet is only needed again to receive updates. Your saved files live in the browser's storage, so they stay as long as the browser keeps that storage.

---

## 🔄 Always up to date

You never re-download or re-install anything manually. Updates arrive like this:

1. A new version is deployed to the site.
2. The app notices it in the background and shows a banner: **"Update available / Zaktualizuj teraz"**.
3. You click it — the new version activates. **Your loaded files, filters and data stay untouched.**

The update is applied only when you click — an in-progress report is never interrupted. (The ✨ **"What's new"** badge in the app is a separate thing: it marks unread changelog entries.)

---

## 🔥 Why it exists

If you've worked with warehouse reports, you know the pattern. A file arrives as `.xlsx`. Someone opens it in Excel, applies filters, copies columns into another file, runs a VBA macro — until the macro breaks after an Excel update. Then everyone does it slightly differently, and no two people get the same numbers.

This prototype asks: what if that whole loop lived in a browser instead? What if the filters were defined once, in code, so everyone got the same result? What if a daily routine shrank to a couple of clicks?

It's not a replacement for a real production system — it's a working sketch of what one might look like.

### Open by design
This isn't a closed internal tool. It's shared so it can grow both ways — from what other people know, and towards what other people need. If you've solved a similar problem in a smarter way, I'd like to hear about it. If something here saves you a week of trial and error, just take it.

---

## ⚡ Speed and performance

This is the part that matters most.

### The usual way
| Task | The usual way |
|------|---------------|
| Open a big `.xlsx` report | Excel opens it slowly, sometimes freezes |
| Apply filters and remap columns | Done by hand, error-prone |
| Compare two large files | Copy-paste, VLOOKUP, waiting |
| Produce a clean export | Reformatted manually every time |
| Repeat it tomorrow | Same effort, every day |

### What Mr. Robot does instead
| Task | Mr. Robot |
|------|-----------|
| Open a big `.xlsx` report | Parsed in a background thread — the UI stays responsive |
| Filters and column mapping | Defined once in code — everyone gets the same result |
| Compare two large files | In-memory hash maps — no VLOOKUP gymnastics |
| Produce a clean export | One click → styled `.xlsx` or `.csv` |
| Repeat it tomorrow | Files and filters are remembered |

The calculations follow fixed rules defined in code, so the same input produces the same output for anyone who runs it — no more "my numbers differ from yours".

---

## 🧩 The Modules (Deep Dive)

The app is a hub with four sections. Each one replaces a recurring task.

### 1. KPI Norms — employee performance
Load `.xlsx` reports by drag and drop, combine them with a schedule file (`Grafik.xlsx`), filter by group, process or shift, and read the numbers.

**Sub-modules:**
- **Audyt** — KPI and INFO breakdown.
- **Scalanie** — KPI for merging / picking.
- **Rozkładanie** — KPI for distribution, with RSORT and Returns detection.
- **NADWE / VAS** — KPI with two rows per login.
- **Statistics** — one view across all processes: rankings, efficiency, median, average.

**What it does well:**
- Norm thresholds based on the median, adjustable per process.
- Top-3 / Top-5 / Top-10 rankings.
- Coloured Excel export with conditional formatting.
- Filters built from the schedule file (group, process, shift).

### 2. RS — Tote Finder
Compares two large databases in memory.

**Sub-modules:**
- **MP → RS Tote Finder** — matches EANs from MP to TOTE locations in RS.
- **Search totes by EAN** — paste a list, get TOTE and inventory quantity.
- **AUDYT GEEK** — reads a Stocktake order file and reports on it without exporting anything.

**Details that matter:**
- Median or minimum-quantity strategy when picking a TOTE.
- Multi-tote detection and filtering.
- 2×2 pop-tote awareness.
- Copy to clipboard and Excel export.

### 3. MP — Audit and merging
**Sub-modules:**
- **AL_AUDYT** — KPI and INFO from an audit report.
- **FORMATKA_59** — quality control format with its own metrics.
- **GODZINY_MDT** — MDT analysis, shelf 1/1, location lists.
- **STOCK** — location reports grouped by receiving hours.
- **Scalanie** — filter locations by shelf, ABC, SKU range.
- **Konsolidacja** — find small locations worth consolidating.

**Notes:**
- Where a VBA macro already existed, the logic is matched to it, so the numbers line up with what people were used to.
- Clipboard copy is there so results can be pasted straight into Excel or a WMS.
- CSV files are exported with the exact filenames downstream tools expect.

### 4. Other
- **Analiza_Przestojów** — downtime analysis per USER ID, 8 to 300 minutes.
- **ARTLTT** — paste product names, get LTT files as CSV.
- **TH Reports** — report generation and parsing (in progress).

---

## ⚙️ How it's built (Under the Hood)

A few decisions that make it fast and maintainable:

- **Web Workers for the heavy lifting.** Excel parsing runs off the main thread, so the interface never freezes on large files. Each module has its own worker file in `js/workers/`.
- **Hash maps for cross-referencing**, which turns repeated lookups into linear-time work.
- **Reactive in-memory state**, persisted to IndexedDB — a reload (or an app update) doesn't lose your files.
- **Runtime Tailwind CSS.** Styles are compiled right in the browser — no build step, no Node, no npm install.
- **PWA with an atomic, versioned cache.** The service worker precaches the whole app as one release; a broken deploy never goes live. Updates activate only after the user clicks the banner.
- **Auto-deploy via GitHub Actions:** every push publishes to GitHub Pages and stamps a fresh cache revision, so users get the update banner automatically.
- **4 interface languages** (Polish, Russian, English, Ukrainian), switchable in-app without losing data.

---

## 🗂 Project structure

```
Mr.-Robot-App/
├── index.html              # page skeleton + app markup (Vue templates)
├── css/styles.css          # all styles
├── js/
│   ├── app.js              # ★ main application code (UI + logic)
│   ├── changelog.js        # ★ "What's new" history
│   ├── i18n.js             # translations (PL / RU / EN / UK)
│   ├── theme.js            # light / dark theme
│   ├── data/shifts.js      # AB/CD shift lists
│   ├── workers/            # background file processors, one per module
│   │   ├── kpi.js          #   KPI Norms
│   │   ├── tote.js         #   RS · Tote Finder
│   │   ├── audyt.js        #   MP · Audit
│   │   ├── mdt.js          #   MDT
│   │   ├── stock.js        #   STOCK
│   │   ├── przestoje.js    #   Downtime analysis
│   │   ├── pracownicy.js   #   Schedule (employees)
│   │   ├── geek.js         #   Stocktake order audit
│   │   └── common.js       #   worker constructor
│   └── vue.global.js, xlsx.js, cptable.js, vendor-tailwind.js   # libraries
├── manifest.webmanifest    # PWA manifest (name, icons, standalone mode)
├── sw.js                   # service worker: offline cache + updates
├── icons/                  # app icons (192 / 512 / maskable)
└── .github/workflows/pages.yml   # auto-deploy to GitHub Pages
```

★ — the files you'll edit most often.

---

## 🏃 Running it

**Live version (easiest):**
**[Open Mr. Robot](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/)** — or install it as an app (see above).

**From source:**
1. Clone or download this repository.
2. Run a tiny local server inside the folder:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000/`.

Why a server? Browsers don't allow service workers and web workers to run from files opened directly (`file://`). This is a browser security rule, not an app requirement — the hosted version needs nothing of the sort.

---

## 🔧 For developers

The short version of the workflow:

1. Make changes (usually `js/app.js`, `css/styles.css`, `index.html`).
2. Commit and push to `main`.
3. GitHub Actions deploys to Pages automatically and stamps a new cache revision — every user gets the update banner. Nothing to bump by hand.

For a notable release, also add an entry to `CHANGELOG_ALL` in `js/changelog.js` and update the version in `<title>`.

The detailed maintenance guide (in Russian) lives in **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

---

## 🤝 Helping each other

This repo is a prototype, shared openly. It can go both ways.

### What this might give you
If you're building something for warehouse or inventory work, here are the ideas most worth taking:
- An installable web page that anyone can open beats a repo that needs Node, Docker and CI for a tool used by five people.
- Parsing `.xlsx` is CPU-heavy. Moving it into a Web Worker keeps the UI smooth on huge files.
- Two large files joined in memory beat every VLOOKUP you'll ever write.
- IndexedDB makes a page reload feel like nothing happened.
- Filters and formulas in code mean every person gets the same numbers.
- If a routine takes twenty clicks, everyone will do it differently. If it takes one, everyone does it the same way.

Use them, adapt them, rewrite them in your own stack. If any of this ends up in something you build — a note, a link back, or just a message saying hello would be genuinely appreciated. It's not required, but it does make the work feel worth sharing.

### What would help this project
If you'd like to help it grow, here's what's genuinely useful:
- **Ideas.** A smarter way to filter, a module that's missing, a workflow this doesn't cover yet.
- **Bug reports.** A file that doesn't parse right, a KPI that looks off, an edge case that breaks something.
- **Pull requests.** Small fixes, new filters, or an entirely new sub-module.
- **Feedback on the design.** What feels confusing, what feels slow, what feels wrong.
- **Anonymized sample files.** Small, fake-data examples of report formats — please don't attach real employee data or confidential reports to public issues.
- **Other languages.** The UI ships in Polish, Russian, English and Ukrainian; more are welcome.

If you're working on something similar, open an issue and say hi. I'd rather compare notes than work in isolation.

---

## 🛣️ What's next

**Done so far:**
- [x] KPI dashboard with statistics and rankings
- [x] Multi-file cross-referencing (Tote Finder)
- [x] In-app audit analysis without exporting to Excel
- [x] Persistent file storage with IndexedDB
- [x] Off-thread Excel parsing with Web Workers
- [x] Background update checks
- [x] PWA: install as an app, offline work
- [x] Modular codebase (per-module workers, separate changelog)

**Planned or under consideration:**
- [ ] TH Reports module (in progress)
- [ ] PDF export
- [ ] Batch processing of multiple files
- [ ] User-defined formulas and filters
- [ ] Optional cloud sync (opt-in)

---

## 🏆 Credit

This prototype is shared openly so people can read it, learn from it and build on it.

It builds on open-source work by others — notably [Vue.js](https://vuejs.org/) and [SheetJS](https://sheetjs.com/) — whose license notices are preserved in the source files. This repository itself doesn't yet declare a license; until it does, please treat the code as shared for reading and learning rather than as public domain.

If you take code, ideas or whole modules from here and put them into something of your own, a small credit somewhere (a link, a name, a mention in your README) would be really nice. Not because it's owed, but because it's how small open projects stay motivated to keep sharing.

If you'd rather just say hello and tell me what you built with it, that works too. Open an issue or reach out — I'd like to see it.

---

## 👨‍💻 Author

**Raman Horki**
> *If you do the same thing twice — automate it.*

Open to feedback and collaboration. If you have thoughts, open an issue in this repository.

© 2026 Mr. Robot · Made by Raman Horki
