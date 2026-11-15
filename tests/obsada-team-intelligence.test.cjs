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

assert.deepEqual(t.calendarRange('week',0,'2026-11-15'),{from:'2026-11-09',to:'2026-11-15'});
assert.deepEqual(t.calendarRange('week',-1,'2026-11-15'),{from:'2026-11-02',to:'2026-11-08'});
assert.deepEqual(t.calendarRange('month',0,'2026-11-15'),{from:'2026-11-01',to:'2026-11-30'});
assert.deepEqual(t.calendarRange('month',-1,'2026-01-09'),{from:'2025-12-01',to:'2025-12-31'});
assert.deepEqual(t.calendarRange('month',-1,'2024-03-15'),{from:'2024-02-01',to:'2024-02-29'});

// Yesterday and the day before do not disappear when browsing an older month.
const older=t.summarize(rows,['PD1'],'2026-10-01','2026-10-31','2026-11-15').cards[0];
assert.equal(older.hours,0);
assert.deepEqual(older.yesterday.map(p=>[p.process,p.hours]),[['AUDYT',4],['METKI',4],['NADWE',4]]);
