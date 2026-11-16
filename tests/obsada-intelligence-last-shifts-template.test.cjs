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
 work('2026-11-15','A','AUDYT',5,'confirmed'),
 work('2026-11-16','A','SCALANIE',7,'plan'),
 work('2026-11-09','B','QC',10)
];
let card=team.summarize(rows,['A'],'2026-10-01','2026-10-31','2026-11-16').cards[0];
assert.equal(card.hours,8,'period totals stay scoped');
assert.deepEqual(card.lastShifts.map(v=>v.date),['2026-11-15','2026-11-10'],'recent work across selected period');
assert.deepEqual(card.lastShifts[1].processes.map(v=>v.process),['METKI','NADWE']);
assert.equal(card.lastShifts[0].processes[0].hours,5);
assert.deepEqual(team.summarize([],['A'],'2026-11-01','2026-11-30').cards[0].lastShifts,[]);
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
assert.match(html,/@change="obsadaTeamSelectTemplate\(\)"/);
assert.doesNotMatch(html,/obsadaTeamAddTemplate/);
assert.match(html,/v-for="\(shift,i\) in card\.lastShifts"/);
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
console.log('PASS latest actual shifts, protected period totals, selected-team replacement');
