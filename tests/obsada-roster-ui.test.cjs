'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'css/obsada-module.css'),'utf8');
const sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
test('STAN today shows exactly two dashboard metrics',()=>{
 const start=html.indexOf('<section class="obs-surface obs-today-results"');
 const end=html.indexOf('</template>',start);
 const block=html.slice(start,end);
 assert.equal((block.match(/class="obs-today-stat"/g)||[]).length,2);
 assert.match(block,/obsada\.totalPeople/);
 assert.match(block,/obsada\.processes\.length/);
 assert.doesNotMatch(block,/SUMA z arkusza/);
});
test('process cards show workers directly and use shared KPI employee profile',()=>{
 assert.match(html,/<article v-for="\(item,i\) in obsada\.processes"/);
 assert.match(html,/class="obs-person-button" @click="employeeOpen\(person\.login\)"/);
 assert.doesNotMatch(html,/<details v-for="\(item,i\) in obsada\.processes"/);
 assert.match(html,/v-if="employeeProfile && employeeSelected" class="employee-overlay"/);
});
test('layout adapts to narrow screens and respects reduced motion',()=>{
 assert.match(css,/obs-process-roster\{display:grid;grid-template-columns:repeat\(3/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('service worker and HTML use matching asset revision',()=>{
 const version='3.24.0-obsada-roster-20261113';
 assert.match(html,new RegExp('obsada-module\\.css\\?v='+version));
 assert.match(sw,new RegExp('obsada-module\\.css\\?v='+version));
 assert.match(sw,new RegExp('CACHE_REVISION = .v'+version));
});
