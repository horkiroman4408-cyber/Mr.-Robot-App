'use strict';
const assert=require('node:assert/strict');
const intel=require('../js/obsada-team-intelligence.js');
const day='2026-11-16';
const noonShift=[
 {date:'2026-11-15',login:'A',process:'AUDYT',hours:12,kind:'confirmed',shift:'06-18'},
 {date:day,login:'A',process:'SCALANIE',hours:1,kind:'confirmed',shift:'18-06'},
 {date:day,login:'A',process:'QC',hours:2,kind:'confirmed',shift:'14-22'},
 {date:'2026-11-14',login:'A',kind:'status',status:'WOLNY'}
];
const get=(clock,ref=day)=>intel.summarize(noonShift,['A'],'2026-11-01','2026-11-30',ref,new Date(clock).getTime()).cards[0];
const at19=get('2026-11-16T19:00:00');
assert.deepEqual(at19.lastActivities.map(x=>x.date),['2026-11-15','2026-11-14'],'ongoing late and early shifts must not appear');
assert.equal(at19.hours,15,'confirmed counted hours must remain unchanged');
const at23=get('2026-11-16T23:00:00');
assert.deepEqual(at23.lastActivities.map(x=>x.date),[day,'2026-11-15'],'14-22 is finished while 18-06 is still underway');
assert.deepEqual(at23.lastActivities[0].processes.map(x=>x.process),['QC']);
const at5=get('2026-11-17T05:00:00','2026-11-17');
assert.deepEqual(at5.lastActivities[0].processes.map(x=>x.process),['QC'],'night work must be ignored before 06:00');
const at6=get('2026-11-17T06:00:00','2026-11-17');
assert.deepEqual(at6.lastActivities[0].processes.map(x=>x.process).sort(),['QC','SCALANIE']);
const withoutShift=intel.summarize([{date:day,login:'A',kind:'confirmed',process:'METKI',hours:3}],['A'],day,day,day,new Date('2026-11-16T23:00:00').getTime()).cards[0];
assert.equal(withoutShift.lastActivities.length,0,'unknown shift must not be inferred complete');
assert.equal(withoutShift.hours,3,'do not change statistics');
console.log('PASS completed shift activity at 19/23/05/06, unknown schedule, period totals');
