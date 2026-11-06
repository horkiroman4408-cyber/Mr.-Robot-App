# OpenReports Bridge v0.3.0

Optional Microsoft Edge extension for Mr. Robot. Runs on OpenReports and Mr. Robot GitHub Pages.

Install: edge://extensions (Edge) or chrome://extensions (Chrome) → Developer mode → Load unpacked → select this directory.

A PWA cannot install extensions automatically. Edge does not auto-update unpacked extensions from GitHub. Update this folder manually or ask IT about managed deployment.

Reports are saved locally in Downloads/MrRobot/OpenReports. Never put company credentials in this repository.


## Bridge 0.3.0 (Edge / Chrome)

When a report is requested with no OpenReports tab open, Bridge opens it automatically. If the session has expired, sign in directly on the OpenReports site; the queued report continues after the Reports interface becomes available. Bridge never handles credentials. Waiting for sign-in times out after 15 minutes; Cancel stops the queued request.

New versions are published in `extension/openreports-bridge/latest.json` alongside standalone download archives. The installed unpacked extension is **not** automatically updated; reload the unpacked extension from its updated folder in Edge/Chrome.
