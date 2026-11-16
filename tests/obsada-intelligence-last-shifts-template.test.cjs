'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const team=require('../js/obsada-team-intelligence.js');
const work=(date,login,process,hours,kind='work',other={})=>({date,login,process,hours,kind,...other});
const rows=[
 work('2026-10-20','A','AUDYT',8),
 work('2026-11-10','A','METKI',4),
 work('2026-11-10','A','NADWE',4),
 {date:'2026-11-12',login:'A',status:'WOLNY',kind:'status'},
 {date:'2026-11-13',login:'A',status:'URLOP',kind:'status'},
 work('2026-11-14','A','QC',12,'work',{superseded:true}),
 work('2026-11-15','A','AUDYT',5,'confirmed',{shift:'06-18'}),
 work('2026-11-16','A','INNE DZIALY',12,'work'),
 work('2026-11-17','A','METKI',12,'work'),
 work('2026-11-16','A','SCALANIE',7,'plan'),
 work('2026-11-09','B','QC',10)
];
let card=team.summarize(rows,['A'],'2026-10-01','2026-10-31','2026-11-16').cards[0];
assert.equal(card.hours,8,'period totals stay scoped');
assert.deepEqual(card.lastActivities.map(v=>v.date),['2026-11-15','2026-11-13'],'recent activity includes leave between shifts');
assert.equal(card.lastActivities[1].status,'leave');
const off=team.summarize(rows,['A'],'2026-11-01','2026-11-30','2026-11-12').cards[0];
assert.deepEqual(off.lastActivities.map(v=>[v.date,v.kind]),[['2026-11-12','status'],['2026-11-10','work']]);
assert.equal(off.lastActivities[0].status,'dayOff');
const later=team.summarize(rows,['A'],'2026-11-01','2026-11-30','2026-11-16').cards[0];
assert.deepEqual(later.lastActivities.map(v=>v.date),['2026-11-15','2026-11-13'],'future statuses excluded, today imported work excluded');
assert.equal(later.dayOffDays,1);assert.equal(later.leaveDays,1);
assert.deepEqual(card.lastActivities[0].processes.map(v=>v.process),['AUDYT']);
assert.equal(card.lastActivities[0].processes[0].hours,5);
assert.deepEqual(team.summarize(rows,['A'],'2026-11-01','2026-11-30','2026-11-17').cards[0].lastActivities.map(v=>v.date),['2026-11-16','2026-11-15'],'today imported data becomes eligible only after its date has passed');
const confirmedToday=[...rows,work('2026-11-16','A','QC',2,'confirmed',{shift:'06-14'})];
assert.deepEqual(team.summarize(confirmedToday,['A'],'2026-11-01','2026-11-30','2026-11-16',new Date(2026,10,16,15).getTime()).cards[0].lastActivities.map(v=>v.date),['2026-11-16','2026-11-15'],'completed local shift can appear today');
assert.deepEqual(team.summarize(confirmedToday,['A'],'2026-11-01','2026-11-30','2026-11-16',new Date(2026,10,16,15).getTime()).cards[0].lastActivities[0].processes.map(v=>v.process),['QC'],'today imported hours do not mix with confirmed local hours');
assert.deepEqual(team.summarize([],['A'],'2026-11-01','2026-11-30').cards[0].lastActivities,[]);
// Status-only days must display as latest activity, with duplicates collapsed.
const statusesOnly=[
 {date:'2026-11-08',login:'X',status:'WOLNY',kind:'status'},
 {date:'2026-11-08',login:'X',status:'WOLNY',kind:'status'},
 {date:'2026-11-09',login:'X',status:'L4',kind:'status'},
 {date:'2026-11-21',login:'X',status:'URLOP',kind:'status'},
 {date:'2026-11-10',login:'X',status:'URLOP',kind:'status',excluded:true}
];
const x=team.summarize(statusesOnly,['X'],'2026-11-01','2026-11-30','2026-11-16').cards[0];
assert.deepEqual(x.lastActivities.map(v=>[v.date,v.status]),[['2026-11-09','sick'],['2026-11-08','dayOff']]);
assert.equal(x.dayOffDays,1);assert.equal(x.sickDays,1);assert.equal(x.leaveDays,1,'future leave counted in selected-period totals, not historical activity');
const collision=[{date:'2026-11-15',login:'X',status:'WOLNY',kind:'status'},work('2026-11-15','X','METKI',4,'confirmed',{shift:'06-18'})];
assert.equal(team.summarize(collision,['X'],'2026-11-01','2026-11-30','2026-11-16').cards[0].lastActivities[0].kind,'work','counted work takes precedence over conflicting status');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
assert.match(html,/@change="obsadaTeamSelectTemplate\(\)"/);
assert.doesNotMatch(html,/obsadaTeamAddTemplate/);
assert.match(html,/v-for="\(event,i\) in card\.lastActivities"/);
const app=fs.readFileSync(__dirname+'/../js/app.js','utf8');
const start=app.indexOf('function obsadaTeamSelectTemplate()');
const end=app.indexOf('function obsadaTeamOpenEmployee(',start);
assert(start>0&&end>start);
const script=app.slice(start,end);
const state={templateChoice:'agency',selected:['OLD','A'],chooserOpen:true};
const templates={agency:['A','B','A'],core:['C']};
const ctx={obsadaTeam:state,obsadaPlan:{state:{teamTemplates:templates},team:['D','E']}};
vm.createContext(ctx);
vm.runInContext(script+';globalThis.pick=obsadaTeamSelectTemplate;globalThis.pickShift=obsadaTeamAddShift;',ctx);
ctx.pick();assert.deepEqual([...state.selected],['A','B'],'replaces rather than appends existing people');
assert.equal(state.chooserOpen,false);
state.templateChoice='core';ctx.pick();assert.deepEqual([...state.selected],['C']);
ctx.pickShift();assert.deepEqual([...state.selected],['D','E']);assert.equal(state.templateChoice,'');
console.log('PASS latest work/status activity, protected period totals, selected-team replacement');
