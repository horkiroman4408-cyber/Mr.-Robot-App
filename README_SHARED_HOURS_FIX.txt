Mr. Robot v3.26.0 — Obsada Planowanie: shared-hour navigation fix

Apply over the latest v3.26.0 Day Team Card Menu FIX (keep folder paths).
Application version stays 3.26.0. Bridge remains unchanged.

Changes:
- Remove stray divider beneath the date field.
- Highlight ALL teams active at the currently selected real hour (not only state.shift).
- On hour selection use the most recently started active schedule as the editing context. Moving from 17:00 to 18:00 switches LPP 14:00–22:00 to Agencja 18:00–06:00; moving backward switches back. Both teams remain visible in shared process/staffing view during overlaps.
- Refresh CSS/JS resource query versions and PWA service-worker revision to prevent stale caches.

No changes to assignment records, calculation of hours, local XLSX schema, team templates or history.

Targeted tests (passed): obsada-shared-hours-v326, obsada-day-team-workflow, obsada-day-team-menu-v326, obsada-auto-hours.
Existing tests obsada-v326-workflow and obsada-confirmation contain old UI expectations and fail on the newer layout; these were not changed by this patch.
Visual Edge browser testing not performed.
