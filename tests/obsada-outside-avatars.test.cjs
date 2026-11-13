'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(base,'js/obsada-module.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'css/obsada-module.css'),'utf8');
const sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
function obs(){
 const window={};vm.runInNewContext(js,{window});
 const o=window.createMrObsada({reactive:x=>x,computed:f=>({get value(){return f();}}),markRaw:x=>x});
 o.state.model={intervals:[{key:'1',people:[
  {login:'PD1',process:'SCALANIE'}, {login:'PD2',process:'INNE DZIAŁY'},
  {login:'PD3',process:'N/N'}, {login:'PD4',process:'W DOMU'},
  {login:'PD5',process:'AUDYT'}, {login:'PD6',process:'INNE DZIALY'}
 ],officialSummary:{'SCALANIE':1,'AUDYT':1,'INNE DZIAŁY':2},summary:{SCALANIE:1,AUDYT:1,'INNE DZIAŁY':1,'N/N':1,'W DOMU':1,'INNE DZIALY':1},officialTotal:2}],history:[]};
 o.state.interval='1';return o;
}
test('N/N, INNE DZIALY (including Polish accent), W DOMU count separately',()=>{
 const o=obs();
 assert.equal(o.otherPeopleCount.value,4);
 assert.equal(o.processAssignmentsCount.value,2);
 assert.equal(o.totalPeople.value,6);
 assert.deepEqual(Array.from(o.otherAssignments.value, x=>[x.name,x.count]),[['N/N',1],['INNE DZIALY',2],['W DOMU',1]]);
 assert.deepEqual(Array.from(o.processes.value,x=>x.name).sort(),['AUDYT','SCALANIE']);
});
test('Initials use name and surname, never a login',()=>{
 const o=obs();assert.equal(o.personInitials('Anna Nowak'),'AN');
 assert.equal(o.personInitials('Jan Maria Kowalski'),'JK');
 assert.equal(o.personInitials(''),'');assert.equal(o.personInitials('36001214'),'');
 assert.equal(o.personInitials('Anna'),'');
});
test('Third KPI appears conditionally and all workers retain shared profile action',()=>{
 assert.match(html,/v-if="obsada.otherPeopleCount" class="obs-today-stat obs-today-stat-other"/);
 assert.match(html,/v-for="\(item,i\) in obsada.otherAssignments"/);
 assert.equal((html.match(/@click="employeeOpen\(person.login\)"/g)||[]).length,2);
 assert.equal((html.match(/obsada\.personInitials\(pracownicyKpiLookup\(person.login\)\?\.name\)/g)||[]).length,4);
 assert.doesNotMatch(html,/String\(person.login\)\.slice\(0,1\)/);
});
test('Cache references and responsive design reflect new code',()=>{
 const rev='3.24.0-obsada-poza-avatars-20261113';
 for(const name of ['obsada-module.css','obsada-module.js']){
  assert.ok(html.includes(name+'?v='+rev));assert.ok(sw.includes(name+'?v='+rev));
 }
 assert.ok(sw.includes('v'+rev));
 assert.match(css,/obs-today-stats\.has-other/);
 assert.match(css,/@media\(max-width:430px\)/);
});
