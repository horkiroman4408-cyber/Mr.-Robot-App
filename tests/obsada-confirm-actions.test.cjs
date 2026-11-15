'use strict';
const assert=require('node:assert/strict');
const m=require('../js/obsada-planner.js');
const memory=new Map();
const saveGlobal={indexedDB:global.indexedDB,confirm:global.confirm,setInterval:global.setInterval};
global.setInterval=()=>1;
global.confirm=()=>true;
global.indexedDB={open(){
 const request={result:null};
 queueMicrotask(()=>{
  const database={
   createObjectStore(){},close(){},
   transaction(){
    const tx={oncomplete:null,onabort:null,onerror:null};
    tx.objectStore=()=>({
     get(k){const req={result:memory.get(k)};queueMicrotask(()=>req.onsuccess?.());return req;},
     put(v,k){memory.set(k,v);queueMicrotask(()=>tx.oncomplete?.());return {};}
    });
    return tx;
   }
  };
  request.result=database;
  request.onupgradeneeded?.();request.onsuccess?.();
 });return request;
}};
const computed=fn=>({get value(){return fn();}});
const reactive=x=>x;
(async()=>{
 const app=m.create({reactive,computed,roster:()=>[],source:()=>null,language:()=> 'ru'});
 await new Promise(r=>setTimeout(r,10));
 app.state.day='2026-11-13';app.state.shift='18-06';
 app.state.records=[{day:'2026-11-13',shift:'18-06',slot:0,login:'PD1',process:'AUDYT'}];
 assert.equal(app.shiftStatus.value,'pending');
 assert.equal(await app.confirmShift(),true);
 assert.equal(app.shiftStatus.value,'confirmed');
 assert.ok(memory.get('records').confirmations['2026-11-13|18-06']);
 assert.equal(await app.assign('PD1','METKI'),false);
 assert.equal(app.state.records[0].process,'AUDYT');
 assert.equal(await app.unlockShift(),true);
 assert.equal(app.shiftStatus.value,'pending');
 assert.equal(await app.assign('PD1','METKI'),true);
 assert.equal(app.state.records[0].process,'METKI');
 console.log('PASS: completed shift confirm, browser save, lock editing, unlock, edit');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{global.indexedDB=saveGlobal.indexedDB;global.confirm=saveGlobal.confirm;global.setInterval=saveGlobal.setInterval;});
