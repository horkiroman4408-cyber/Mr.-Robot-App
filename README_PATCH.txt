Mr. Robot v3.26.0 — Obsada Worker Actions + Process Search FIX

Install OVER the latest v3.26.0, preserving repository-relative paths.
No version increment and no Bridge changes.

Changed:
- index.html: small worker action menu; only after choosing an action the respective form opens; one KPI entry.
- js/obsada-planner.js: worker action view state; process selection resets the search, reveals all cards, briefly highlights and scrolls to the selection.
- css/obsada-module.css: compact action menu and selected-process highlight.
- sw.js: updated precache revision / resource query.

Added tests:
- tests/obsada-menu-search-v326.test.cjs
- tests/obsada-early-departure-menu-v326.test.cjs (existing targeted regression test included)

Checks performed: node --check on JS and SW, both targeted tests PASS.
Not checked: full regression suite / visual interaction in Edge.
No changes to assignment calculation, XLSX schema, local history or Bridge.
