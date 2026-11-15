'use strict';
const assert=require('node:assert/strict');
const t=require('../js/obsada-team-intelligence.js');
const rows=[
 {date:'2026-11-14',login:'PD1',kind:'status',status:'URLOP',hours:0},
 {date:'2026-11-13',login:'PD1',kind:'status',process:'WOLNY',hours:0},
 {date:'2026-11-14',login:'PD2',kind:'status',status:'WOLNY',excluded:true},
 {date:'2026-11-13',login:'PD2',kind:'status',status:'L4'},
 {date:'2026-11-14',login:'PD3',kind:'work',process:'METKI',hours:8},
 {date:'2026-11-14',login:'PD3',kind:'status',status:'URLOP'},
 {date:'2026-11-13',login:'PD3',kind:'status',status:'WOLNY'},
];
const cards=t.summarize(rows,['PD1','PD2','PD3'],'2026-10-01','2026-10-31','2026-11-15').cards;
assert.deepEqual(cards[0].yesterdayStatuses,['URLOP']);
assert.deepEqual(cards[0].dayBeforeYesterdayStatuses,['WOLNY']);
assert.equal(cards[0].hours,0,'day statuses must not count as working hours');
assert.deepEqual(cards[1].yesterdayStatuses,[],'excluded status ignored');
assert.deepEqual(cards[1].dayBeforeYesterdayStatuses,['L4']);
assert.deepEqual(cards[2].yesterday.map(r=>[r.process,r.hours]),[['METKI',8]]);
assert.deepEqual(cards[2].yesterdayStatuses,['URLOP']);
assert.deepEqual(cards[2].dayBeforeYesterdayStatuses,['WOLNY']);
const html=require('fs').readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
assert.ok(html.includes('card.yesterdayStatuses.length'));
assert.ok(html.includes('card.dayBeforeYesterdayStatuses.length'));
const app=require('fs').readFileSync(require('path').join(__dirname,'../js/app.js'),'utf8');
assert.ok(app.includes('obsadaTeamDayStatus'));
assert.ok(app.includes('obsada.state.model?.statuses'));
console.log('PASS: URLOP/WOLNY and absence statuses shown without adding hours, old periods work');
