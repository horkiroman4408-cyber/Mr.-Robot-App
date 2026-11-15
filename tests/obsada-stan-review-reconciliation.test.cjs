const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=require('../js/obsada-planner.js');
const oldTimer=global.setInterval;
global.setInterval=()=>0;
let created;
try{
 created=root.create({reactive:x=>x,computed:fn=>({get value(){return fn();}}),roster:()=>[],source:()=>({intervals:[],history:[]}),sourceName:()=>'',language:()=> 'ru'});
}finally{global.setInterval=oldTimer;}
function source(login='PD001',process='METKI'){
 return {intervals:[{label:'18:00–19:00',people:[{login,process}]}],history:[],statuses:[],sheetNames:[]};
}
const day='2030-01-01',shift='18-06';
const original=Array.from({length:12},(_,slot)=>({day,shift,slot,login:'PD001',process:'AUDYT',updated:'2026-11-15T00:00:00.000Z'}));
const diff=created.compareStanPlan(source(),day,shift,original,new Date('2029-12-31').getTime());
assert.equal(diff.length,1,'12 hour differences should group into one row');
assert.equal(diff[0].slot,0);assert.equal(diff[0].endSlot,12);
assert.equal(diff[0].choice,'mine','existing local hours remain authoritative');
assert.equal(diff[0].incoming,'METKI');
const fresh=created.compareStanPlan(source('PD002','VAS'),day,shift,original,new Date('2029-12-31').getTime());
assert.equal(fresh.length,1);
assert.equal(fresh[0].choice,'stan','missing future assignments can be accepted by default');
const past=created.compareStanPlan(source(),day,shift,original,new Date('2030-01-03').getTime());
assert.equal(past[0].past,true);assert.equal(past[0].choice,'mine');
assert.equal(created.compareStanPlan({intervals:[]},day,shift,original).length,0,'blank STAN never removes data');
const local=[[...original][0]];
assert.equal(created.compareStanPlan(source('PD001','AUDYT'),day,shift,local,new Date('2029-12-31').getTime()).length,1,'existing first hour plus missing future hours are previewed');

// Test current History computation with hour totals that cannot be safely combined.
const app=fs.readFileSync(require('node:path').resolve(__dirname,'../js/app.js'),'utf8');
const a=app.indexOf('const obsadaHistoryReconciliation=computed(()=>{');
const b=app.indexOf('const obsadaHistoryReconciliationVisible=',a);
assert(a>0&&b>a);
const confirmedRows=[...Array.from({length:4},(_,slot)=>({day:'2026-11-14',shift:'18-06',slot,login:'PD001',process:'AUDYT'}))];
const mock={
 computed:fn=>({get value(){return fn();}}),
 obsadaPlan:{state:{importedHistory:[{date:'2026-11-14',login:'PD001',process:'METKI',hours:12,source:'Listopad'}],records:confirmedRows},clockNow:new Date('2026-11-16').getTime(),isExcluded:()=>false},
 obsada:{state:{model:null}},window:{MRObsadaPlanner:root}
};
vm.runInNewContext(app.slice(a,b)+'this.getDifferences=()=>obsadaHistoryReconciliation.value;',mock);
const report=mock.getDifferences();
assert.equal(report.length,1);assert.equal(report[0].imported,12);assert.equal(report[0].local,4);assert.equal(report[0].difference,8);
assert.equal(mock.obsadaPlan.state.records.length,4,'no invented hours are added');
console.log('PASS: grouped hours, new and existing appointments, elapsed protection, empty STAN, discrepancy without invented hours');
// Integration of the choice with the planner save path, using an in-memory
// IndexedDB double rather than a real browser or network service.
(async()=>{
 const oldIndexedDB=global.indexedDB,oldSetInterval=global.setInterval;
 const storage=new Map();
 global.setInterval=()=>0;
 global.indexedDB={open(){
  const req={};
  queueMicrotask(()=>{
   req.result={
    createObjectStore(){},close(){},
    transaction(_store,mode){
     const tx={objectStore(){return {
      get(k){const r={};queueMicrotask(()=>{r.result=storage.get(k);r.onsuccess?.()});return r;},
      put(v,k){storage.set(k,v);queueMicrotask(()=>tx.oncomplete?.());return {};}
     };}};
     return tx;
    }
   };req.onsuccess?.();
  });return req;
 }};
 try{
  const planner=root.create({reactive:x=>x,computed:fn=>({get value(){return fn();}}),roster:()=>[],source:()=>({intervals:[],history:[]}),sourceName:()=>'',language:()=> 'ru'});
  await new Promise(resolve=>setTimeout(resolve,10));
  planner.state.records=original.map(r=>({...r}));
  const changes=planner.compareStanPlan(source(),day,shift,planner.state.records,new Date('2029-12-31').getTime());
  assert.equal(changes.length,1);
  planner.state.stanChanges=changes;
  planner.state.stanReviewDay=day;planner.state.stanReviewShift=shift;
  assert.equal(planner.state.stanChanges[0].choice,'mine');
  planner.state.stanChanges[0].choice='stan';
  assert.equal(await planner.applyStanReview(),true);
  assert.equal(planner.state.records.filter(r=>r.process==='METKI').length,12);
  assert.equal(new Set(planner.state.records.map(r=>r.slot+'|'+r.login)).size,12,'no duplicate hourly assignments');
  assert.equal(planner.state.stanChanges.length,0);
  assert.equal(planner.compareStanPlan(source(),day,shift,planner.state.records).length,0,'repeat sync is idempotent');
  assert.equal(storage.get('records').records.length,12,'result saved in browser database');
  console.log('PASS: explicit STAN choice replaces exactly the selected hourly records, saves, and re-import is idempotent');
 }finally{global.indexedDB=oldIndexedDB;global.setInterval=oldSetInterval;}
})().catch(err=>{console.error(err);process.exitCode=1;});
