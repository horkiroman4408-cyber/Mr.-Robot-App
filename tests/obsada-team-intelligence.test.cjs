'use strict';
const assert=require('node:assert/strict');
const t=require('../js/obsada-team-intelligence.js');
assert.equal(t.shiftDay('2026-11-15',-1),'2026-11-14');
const rows=[
 {date:'2026-11-14',login:'PD1',process:'METKI',hours:12,kind:'work',superseded:true},
 {date:'2026-11-14',login:'PD1',process:'AUDYT',hours:4,kind:'confirmed'},
 {date:'2026-11-14',login:'PD1',process:'METKI',hours:4,kind:'confirmed'},
 {date:'2026-11-14',login:'PD1',process:'NADWE',hours:4,kind:'confirmed'},
 {date:'2026-11-13',login:'PD1',process:'QC',hours:8,kind:'work'},
 {date:'2026-11-14',login:'PD2',process:'METKI',hours:8,kind:'work'},
 {date:'2026-11-14',login:'PD2',process:'QC',hours:4,kind:'plan'},
 {date:'2026-11-14',login:'PD1',process:'OLD',hours:2,kind:'work',excluded:true},
];
const s=t.summarize(rows,['PD1','PD2','PD3'],'2026-11-01','2026-11-15','2026-11-15');
assert.equal(s.cards[0].hours,20);
assert.equal(s.cards[1].hours,8);
assert.equal(s.cards[2].hours,0);
assert.deepEqual(s.cards[0].yesterday.map(p=>[p.process,p.hours]),[['AUDYT',4],['METKI',4],['NADWE',4]]);
assert.deepEqual(s.cards[0].dayBeforeYesterday.map(p=>[p.process,p.hours]),[['QC',8]]);
assert.ok(!s.processes.includes('OLD'));
assert.equal(t.summarize(rows,['PD1'],'2026-11-14','2026-11-14','2026-11-15').cards[0].hours,12);
console.log('PASS: selected team, date range, yesterday, SharePoint overlap, future and excluded rows');
