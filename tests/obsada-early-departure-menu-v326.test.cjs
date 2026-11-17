'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const oldTimer=global.setInterval;
global.setInterval=()=>0;
const planner=require('../js/obsada-planner.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/obsada-module.css'),'utf8');
const obj=planner.create({reactive:x=>x,computed:f=>({get value(){return f()}}),roster:()=>[],source:()=>({employees:[],intervals:[]}),sourceName:()=>'',language:()=> 'ru'});
try{
 const day='2099-11-17',login='PDTEST1',shift='14-22';
 obj.state.day=day;obj.state.shift=shift;
 obj.state.shiftTeams={[`${day}|${shift}`]:[login]};
 const slots=planner.makeSlots(day,shift);
 obj.state.records=slots.map((slot,i)=>({day,shift,slot:i,login,process:'AUDYT'}));
 obj.state.importedStatuses=[{source:'Planowanie',date:day,login,status:'WCZESNIEJSZE_WYJSCIE@19:00'}];
 obj.state.from=4; // 18-19 worked
 assert.equal(obj.staffStatus({login,day,shift}),'');
 assert.equal(obj.displayedAssignments.value.length,1);
 assert.equal(obj.readonlyRoster.value.count,1);
 obj.state.from=5; // 19-20 departed
 assert.equal(obj.staffStatus({login,day,shift}),'early');
 assert.deepEqual(obj.combinedScheduled.value.map(x=>x.login),[login], 'worker remains available in planning');
 assert.equal(obj.displayedAssignments.value.length,0, 'no working assignments');
 assert.equal(obj.staffTotal.value,1);
 assert.equal(obj.staffWorkingCount(),0);
 obj.state.staffFilter='absent';assert.deepEqual(obj.listedWorkers.value,[login]);
 obj.state.staffFilter='free';assert.equal(obj.listedWorkers.value.length,0);
 obj.state.readonlyHourStamp=slots[5].start;
 assert.equal(obj.readonlyRoster.value.count,0,'departed worker excluded from staffing counts');
 obj.state.importedStatuses[0].status='WCZESNIEJSZE_WYJSCIE@19:00~21:00';
 obj.state.from=6;assert.equal(obj.staffStatus({login,day,shift}),'early');
 obj.state.from=7;assert.equal(obj.staffStatus({login,day,shift}),'');
 assert.equal(obj.staffWorkingCount(),1);
 assert.equal(obj.displayedAssignments.value.length,1);
 obj.state.readonlyHourStamp=slots[7].start;
 assert.equal(obj.readonlyRoster.value.count,1);
 assert.match(html,/obsadaPlan\.openProcessMenu\(person\)/);
 assert.match(html,/obsadaPlan\.openStaffActions\(person\)/);
 assert.match(html,/obsadaPlan\.state\.staffFilter==='absent'/);
 assert.doesNotMatch(html,/class="obs-plan-worker-actions"/);
 assert.match(css,/obs-plan-process-popup/);
 console.log('PASS early exit, retained roster, staffed count, resumed interval, process and employee menus');
}finally{global.setInterval=oldTimer;}
