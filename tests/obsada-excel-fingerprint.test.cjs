'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=require('path').resolve(__dirname,'..');
const ctx={console,setTimeout,clearTimeout,Uint8Array,ArrayBuffer,Date};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/xlsx.js'),'utf8'),ctx,{timeout:10000});
let src=fs.readFileSync(path.join(root,'js/obsada-planner.js'),'utf8');
src=src.replace(' const legacyFingerprint=records=>',' root.__test={fingerprint,persistedFingerprint}; const legacyFingerprint=records=>');
vm.runInNewContext(src,ctx,{timeout:10000});
const X=ctx.XLSX,P=ctx.MRObsadaPlanner;
P.create({reactive:x=>x,computed:f=>({get value(){return f();}}),roster:()=>[],source:()=>null});
P.fingerprint=ctx.__test.fingerprint;P.persistedFingerprint=ctx.__test.persistedFingerprint;
const day='2026-11-14';
const records=P.applyAssignment([],{day,shift:'18-06',from:0,to:3,login:'PD009361',process:'AUDYT'});
const history=[{date:'2026-11-12',login:'PD009361',process:'METKI',hours:8,source:'Listopad',sourceType:'main',raw:'METKI (8h)'}];
const statuses=[{date:'2026-11-13',login:'PD009361',status:'URLOP',source:'Listopad'}];
const teams={[day+'|18-06']:['PD009361']};
const stan={updatedAt:'2026-11-15T00:13:21.000Z',day,shift:'18-06',intervals:[
 {label:'18:00–19:00',people:[{login:'PD009361',process:'AUDYT'}]},
 {label:'19:00–20:00',people:[]},
 {label:'20:00–21:00',people:[]}
]};
const book=P.buildWorkbook(X,records,history,statuses,teams,stan);
const disk=P.readDatabase(X,X.read(X.write(book,{type:'array',bookType:'xlsx'}),{type:'array',cellDates:false}));
const diskRaw=P.fingerprint(disk.records,disk.history,disk.statuses,disk.shiftTeams,disk.stan);
const localRaw=P.fingerprint(records,history,statuses,teams,stan);
assert.notEqual(diskRaw,localRaw,'reproduce false conflict from empty STAN hours');
const localPersisted=P.persistedFingerprint(X,records,history,statuses,teams,stan);
assert.equal(diskRaw,localPersisted,'identical logical Excel must be recognized');
assert.equal(disk.stan.day,day);assert.equal(disk.stan.shift,'18-06');
assert.equal(disk.history.length,1);assert.equal(disk.records.length,3);
const changed=P.applyAssignment(records,{day,shift:'18-06',from:0,to:1,login:'PD009361',process:'METKI'});
assert.notEqual(diskRaw,P.persistedFingerprint(X,changed,history,statuses,teams,stan),'real assignment change must be detected');
const external=[...records,{day,shift:'18-06',slot:4,login:'PD007116',process:'AUDYT GEEK'}];
assert.notEqual(diskRaw,P.persistedFingerprint(X,external,history,statuses,teams,stan),'real external change must be detected');
console.log('PASS false conflict STAN empty intervals, XLSX roundtrip, genuine changes');
