/* Mr. Robot Obsada · full XLSX exchange. Pure, deterministic merge planner.
 * No network, no writes: caller previews decisions and creates backup first.
 */
(function(root){
'use strict';
const key=r=>[r.day,r.shift,r.slot,r.login].join('|');
const str=x=>JSON.stringify(x);
const equal=(a,b)=>str(a)===str(b);
const unique=values=>[...new Set(values||[])];
const safeArray=x=>Array.isArray(x)?x:[];
const mapBy=(rows,fn)=>new Map(rows.map(x=>[fn(x),x]));
const hKey=x=>[x.source,x.sourceType||'main',x.date,x.login].join('|');
const sKey=x=>[x.source,x.date,x.login].join('|');
function byGroup(rows,fn){const m=new Map();for(const x of safeArray(rows)){const k=fn(x);if(!m.has(k))m.set(k,[]);m.get(k).push(x);}return m;}
function sortedGroup(g){return g?g.slice().sort((a,b)=>str(a).localeCompare(str(b))):[];}
function tombMap(rows){const m=new Map();for(const t of safeArray(rows)){if(!t||!t.key||!Number.isFinite(Date.parse(t.at)))continue;const prev=m.get(t.key);if(!prev||Date.parse(t.at)>Date.parse(prev.at))m.set(t.key,{key:t.key,at:t.at});}return m;}
function plan(local,remote){
 const conflicts=[];const counts={newAssignments:0,newHistory:0,newStatuses:0,newTeams:0,newTemplates:0,duplicates:0,deletions:0};
 const decisions=[];
 function decision(kind,id,mine,theirs,description){
  const cid=kind+'|'+id;
  conflicts.push({id:cid,kind,label:description||id,mine:str(mine),theirs:str(theirs)});
  decisions.push(cid);return cid;
 }
 const L=mapBy(safeArray(local.records),key), R=mapBy(safeArray(remote.records),key);
 const LT=tombMap(local.tombstones), RT=tombMap(remote.tombstones);
 const rows=[];const tombstones=new Map([...LT,...RT]);
 for(const k of new Set([...L.keys(),...R.keys(),...LT.keys(),...RT.keys()])){
  const a=L.get(k),b=R.get(k),ta=LT.get(k),tb=RT.get(k);
  const td=[ta,tb].filter(Boolean).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
  const record=[a,b].filter(Boolean).sort((a,b)=>Date.parse(b.updated||0)-Date.parse(a.updated||0))[0];
  if(td&&(!record||Date.parse(td.at)>=Date.parse(record.updated||0))){
   counts.deletions++;tombstones.set(k,td);continue;
  }
  if(a&&b){if(a.process===b.process){rows.push(a);counts.duplicates++;}else rows.push({__conflict:decision('assignment',k,a,b,`${a.day} · ${a.login} · ${a.slot}: ${a.process} / ${b.process}`),mine:a,theirs:b});}
  else if(a)rows.push(a);else if(b){rows.push(b);counts.newAssignments++;}
  if(record)tombstones.delete(k);
 }
 function mergeGroups(field,fn,countField){
  const A=byGroup(local[field],fn), B=byGroup(remote[field],fn), output=[];
  for(const k of new Set([...A.keys(),...B.keys()])){
   const a=A.get(k),b=B.get(k);
   if(a&&b){if(equal(sortedGroup(a),sortedGroup(b))){output.push(...a);counts.duplicates+=a.length;}else output.push({__conflict:decision(field,k,a,b,k),mine:a,theirs:b});}
   else if(a)output.push(...a);else {output.push(...b);counts[countField]+=b.length;}
  }
  return output;
 }
 const history=mergeGroups('history',hKey,'newHistory');
 const statuses=mergeGroups('statuses',sKey,'newStatuses');
 function mergeObject(field,countField){const A=local[field]||{},B=remote[field]||{},out={};
  for(const k of new Set([...Object.keys(A),...Object.keys(B)])){
   const a=A[k],b=B[k];
   if(a!==undefined&&b!==undefined){if(equal(a,b)){out[k]=a;counts.duplicates++;}else out[k]={__conflict:decision(field,k,a,b,k),mine:a,theirs:b};}
   else if(a!==undefined)out[k]=a;else{out[k]=b;counts[countField]++;}
  }
  return out;
 }
 const shiftTeams=mergeObject('shiftTeams','newTeams');
 const teamTemplates=mergeObject('teamTemplates','newTemplates');
 // A saved STAN snapshot is a single dated snapshot, not historical data.
 let stan=local.stan||null;
 if(remote.stan&&!stan)stan=remote.stan;
 else if(remote.stan&&stan&&!equal(stan,remote.stan))stan={__conflict:decision('stan','snapshot',stan,remote.stan,'STAN snapshot'),mine:stan,theirs:remote.stan};
 const hiddenProcesses=unique([...safeArray(local.hiddenProcesses),...safeArray(remote.hiddenProcesses)]);
 const excludedHistory=unique([...safeArray(local.excludedHistory),...safeArray(remote.excludedHistory)]);
 const confirmations={...(local.confirmations||{})};for(const [k,v] of Object.entries(remote.confirmations||{}))if(!confirmations[k]||Date.parse(v)>Date.parse(confirmations[k]))confirmations[k]=v;
 const draft={records:rows,history,statuses,shiftTeams,teamTemplates,stan,hiddenProcesses,excludedHistory,confirmations,tombstones:[...tombstones.values()]};
 function apply(choices={}){
  function resolve(x){if(Array.isArray(x))return x.flatMap(y=>{const v=resolve(y);return Array.isArray(v)?v:[v];});if(!x||typeof x!=='object')return x;if(x.__conflict)return resolve(choices[x.__conflict]==='theirs'?x.theirs:x.mine);return x;}
  const out={...draft};for(const k of ['records','history','statuses','shiftTeams','teamTemplates','stan']){
   const v=draft[k];if(Array.isArray(v))out[k]=resolve(v);else if(v&&typeof v==='object'&&!v.__conflict)out[k]=Object.fromEntries(Object.entries(v).map(([a,b])=>[a,resolve(b)]));else out[k]=resolve(v);
  }
  out.records=out.records.filter(Boolean);
  return out;
 }
 return {conflicts,counts,apply};
}
const api={plan,key};root.MRObsadaMerge=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
