const assert=require('node:assert/strict');
const planner=require('../js/obsada-planner.js');
const oldInterval=global.setInterval;
global.setInterval=()=>0;
let plan;
try{plan=planner.create({reactive:x=>x,computed:fn=>({get value(){return fn();}}),roster:()=>[],source:()=>({intervals:[],history:[]}),sourceName:()=>'',language:()=> 'ru'});}finally{global.setInterval=oldInterval;}
const day='2030-01-01',shift='18-06',now=new Date('2030-01-01T23:30:00').getTime();
const records=Array.from({length:12},(_,slot)=>({day,shift,slot,login:'PD0009361',process:'METKI',updated:'2029-12-31T00:00:00Z'}));
const source={intervals:[
 {label:'18:00–19:00',people:[{login:'PD0009361',process:'METKI'},{login:'PD000532',process:'AUDYT'}]},
 {label:'22:00–23:00',people:[{login:'PD000532',process:'AUDYT'}]}
]};
const diffs=plan.compareStanPlan(source,day,shift,records,now);
const removal=diffs.filter(x=>x.login==='PD0009361');
assert.equal(removal.length,2,'elapsed and future removals are separate');
assert.deepEqual(removal.map(x=>[x.slot,x.endSlot,x.past,x.choice,x.incoming]),[[4,5,true,'mine',''],[5,12,false,'stan','']]);
assert.equal(plan.compareStanPlan({intervals:[{label:'22:00–23:00',people:[]}]},day,shift,records,now).length,0,'blank intervals never delete');
assert.equal(plan.compareStanPlan({intervals:[{label:'00:00–01:00',people:[{login:'PD000532',process:'AUDYT'}]}]},day,shift,records,now).filter(x=>x.removal)[0].slot,6,'only hours from populated snapshot are authoritative');
const previousIDB=global.indexedDB;
const storage=new Map();
global.indexedDB={open(){const req={};queueMicrotask(()=>{req.result={createObjectStore(){},close(){},transaction(){const tx={objectStore(){return {get(k){const r={};queueMicrotask(()=>{r.result=storage.get(k);r.onsuccess?.()});return r;},put(v,k){storage.set(k,v);queueMicrotask(()=>tx.oncomplete?.());return {};}};}};return tx;}};req.onsuccess?.();});return req;}};
(async()=>{
 try{
  const pause=global.setInterval;global.setInterval=()=>0;
  let p;try{p=planner.create({reactive:x=>x,computed:fn=>({get value(){return fn();}}),roster:()=>[],source:()=>({intervals:[],history:[]}),sourceName:()=>'',language:()=> 'ru'});}finally{global.setInterval=pause;}
  await new Promise(r=>setTimeout(r,10));
  p.state.records=records.map(x=>({...x}));p.state.stanChanges=diffs;p.state.stanReviewDay=day;p.state.stanReviewShift=shift;
  assert.equal(await p.applyStanReview(),true);
  assert.deepEqual(p.state.records.filter(x=>x.login==='PD0009361').map(x=>x.slot),[0,1,2,3,4], 'past hours retained, future assignment removed');
  assert.equal(p.state.records.some(x=>!x.process),false,'never insert empty process');
  assert.equal(storage.get('records').records.filter(x=>x.login==='PD0009361').length,5,'departure persisted to browser');
  console.log('PASS: departed employee removed from future plan, past preserved, blank STAN safe');
 }finally{global.indexedDB=previousIDB;}
})().catch(e=>{console.error(e);process.exitCode=1});
