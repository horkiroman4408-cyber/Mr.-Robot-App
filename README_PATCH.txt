Mr. Robot v3.26.0 — Obsada saved team management UI fix

Install this patch OVER the already installed Mr. Robot v3.26.0.
Copy the included files into the matching paths at the repository root.
Do not delete any other app files. Bridge extension is unchanged.

Saved team editor: "Zarządzaj / Управление" beside "Dodaj zespół".
Create a saved team, edit the name and members and save both in one action.
Daily shift memberships and historical assignments are NOT modified when saving the template.
Select an existing saved team and its schedule to add it to a given day.
A separate "Edit this shift roster" remains available when the current day's membership needs changing.

Includes a targeted test: node tests/obsada-template-editor-v326.test.cjs
Automated checks were not a full browser/Edge end-to-end test.
