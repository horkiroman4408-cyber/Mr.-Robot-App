const assert=require('node:assert/strict');
const {test}=require('node:test');
const planner=require('../js/obsada-planner.js');
const computed=fn=>({get value(){return fn()}});
const app=planner.create({reactive:x=>x,computed,roster:()=>[],source:()=>({employees:[],intervals:[]}),sourceName:()=>'',language:()=> 'ru'});
const date='2026-11-19';
app.state.printDay=date;
app.state.shiftTeams={[`${date}|14-22`]:['P001','P002'],[`${date}|18-06`]:['P003']};
app.state.teamTemplates={LPP:['P001','P002'],Agencja:['P003']};
const make=(shift,login,process,slots)=>slots.map(slot=>({day:date,shift,login,slot,process}));
app.state.records=[...make('14-22','P001','AUDYT',[0,1,2]),...make('14-22','P001','PICK',[3,4,5,6,7]),...make('18-06','P003','METKI',[0,1,2,3,4,5,6,7,8,9,10,11])];
test('two distinct teams with missing assignment and separate process intervals',()=>{
 const p=app.tomorrowPlan.value;
 assert.equal(p.teams.length,2);assert.equal(p.total,3);
 assert.equal(p.missing,1);
 const lpp=p.teams.find(x=>x.name==='LPP');
 assert.equal(lpp.people[0].parts.length,2);
 assert.deepEqual(lpp.people[0].parts.map(x=>[x.key,x.from,x.to]),[['AUDYT','14:00','17:00'],['PICK','17:00','22:00']]);
 assert.equal(lpp.people[1].unassigned,true);
 const night=p.teams.find(x=>x.name==='Agencja');
 assert.equal(night.people[0].parts[0].to,'06:00');
});
test('early departure is excluded from work and optionally listed',()=>{
 app.state.importedStatuses=[{date,login:'P003',source:'Planowanie',status:'WCZESNIEJSZE_WYJSCIE@21:00'}];
 const p=app.tomorrowPlan.value;
 const worker=p.teams.find(x=>x.name==='Agencja').people[0];
 assert.deepEqual(worker.parts.map(x=>[x.from,x.to]),[['18:00','21:00']]);
 assert.equal(worker.absences[0].from,'21:00');
});
test('print escapes worker names/processes and opens printable document without mutations',()=>{
 let html='';const prior=JSON.stringify(app.state.records);
 const old=global.open;global.open=()=>({document:{open(){},write(x){html=x},close(){}},focus(){}});
 try{assert.equal(app.printTomorrowPlan(),true);assert.match(html,/A4 landscape/);assert.match(html,/P001/);assert.match(html,/PICK/);assert.match(html,/21:00/);assert.equal(JSON.stringify(app.state.records),prior);}finally{global.open=old;}
});
