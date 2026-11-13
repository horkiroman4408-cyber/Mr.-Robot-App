'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/obsada-module.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('Obsada is themed in all four app themes',()=>{
 for(const t of ['light','dark','graphite','ivory']){
  assert.ok(css.includes(`html[data-theme="${t}"] #app .app-card[data-app="obsada"]`),t);
  assert.ok(css.includes(`html[data-theme="${t}"] #app .obsada-module {--obs-muted:`),t);
 }
 for(const t of ['dark','graphite','ivory'])assert.ok(css.includes(`html[data-theme="${t}"] #app[data-active-module="obsada"]`),t);
});
test('Accessible summary labels and normal animated module badge',()=>{
 assert.match(html,/class="obs-icon module-context-badge obs-context-badge"/);
 assert.match(css,/\.obs-today-stat small,/);
 assert.match(html,/class="obs-today-stats"/);
});
test('Wide card, no old standalone route',()=>{
 assert.match(html,/obsada-wide/);
 assert.match(css,/obsada-wide/);
 assert.doesNotMatch(html,/href="obsada\.html"/);
});
