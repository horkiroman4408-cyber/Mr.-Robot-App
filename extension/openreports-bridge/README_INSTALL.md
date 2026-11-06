# OpenReports Bridge v0.3.7

Optional Microsoft Edge extension for Mr. Robot. Runs on OpenReports and Mr. Robot GitHub Pages.

Install: edge://extensions (Edge) or chrome://extensions (Chrome) → Developer mode → Load unpacked → select this directory.

A PWA cannot install extensions automatically. Edge does not auto-update unpacked extensions from GitHub. Update this folder manually or ask IT about managed deployment.

Reports are saved locally in Downloads/MrRobot/OpenReports. Never put company credentials in this repository.


## Bridge 0.3.7 (Edge / Chrome)

When a report is requested with no OpenReports tab open, Bridge opens it automatically. If the session has expired, sign in directly on the OpenReports site; the queued report continues after the Reports interface becomes available. Bridge never handles credentials. Waiting for sign-in times out after 15 minutes; Cancel stops the queued request.

New versions are published in `extension/openreports-bridge/latest.json` alongside standalone download archives. The installed unpacked extension is **not** automatically updated; reload the unpacked extension from its updated folder in Edge/Chrome.

## Changes in v0.3.7

Added STOCK → ECM_PICK_Lacks_during_picking. Select one date (no times), Data Source WMS ECM PODKARPACIE Prod, export XLSX with Open in Browser, and import via the existing STOCK file handler. The selected date is remembered separately from the other reports.

## Changes in v0.3.6

The last valid date/time period is stored locally, separately for each report, and reused between the Mr. Robot modal and extension popup. No credentials or report contents are stored. When no OpenReports tab is open, Bridge starts from https://openreports-wms.lpp.com/openreports/reportGroup.action in the background. It activates the tab only if sign-in is necessary.

## Changes in v0.3.5

The Bridge keeps an authorized OpenReports tab in the background. Only a detected sign-in page or corporate SSO redirect brings that tab to the foreground. No passwords or login forms are accessed. The report resumes automatically after manual sign-in.

## Changes in v0.3.4

Select dates as DD / MM / YYYY and times as HH:MM:SS using the 24-hour clock in both the Mr. Robot modal and the extension popup. Running tasks can be cancelled from the Mr. Robot modal; abandoned requests are detected while active downloads keep their longer timeout.
