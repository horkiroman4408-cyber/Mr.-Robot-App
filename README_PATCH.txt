Mr. Robot v3.26.0 - Obsada: contextual employee actions and early departure

Apply over the latest v3.26.0 Shared Hour Switch FIX. Copy files into the same relative paths.
Application version stays 3.26.0. Bridge version is unchanged. No GitHub commits.

- Left employee list: click an employee for actions; no per-row three-dots. Added Absent filter.
- Process employee chip: three-dots menu replaces the remove cross; actions are move, early departure, KPI, remove assignment.
- Early departure from the NEXT hour after the selected worked hour. The worker stays in the team but becomes absent during the marked intervals.
- Read-only Staffing excludes absent employees from process cards and all three working headcounts, including STAN fallback.
- Return from a selected future hour retains the previous absence interval in STATUSY (format WCZESNIEJSZE_WYJSCIE@HH:mm~HH:mm). Earlier historical markers remain supported.
- Assignments cannot be made during marked absences. Future hours are preserved as editable after return.
- STATUSY is the existing XLSX sheet; no new worksheets or changed Bridge protocol.

Tests: node tests/obsada-early-departure-menu-v326.test.cjs
Important: visual QA in Edge and full regression suite not completed; test on a backup of the local database.
