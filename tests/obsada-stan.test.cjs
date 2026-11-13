'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const parser=require('../js/obsada.js');
const fakeXlsx={utils:{sheet_to_json:s=>s.rows}};
const STAN=[
 ['PD/SAP','06:00 - 07:00','07:00 - 08:00'],
 ['36001214','SCALANIE','SCALANIE'],
 ['36001235','AUDYT','AUDYT'],
 ['PD000980','ROZKŁADANIE PO SCALANIU','ROZKŁADANIE PO SCALANIU'],
 ['Yana','NADWE','NADWE'],
 ['Mariana','AUDYT GEEK','AUDYT GEEK'],
 ['','',''],
 ['AUDYT',1,1],['SCALANIE',1,1],['NADWE',1,1],
 ['ROZKŁADANIE PO SCALANIU',1,1],['AUDYT GEEK',1,1],['VAS',0,0],
 ['SUMA:',5,5],['N/N',0,0],['INNE DZIAŁY',0,0]
];
test('STAN separates worker assignments from numeric process totals',()=>{
 const result=parser.extract({SheetNames:['STAN'],Sheets:{STAN:{rows:STAN}}},fakeXlsx);
 const iv=result.intervals[0];
 assert.equal(iv.people.length,5);
 assert.equal(iv.summary.AUDYT,1);
 assert.equal(iv.officialSummary.AUDYT,1);
 assert.equal(iv.officialSummary.VAS,0);
 assert.equal(iv.officialTotal,5);
 assert.equal(iv.summary['1'],undefined);
 assert.equal(iv.summary['0'],undefined);
 assert.ok(iv.people.some(x=>x.login==='Yana'&&x.process==='NADWE'));
 assert.equal(iv.people.some(x=>x.login==='SUMA:'),false);
});
test('STAN remains useful when no bottom summary table exists',()=>{
 const model=parser.extract({SheetNames:['STAN'],Sheets:{STAN:{rows:[STAN[0],STAN[1],STAN[2]]}}},fakeXlsx);
 assert.equal(model.intervals[0].people.length,2);
 assert.deepEqual(model.intervals[0].officialSummary,{});
 assert.equal(model.intervals[0].officialTotal,null);
});
test('ignore numeric report quantities as process names even without SUMA',()=>{
 const model=parser.extract({SheetNames:['STAN'],Sheets:{STAN:{rows:[STAN[0],STAN[1],['AUDYT',2,2],['NADWE','0',0]]}}},fakeXlsx);
 assert.equal(model.intervals[0].people.length,1);
});
test('Obsada is included in common IndexedDB restore, mobile restore, and deletion',()=>{
 const fs=require('node:fs');const path=require('node:path');
 const app=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
 const mod=fs.readFileSync(path.join(__dirname,'../js/obsada-module.js'),'utf8');
 assert.match(app,/obsada:'Obsada · STAN'/);
 assert.match(app,/obsada:obsada\.state/);
 assert.match(app,/obsada\.setPersist\(file=>mrFilePut\('obsada',file\)\)/);
 assert.match(app,/obsada:\(\)=>obsada\.reset\(\)/);
 assert.match(app,/obsada:.*?obsada\.loadFile\(/);
 assert.match(mod,/if\(!restore&&persist\)await persist\(file\)/);
});
