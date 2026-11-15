'use strict';
const assert=require('node:assert/strict');
const m=require('../js/obsada-planner.js');
const memory=new Map();
const original={indexedDB:global.indexedDB,confirm:global.confirm,setInterval:global.setInterval};
global.setInterval=()=>1;
global.confirm=()=>true;
global.indexedDB={open(){
 const req={result:null};queueMicrotask(()=>{
  const db={createObjectStore(){},close(){},transaction(){const tx={oncomplete:null,onerror:null,onabort:null};tx.objectStore=()=>({
    get(key){const r={result:memory.get(key)};queueMicrotask(()=>r.onsuccess?.());return r;},
    put(val,key){memory.set(key,val);queueMicrotask(()=>tx.oncomplete?.());return {};}
   });return tx;}};req.result=db;req.onupgradeneeded?.();req.onsuccess?.();
 });return req;
}};
const computed=fn=>({get value(){return fn();}});
(async()=>{
 const app=m.create({reactive:x=>x,computed,roster:()=>[],source:()=>null,language:()=> 'ru'});
 await new Promise(r=>setTimeout(r,10));
 const imported={date:'2026-11-01',login:'PD01',process:'AUDYT',hours:8,source:'Listopad',sourceType:'main',raw:'AUDYT (8h)',origin:'import',kind:'work',excluded:false};
 app.state.importedHistory=[{...imported}];
 assert.equal(await app.manageHistoryRows([imported]),true);
 assert.equal(app.state.excludedHistory.length,1);
 assert.equal(app.state.importedHistory.length,1,'source record must remain unchanged');
 assert.equal(memory.get('records').excludedHistory.length,1,'exclusion persisted');
 assert.equal(await app.manageHistoryRows([{...imported,excluded:true}]),true);
 assert.equal(app.state.excludedHistory.length,0,'restore');
 const r={day:'2026-11-14',shift:'18-06',slot:0,login:'PD01',process:'METKI'};
 app.state.records=[r];
 assert.equal(await app.manageHistoryRows([{origin:'plan',kind:'confirmed',date:r.day,shift:r.shift,login:r.login,process:r.process,hours:1}]),true);
 assert.equal(app.state.records.length,0);
 assert.equal(memory.get('records').records.length,0);
 console.log('PASS: history SharePoint exclude/restore, plan deletion, local persistence');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{global.indexedDB=original.indexedDB;global.confirm=original.confirm;global.setInterval=original.setInterval;});
