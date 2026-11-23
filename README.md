<div align="center">

# Mr. Robot 🤖

### Warehouse Operations Intelligence

**Turn complex warehouse reports into clear, actionable results, right in your browser.**

[**Open Mr. Robot**](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/) · [**How to install**](#install--run) · [**Explore modules**](#modules) · [**Developer guide**](./DEVELOPMENT.md)

**English** · [Polski](./README.pl.md) · [Русский](./README.ru.md)

![Version](https://img.shields.io/badge/version-3.26.1-34495e) ![PWA](https://img.shields.io/badge/PWA-installable-2563eb) ![Languages](https://img.shields.io/badge/languages-PL%20%7C%20RU%20%7C%20EN%20%7C%20UK-64748b) ![Processing](https://img.shields.io/badge/report%20processing-local-16a34a)

</div>

---

## At a glance

Mr. Robot is a browser-based, installable toolkit for everyday warehouse operations. It combines Excel analysis, performance metrics, staffing plans and repeatable exports in one workspace. Instead of opening multiple spreadsheets and repeating manual steps, you import your permitted reports, choose filters and work with structured results.

| Area | What it helps you do |
| --- | --- |
| **KPI & employees** | Analyze process performance, norms, staff records and training |
| **Obsada** | Plan hourly staffing, review shifts, track work history and export rosters |
| **RS** | Compare SKU, EAN, tote and audit data |
| **MP** | Analyze shelf locations, STOCK, MDT, audit and consolidation |
| **Inne** | Review downtime, generate barcode labels and prepare operational files |
| **Mr. Robot Bridge** | Request supported OpenReports downloads and refresh a SharePoint Excel copy |

> **Data handling:** Excel analysis and local databases run in your browser. Bridge actions involve the systems you are already authorized to use and require connectivity and permissions. No central Mr. Robot account is required.

## Modules

### KPI & employee intelligence

Analyze employee results by process and period, compare norms and export reports. The tools cover **Audyt**, **Scalanie**, **Rozkładanie**, **NADWE / VAS**, and cross-process statistics. The employee area combines a staff directory, training registry and schedule information from imported workbooks. Supported employee IDs link reports to employee profiles.

- Norm thresholds, performance summaries, rankings and colored outputs.
- NADWE / VAS reports include items, recorded time and items per hour.
- Filterable results and Excel exports, where available in each tool.

### Obsada · hourly staffing and history

Obsada separates the **current SharePoint STAN copy** from the **local planning database**. Use it to assign people to processes across shifts and teams, including shifts crossing midnight. The local database stores assignments and history so past work can be reviewed later.

| View | Purpose |
| --- | --- |
| **Rozstawienie** | Read-only overview of staffing for the selected day/hour |
| **Planowanie** | Maintain teams, shifts and hourly process assignments; correct past hours |
| **Plan na jutro** | Review tomorrow's roster and export or print a team-based A4 plan |
| **Historia** | Review saved and imported historical records |
| **Intelligence** | Compare employee hours across a week, month or custom period |

**Intelligence:** choose employees or saved teams and select one or several processes. Selected-process totals and working-day counts reflect the filter without counting the same day twice. **Ostatnia / Poprzednia** show the last two completed workdays, with all processes on those days, regardless of the analysis filter.

**Local database exchange:** send your XLSX to a colleague or receive theirs. Conflicts are reviewed before merging; you can choose the colleague's data for all conflicts and then adjust individual decisions. A backup and a copy of the received file are saved before merging. Keep folder access enabled, and review conflicts rather than overwriting records blindly.

**Important:** SharePoint and local planning are different data sources. An imported workbook is a copy; it is not a live edit of the original online file. Reconciliation should be checked when the same employee hours exist in multiple sources.

### RS · tote and audit analysis

Work with MP/RS data to locate totes from SKU/EAN information, review quantities and analyze audit results. Available workflows include **Tote Finder**, **AUDYT GEEK** (including RET analysis) and **Scalanie Geek** for grouping SKU and small-quantity totes.

### MP · locations and stock operations

Tools include **AL_AUDYT**, **FORMATKA_59**, **GODZINY_MDT**, **STOCK**, **Scalanie** and **Konsolidacja**. Analyze shelf/location data, detect repeated STOCK closures and export or copy prepared results. Location-prefix filters (`MP1`, `MP2`, `MP3`) depend on the selected tool; FORMATKA_59 uses its own MP2-specific logic.

### Inne · everyday tools

- **Analiza przestojów:** review downtime intervals and supported employee IDs.
- **ARTLTT:** prepare LTT CSV files from product names.
- **Kreseczki:** generate and print Code 128 barcodes locally.

## Integrations · Mr. Robot Bridge

Bridge is an optional **Edge / Chrome extension** for two separate connections:

1. **OpenReports:** trigger supported WMS reports, download XLSX files and use them in the corresponding Mr. Robot module.
2. **SharePoint:** manually refresh an authorized online Excel source for Obsada. This downloads a copy; it does not modify the source workbook.

**Bridge version in this repository: `0.3.29`.** [Extension source](./extension/openreports-bridge/) · [Download archive](./downloads/OpenReports-Bridge-v0.3.29.zip)

To install an unpacked extension, download and extract its archive, open `edge://extensions` or `chrome://extensions`, enable Developer mode and select **Load unpacked**. Configure permissions and download folders using **Settings → Bridge** in Mr. Robot. The SharePoint source link can be configured from the settings control in **Obsada → Grafik procesowy**.

Bridge does not replace the application's local Excel processors. It does not bypass corporate permissions or automatically sign you in. Unpacked extensions must be updated manually.

## Install & run

**Use the hosted app:** [Open Mr. Robot](https://horkiroman4408-cyber.github.io/Mr.-Robot-App/).

| Device | Install |
| --- | --- |
| **Windows / macOS** | In Edge or Chrome, use the browser's *Install app* control |
| **Android** | In Chrome, open the menu and choose *Install app* |
| **iPhone** | In Safari, choose *Share → Add to Home Screen* |

On first use, load the app online so its PWA assets can be cached. Many local tools can then run offline with previously stored data. **OpenReports / SharePoint refreshes and updates still need network access.** Browser storage can be cleared by browser or device settings, so keep backups of important local XLSX databases.

**Run from source:**

```bash
git clone https://github.com/horkiroman4408-cyber/Mr.-Robot-App.git
cd Mr.-Robot-App
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Use a local HTTP server rather than opening `index.html` via `file://`, which restricts Service Workers and Web Workers.

## Architecture & project files

Mr. Robot is a client-side **Vue 3 PWA**, with module-specific Web Workers for heavy workbook processing and **SheetJS** for XLSX files. Local browser storage uses **IndexedDB**; the Service Worker handles cached application assets and update delivery. Optional Bridge integrations connect to external systems only when configured.

```text
Mr.-Robot-App/
├── index.html                  Vue application shell
├── css/                        Application and module styles
├── js/
│   ├── app.js                  Main app state and behaviors
│   ├── obsada-planner.js       Local staffing plans and XLSX exports
│   ├── obsada-team-intelligence.js
│   ├── obsada-merge.js         Database conflict reconciliation
│   ├── changelog.js            In-app What's New
│   └── workers/                Excel analysis workers
├── extension/openreports-bridge/
├── sw.js                       PWA cache and updates
├── manifest.webmanifest
└── .github/workflows/          Deployment workflows
```

For code changes, tests and release procedures, see [DEVELOPMENT.md](./DEVELOPMENT.md). User-facing release notes live inside **Co nowego / What's New** in the app, not in this README.

## Privacy, permissions & limitations

- Import only reports you are permitted to access. Do not post real employee data or confidential XLSX reports in public issues.
- Local data is held in the browser and, where configured, exported to a folder you choose. Losing access to that folder can prevent safe backup/merge until permission is restored.
- Offline support does not mean that remote websites, new SharePoint files or OpenReports downloads work offline.
- This is a practical operational tool, not a replacement for official WMS/HR records or organizational data policies.

## Project & author

**Created by Raman Horki.** Feedback, reproducible bug reports and ideas for improvements are welcome through the repository's issues. Please use anonymized test files when reporting problems.

**License:** this repository does not currently publish a top-level license for the project. Public visibility does **not** mean the code is in the public domain or grants unrestricted reuse. Third-party components retain their respective license notices.

© 2026 Mr. Robot · Made by Raman Horki
