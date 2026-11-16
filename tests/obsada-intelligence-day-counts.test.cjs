'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const team=require('../js/obsada-team-intelligence.js');
const login='PD000532';
const work=(date,process,hours)=>({date,login,process,hours,kind:'work'});
const status=(date,value,more={})=>({date,login,status:value,kind:'status',...more});
const rows=[
 work('2026-11-02','AUDYT',8),work('2026-11-02','METKI',4),work('2026-11-03','SCALANIE',8),
 status('2026-11-04','WOLNY'),status('2026-11-04','WOLNY'),
 status('2026-11-05','URLOP'),status('2026-11-06','URLOP'),
 status('2026-11-07','L4'),status('2026-11-08','CHOROBOWE'),status('2026-11-09','ZWOLNIENIE'),
 status('2026-11-10','WOLNY',{excluded:true}),status('2026-11-11','WOLNY',{superseded:true}),
 status('2026-10-29','WOLNY'),status('2026-11-12','SOMETHING ELSE'),
 status('2026-11-15','URLOP')
];
const card=team.summarize(rows,[login],'2026-11-01','2026-11-14','2026-11-16').cards[0];
assert.equal(card.hours,20);
assert.equal(card.days,2,'unique working dates rather than process rows');
assert.equal(card.dayOffDays,1,'unique WOLNY dates only');
assert.equal(card.leaveDays,2,'unique URLOP dates within range only');
assert.equal(card.sickDays,3,'each recognized sick-day status');
assert.deepEqual(card.yesterdayStatuses,['URLOP'],'yesterday remains independent of the analysis range');
const past=team.summarize(rows,[login],'2026-10-01','2026-10-31','2026-11-16').cards[0];
assert.equal(past.dayOffDays,1);
assert.equal(past.leaveDays,0);
assert.equal(past.days,0);
const empty=team.summarize([],['PD000999'],'2026-11-01','2026-11-30','2026-11-16').cards[0];
assert.equal(empty.dayOffDays,0,'no record must never become a day off');
assert.equal(empty.leaveDays,0);
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
assert.match(html,/obs-team-intel-stats/);
assert.match(html,/card\.dayOffDays/);
assert.match(html,/card\.leaveDays/);
assert.match(html,/card\.sickDays/);
assert.match(html,/obsadaTeamOpenEmployee\(card\.login\)/);
assert.match(html,/v-for="proc in card\.processes"/);
assert.match(html,/card\.yesterdayStatuses/);
const css=fs.readFileSync(__dirname+'/../css/obsada-module.css','utf8');
assert.match(css,/\.obs-team-intel-stats/);
console.log('PASS Intelligence compact day summary, status dedup, period, leave, KPI entry and processes');
