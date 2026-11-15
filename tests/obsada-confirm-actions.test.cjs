'use strict';
const assert=require('node:assert/strict');
const m=require('../js/obsada-planner.js');
const memory=new Map();
const original={indexedDB:global.indexedDB,confirm:global.confirm,setInterval:global.setInterval};
global.setInterval=()=>1;
global.confirm=()=>true;
global.indexedDB={open(){
 const request={result:null};
 queueMicrotask(()=>{
  const database={createObjectStore(){},close(){},transaction(){
   const tx={oncomplete:null,onabort:null,onerror:null};
   tx.objectStore=()=>({get(k){const req={result:memory.get(k)};queueMicrotask(()=>req.onsuccess?.());return req;},put(v,k){memory.set(k,v);queueMicrotask(()=>tx.oncomplete?.());return {};}});
   return tx;
  }};
  request.result=database;request.onupgradeneeded?.();request.onsuccess?.();
 });return request;
}};
const computed=fn=>({get value(){return fn();}});
(async()=>{
 const app=m.create({reactive:x=>x,computed,roster:()=>[],source:()=>null,language:()=> 'ru'});
 await new Promise(r=>setTimeout(r,10));
 const day='2020-11-13',shift='18-06';
 app.state.day=day;app.state.shift=shift;
 app.state.records=[{day,shift,slot:0,login:'PD1',process:'AUDYT'}];
 assert.equal(app.shiftStatus.value,'confirmed','past recorded hour closes automatically');
 assert.equal(app.finishedHours.value,1);
 assert.equal(await app.assign('PD1','METKI'),true,'past assignment stays editable');
 assert.equal(app.state.records[0].process,'METKI');
 assert.equal(memory.get('records').records[0].process,'METKI','updated local database');
 app.state.day='2099-11-13';app.state.records=[];
 assert.equal(app.shiftStatus.value,'planned');
 assert.equal(app.finishedHours.value,0);
 console.log('PASS: elapsed hours auto-counted, edits allowed, local changes saved');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{global.indexedDB=original.indexedDB;global.confirm=original.confirm;global.setInterval=original.setInterval;});
