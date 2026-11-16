'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),app=read('js/app.js'),ui=read('js/obsada-controls.js'),css=read('css/obsada-module.css'),sw=read('sw.js');
test('all dropdowns inside Obsada use a single custom select with native model preserved',()=>{
 const section=html.split('\n').slice(193,470).join('\n');
 assert.equal((section.match(/<select\s/g)||[]).length,0);
 assert.equal((section.match(/<mr-obsada-select\s/g)||[]).length,14);
 assert.equal((section.match(/<\/mr-obsada-select>/g)||[]).length,14);
 assert.match(ui,/emits:\['update:modelValue','change'\]/);
 assert.match(ui,/modelModifiers/);
 assert.match(app,/\.component\('mr-obsada-select',window\.MRObsadaControls\.select\)/);
});
test('calendar, language and theme styling remain scoped to Obsada',()=>{
 assert.match(app,/\.component\('mr-obsada-date',window\.MRObsadaControls\.date\)/);
 assert.ok((html.match(/<mr-obsada-date :lang="uiLanguage"/g)||[]).length>=4);
 for(const name of ['pl','ru','en','uk'])assert.match(ui,new RegExp(name+':'));
 for(const name of ['dark','light'])assert.match(css,new RegExp('data-theme="'+name+'"'));
 assert.match(css,/prefers-reduced-motion/);
 assert.match(ui,/Escape/);
 assert.match(ui,/role="listbox"/);
});
test('all new files are in the PWA shell',()=>{
 assert.match(html,/js\/obsada-controls\.js\?v=3\.25\.0-popovers-1/);
 assert.match(sw,/js\/obsada-controls\.js\?v=3\.25\.0-popovers-1/);
 assert.match(sw,/css\/obsada-module\.css\?v=3\.25\.0-popovers-1/);
});
test('date parsing validates days and keeps ISO values',()=>{
 const sandbox={window:{MRI18N:{language:'pl'}}};vm.runInNewContext(ui,sandbox);
 const {parseISO,iso}=sandbox.window.MRObsadaControls;
 assert.equal(parseISO('2026-02-30'),null);
 assert.equal(parseISO('2026-02-28').getDate(),28);
 assert.equal(iso(new Date(2026,10,16,12)),'2026-11-16');
});
