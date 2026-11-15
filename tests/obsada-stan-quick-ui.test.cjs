const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const planner=require('../js/obsada-planner.js');
const old=global.setInterval;global.setInterval=()=>0;
let p;try{p=planner.create({reactive:x=>x,computed:fn=>({get value(){return fn();}}),roster:()=>[],source:()=>({intervals:[],history:[]}),sourceName:()=>'',language:()=> 'ru'});}finally{global.setInterval=old;}
p.state.stanChanges=[{id:'1',past:true,choice:'mine'},{id:'2',past:false,choice:'mine'},{id:'3',past:false,choice:'stan'}];
p.selectStanReview('future');assert.deepEqual(p.state.stanChanges.map(x=>x.choice),['mine','stan','stan']);assert.equal(p.stanSelectedCount.value,2);
p.selectStanReview('none');assert.equal(p.stanSelectedCount.value,0);
p.state.processFilter='AUDYT';assert.equal(p.processFilterExisting.value,'');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
assert(html.includes('obs-plan-unified-process'));
assert(!html.includes('class="obs-plan-add"'));
assert(html.includes('obsadaPlan.selectStanReview(\'future\')'));
assert(html.includes('row.choice=$event.target.checked'));
assert(!html.includes('v-model="row.choice"'));
console.log('PASS: STAN quick selection, no automatic past changes, one process field');
