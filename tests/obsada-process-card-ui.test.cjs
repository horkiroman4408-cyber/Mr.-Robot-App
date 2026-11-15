'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const src=fs.readFileSync(__dirname+'/../js/obsada-planner.js','utf8');
const ctx={console,Date,setTimeout,clearTimeout,confirm:()=>true};
vm.runInNewContext(src,ctx,{timeout:10000});
const planner=ctx.MRObsadaPlanner;
const people=[{login:'PD0001',process:'AUDYT'}];
const obj=planner.create({reactive:x=>x,computed:fn=>({get value(){return fn();}}),roster:()=>[],source:()=>({employees:['PD0001'],intervals:[{people,officialSummary:{'AUDYT':1,'METKI':0}}]}),sourceName:()=>'',language:()=> 'en'});
const state=obj.state;
(async()=>{
  // IndexedDB is not available in VM, but the in-memory UI mutation still occurs.
  assert(obj.processes.value.includes('AUDYT'));
  assert(obj.processCards.value.some(p=>p.name==='METKI'));
  assert.equal(await obj.hideProcess('METKI'),true);
  assert(!obj.processCards.value.some(p=>p.name==='METKI'));
  assert(state.hiddenProcesses.includes('METKI'));
  assert.equal(await obj.addProcess('metki'),true);
  assert(obj.processCards.value.some(p=>p.name==='METKI'));
  assert(!state.hiddenProcesses.includes('METKI'));
  state.processFilter='';state.showAllProcesses=true;
  state.records=[{day:state.day,shift:state.shift,slot:0,login:'PD0001',process:'AUDYT'}];
  assert.equal(await obj.hideProcess('AUDYT'),false,'occupied card should not be removable');
  assert(obj.processCards.value.some(p=>p.name==='AUDYT'));
  console.log('PASS card hide, restoration from catalog, and assigned-card protection');
})().catch(e=>{console.error(e);process.exitCode=1;});
