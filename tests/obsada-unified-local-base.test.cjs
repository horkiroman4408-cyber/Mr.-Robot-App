'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const api=require('../js/obsada-unified-history.js');
const planner=require('../js/obsada-planner.js');
const time=new Date('2026-11-15T23:30:00').getTime();
const day='2026-11-15';
function plan(login='PD000532',process='AUDYT',count=5){return Array.from({length:count},(_,slot)=>({day,shift:'18-06',slot,login,process}));}
function imported(login='PD000532',process='AUDYT',hours=12){return [{date:day,login,process,hours,source:'Listopad',sourceType:'main',raw:process+' ('+hours+'h)'}];}
function calc({history=imported(),records=plan(),statuses=[],now=time,exclude=()=>false}={}){
 return api.resolve({history,records,statuses,now,isExcluded:exclude,makeSlots:planner.makeSlots,isConfirmed:planner.autoHourConfirmed});
}
// Five confirmed local hours are the effective total, not 5+12.
const partial=calc();
const dayOnline=partial.rows.find(r=>r.origin==='import');
assert.equal(dayOnline.superseded,true);
assert.equal(partial.rows.filter(r=>r.kind==='confirmed').reduce((n,r)=>n+r.hours,0),5);
assert.equal(partial.discrepancies.length,1);
assert.equal(partial.discrepancies[0].difference,7);
assert.equal(partial.discrepancies[0].pending,true);
const completed=calc({now:Date.parse('2026-11-16T07:00:00')});
assert.equal(completed.discrepancies[0].pending,false);
// When no local record exists, the imported record is the one source of truth.
const noLocal=calc({records:[]});assert.equal(noLocal.rows[0].superseded,false);
assert.equal(noLocal.discrepancies.length,0);
// When local hours exactly match the imported process, there is no discrepancy.
const exact=calc({history:imported('PD000532','AUDYT',5)});assert.equal(exact.discrepancies.length,0);
// Equal total but different processes still requires checking.
const processMismatch=calc({history:imported('PD000532','METKI',5)});
assert.equal(processMismatch.discrepancies.length,1);
assert.equal(processMismatch.discrepancies[0].difference,0);
assert.equal(processMismatch.discrepancies[0].processDifferent,true);
// Repeated refresh with the same incoming data doesn't double-count.
const repeat=calc({history:imported()});assert.deepEqual(repeat.discrepancies,partial.discrepancies);
// Explicit historical exclusions must not appear in effective comparisons.
const excluded=calc({exclude:()=>true});assert.equal(excluded.discrepancies.length,0);
assert.equal(excluded.rows[0].excluded,true);
// Leave / day-off status is preserved without added hours.
const leave=calc({history:[],records:[],statuses:[{date:day,login:'PD000532',status:'WOLNY',source:'Listopad'}]});
assert.equal(leave.rows[0].kind,'status');assert.equal(leave.rows[0].hours,0);
// Source data retained in the local XLSX schema: no destructive rewrite.
const sheet=fs.readFileSync(path.join(__dirname,'../js/obsada-planner.js'),'utf8');
assert(sheet.includes("HISTORIA_IMPORT"));assert(sheet.includes("STATUSY"));
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
assert(html.indexOf('js/obsada-unified-history.js')<html.indexOf('js/app.js?v='));
assert(app.includes('MRObsadaUnifiedHistory.resolve'));
assert(app.includes('history:obsadaPlan.state.importedHistory,'));
assert(!app.includes('history:obsadaPlan.state.importedHistory.length?')); 
assert(app.includes("r.superseded&&src!=='import'"));
assert(sw.includes("'js/obsada-unified-history.js?v="));
console.log('PASS: effective local source, dedupe, process differences, in-progress status, exclusions, leave, assets');
