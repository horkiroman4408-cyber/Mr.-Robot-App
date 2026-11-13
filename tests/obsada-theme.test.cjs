'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/obsada-module.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('Obsada card and SPA view support every app theme',()=>{
 for(const t of ['light','dark','graphite','ivory']){
  assert.ok(css.includes(`html[data-theme="${t}"] #app .app-card[data-app="obsada"]`),t);
 }
 for(const t of ['dark','graphite','ivory'])assert.ok(css.includes(`html[data-theme="${t}"] #app[data-active-module="obsada"]`),t);
});
test('Obsada module badge uses the existing animated module badge classes',()=>{
 assert.match(html,/class="obs-icon module-context-badge obs-context-badge"/);
 assert.match(html,/class="module-context-icon"/);
});
test('Obsada card has themed flow section but does not render invented statistics',()=>{
 assert.match(html,/class="obsada-wide-features"/);
 assert.match(css,/\.obs-flow-track/);
 assert.ok(!html.includes('href="obsada.html"'));
});
