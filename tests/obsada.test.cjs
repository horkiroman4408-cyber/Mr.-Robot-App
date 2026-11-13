'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../js/obsada.js');
const fakeXlsx={utils:{sheet_to_json:s=>s.rows},SSF:{parse_date_code:num=>({y:2026,m:6,d:num-46173})}};
const workbook={SheetNames:['STAN','Czerwiec','Inne 06'],Sheets:{
 STAN:{rows:[['PD/SAP','08:00 - 09:00','09:00 - 10:00'],['P001','AUDYT',''],['P002','SCALANIE','VAS']]},
 Czerwiec:{rows:[['PD',46174,46175],['P001','METKI (4h)/NADWE (4h)','WOLNY'],['P002','SCALANIE (8h)','URLOP']]},
 'Inne 06':{rows:[['PD',46174,46175],['P001','OUT (8h)',''],['P002','','']]}
}};
test('interval boundaries and overnight',()=>{let a=api.parseInterval('22:00 - 23:00'),b=api.parseInterval('23:00 - 00:00');assert.equal(a.start,1320);assert.equal(b.end,0);assert.ok(api.inInterval(b,new Date(2026,10,13,23,30)));assert.ok(!api.inInterval(b,new Date(2026,10,13,0,30)));assert.equal(api.parseInterval('16:00 - 17:02').end,1022);assert.equal(api.parseInterval('25:00 - 27:00'),null);});
test('mixed history assignments and leave',()=>{let parsed=api.parseAssignment('METKI (4h)/NADWE (4h)');assert.deepEqual(parsed.items,[{process:'METKI',hours:4},{process:'NADWE',hours:4}]);assert.equal(api.parseAssignment('URLOP').status,'URLOP');assert.equal(api.parseAssignment('SCALANIE (5h) SPR (3h)').items.length,2);assert.equal(api.parseAssignment('VAS (3,5h)').items[0].hours,3.5);});
test('separate today and history, no double-counting extra source',()=>{const m=api.extract(workbook,fakeXlsx);assert.equal(m.intervals.length,2);assert.equal(m.intervals[0].people.length,2);assert.equal(m.intervals[1].people.length,1);assert.equal(m.history.length,4);assert.equal(m.statuses.length,2);assert.equal(api.analyze(m.history).hours,16);assert.equal(api.analyze(m.history,{sourceType:'other'}).hours,8);assert.equal(api.analyze(m.history,{employee:'P001'}).hours,8);assert.equal(api.analyze(m.history,{process:'NADWE'}).hours,4);});
test('reports duplicate time slots instead of merging data silently',()=>{const w={SheetNames:['STAN'],Sheets:{STAN:{rows:[['PD','08:00 - 09:00','08:00 - 09:00'],['P001','AUDYT','VAS']]}}};const m=api.extract(w,fakeXlsx);assert.equal(m.intervals.length,2);assert.ok(m.issues[0].includes('Powtórzony'));});
test('does not create history from blank future months',()=>{const w={SheetNames:['STAN','Grudzień'],Sheets:{STAN:{rows:[['PD','09:00 - 10:00']]},Grudzień:{rows:[['PD',46357],['P001','']]}}};const m=api.extract(w,fakeXlsx);assert.equal(m.history.length,0);});
