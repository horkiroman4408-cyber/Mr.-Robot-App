# OpenReports Bridge v0.3.13

Optional Microsoft Edge extension for Mr. Robot. Runs on OpenReports and Mr. Robot GitHub Pages.

Install: edge://extensions (Edge) or chrome://extensions (Chrome) → Developer mode → Load unpacked → select this directory.

A PWA cannot install extensions automatically. Edge does not auto-update unpacked extensions from GitHub. Update this folder manually or ask IT about managed deployment.

Reports are saved locally in Downloads/MrRobot/OpenReports. Never put company credentials in this repository.


## Install in Edge or Chrome

1. Download `OpenReports-Bridge-v0.3.13.zip` (the **browser installation ZIP**, not the `GitHub-READY.zip` distribution).
2. Extract it to a **permanent folder** such as `Documents/OpenReports-Bridge`. You should see `manifest.json` and `background.js` directly inside it. There is **no `extension/` directory inside this ZIP**.
3. Open `edge://extensions` (Edge) or `chrome://extensions` (Chrome).
4. Enable **Developer mode**, select **Load unpacked**, and choose the folder that **directly contains `manifest.json`**. Do not select the ZIP file.
5. Refresh Mr. Robot. **Settings → OpenReports Bridge** should show the extension is connected.
6. Run a report. If OpenReports needs sign-in, sign in yourself; Bridge does not collect credentials.
7. For the first automatic import, select the `Downloads/MrRobot/OpenReports` folder from the report dialog and allow read access.

### Updating an existing installation

Download the newer browser ZIP, extract it, **replace files in the existing extension folder**, then select **Reload** for Bridge at the browser extensions page and refresh Mr. Robot. Do not install a duplicate copy.

### GitHub publishing versus browser installation

`OpenReports-Bridge-v0.3.13-GitHub-READY.zip` is for uploading to the **repository root**. It contains `extension/openreports-bridge/`, `downloads/` and related README and app files. The browser-installation ZIP is nested at `downloads/OpenReports-Bridge-v0.3.13.zip`, and its `manifest.json` is at its own root.

## Bridge 0.3.11 (Edge / Chrome)

When a report is requested with no OpenReports tab open, Bridge opens it automatically. If the session has expired, sign in directly on the OpenReports site; the queued report continues after the Reports interface becomes available. Bridge never handles credentials. Waiting for sign-in times out after 15 minutes; Cancel stops the queued request.

New versions are published in `extension/openreports-bridge/latest.json` alongside standalone download archives. The installed unpacked extension is **not** automatically updated; reload the unpacked extension from its updated folder in Edge/Chrome.

## Changes in v0.3.13

Added KPI Rozkładanie (`Storage_RSORT_ECM_KPI`) and NADWE/VAS (`NADWE_VAS_ECM_KPI`) with XLSX import into the existing KPI file inputs. All KPI date ranges now persist individually. Fixed Data Source: WMS ECM REPL PODKARPACIE. Both reports require Date from / Date to with seconds and have no extra pick-type field.

## Changes in v0.3.7

Added STOCK → ECM_PICK_Lacks_during_picking. Select one date (no times), Data Source WMS ECM PODKARPACIE Prod, export XLSX with Open in Browser, and import via the existing STOCK file handler. The selected date is remembered separately from the other reports.

## Changes in v0.3.6

The last valid date/time period is stored locally, separately for each report, and reused between the Mr. Robot modal and extension popup. No credentials or report contents are stored. When no OpenReports tab is open, Bridge starts from https://openreports-wms.lpp.com/openreports/reportGroup.action in the background. It activates the tab only if sign-in is necessary.

## Changes in v0.3.5

The Bridge keeps an authorized OpenReports tab in the background. Only a detected sign-in page or corporate SSO redirect brings that tab to the foreground. No passwords or login forms are accessed. The report resumes automatically after manual sign-in.

## Changes in v0.3.4

Select dates as DD / MM / YYYY and times as HH:MM:SS using the 24-hour clock in both the Mr. Robot modal and the extension popup. Running tasks can be cancelled from the Mr. Robot modal; abandoned requests are detected while active downloads keep their longer timeout.
