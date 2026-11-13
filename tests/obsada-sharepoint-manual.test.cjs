'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=f=>fs.readFileSync(path.join(root,f),'utf8');
test('Only manual SharePoint refresh is exposed; no background timer configured',()=>{
 const s=load('js/app.js');
 assert.match(s,/async function obsadaBridgeRefresh\(\)/);
 assert.match(s,/MR_SP_JOB_START/);
 assert.match(s,/MR_SP_JOB_STATUS/);
 assert.doesNotMatch(s,/setInterval\s*\([^)]*obsadaBridgeRefresh/);
});
test('App waits for complete before reading user-approved folder',()=>{
 const s=load('js/app.js');
 assert.match(s,/job\.state==='complete'/);
 assert.match(s,/getFileHandle\('Grafik procesowy \(godziny\)\.xlsx'\)/);
 assert.ok(s.indexOf("if(!done)throw Error('DOWNLOAD_TIMEOUT')")<s.indexOf("getFileHandle('Grafik"));
 assert.match(s,/obsada\.loadFile\(file,\{keepSelection:true\}\)/);
});
test('Bridge version and release metadata point to same version',()=>{
 const latest=JSON.parse(load('extension/openreports-bridge/latest.json'));
 const history=JSON.parse(load('extension/openreports-bridge/history.json'));
 assert.equal(latest.version,'0.3.22');assert.equal(history.releases[0].version,latest.version);
 assert.equal(latest.download,'downloads/OpenReports-Bridge-v0.3.22.zip');
});
test('Settings shows separate source state and correct app bridge method',()=>{
 const html=load('index.html'),js=load('js/app.js');
 assert.match(html,/obs-sp-settings-state/);
 assert.match(html,/@click="obsadaBridgeCheck"/);
 assert.match(js,/obsadaBridgeRefresh,obsadaBridgeCheck/);
});
