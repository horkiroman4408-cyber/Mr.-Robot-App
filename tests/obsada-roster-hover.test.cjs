'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/obsada-module.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const start = html.indexOf('<section class="obs-surface obs-today-results"');
const end = html.indexOf('<section v-else class="obs-surface"', start);
const roster = html.slice(start, end);

test('selected hour headcount excludes N/N, INNE DZIALY and W DOMU', () => {
  assert.match(roster, /<strong>\{\{ obsada\.processAssignmentsCount \}\}<\/strong>/);
  assert.doesNotMatch(roster, /<strong>\{\{ obsada\.totalPeople \}\}<\/strong>/);
  assert.match(roster, /<strong>\{\{ obsada\.otherPeopleCount \}\}<\/strong>/);
});
test('employee buttons show full name in tooltip, and keep login and KPI click', () => {
  assert.equal((roster.match(/@click="employeeOpen\(person\.login\)"/g) || []).length, 2);
  assert.equal((roster.match(/:title="pracownicyKpiLookup\(person\.login\)\?\.name \|\| eMsg\(/g) || []).length, 2);
  assert.equal((roster.match(/\{\{ person\.login \}\}/g) || []).length, 2);
  assert.doesNotMatch(roster, /obs-person-link/);
  assert.doesNotMatch(css, /\.obs-person-link\{/);
});
test('asset versions and service worker cache agree', () => {
  const rev = '3.24.0-obsada-roster-hover-20261113';
  assert.match(html, new RegExp('css/obsada-module\\.css\\?v=' + rev));
  assert.match(html, new RegExp('js/obsada-module\\.js\\?v=' + rev));
  assert.ok(sw.includes('v' + rev));
  assert.ok(sw.includes('css/obsada-module.css?v=' + rev));
  assert.ok(sw.includes('js/obsada-module.js?v=' + rev));
});
