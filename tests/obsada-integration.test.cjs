'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'..');
const get=name=>fs.readFileSync(path.join(dir,name),'utf8');
test('Obsada is a first-class SPA view, not a separate page',()=>{
 const html=get('index.html');
 assert.match(html,/view === 'obsada'/);
 assert.match(html,/@click="view = 'obsada'"/);
 assert.match(html,/src="js\/obsada-module\.js(?:\?[^"]+)?"/);
 assert.doesNotMatch(html,/href="obsada\.html"/);
 assert.ok(!fs.existsSync(path.join(dir,'obsada.html')));
 assert.ok(!fs.existsSync(path.join(dir,'css/obsada.css')));
});
test('Obsada imports and Vue wiring are isolated from other modules',()=>{
 const js=get('js/app.js');
 assert.match(js,/const obsada=reactive\(window\.createMrObsada/);
 assert.match(js,/obsada,kpiAttrOpts/);
 const html=get('index.html');
 for(const view of ['kpi','rs','mp','inne','settings','changelog'])assert.ok(html.includes(`view === '${view}'`),view);
 const sw=get('sw.js');
 for(const f of ['css/obsada-module.css','js/obsada.js','js/obsada-module.js'])assert.ok(sw.includes(`'${f}`),f);
});
