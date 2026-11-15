/* Mr. Robot · Obsada: one effective local history, retaining imported evidence.
 * Pure calculations: no filesystem, no browser storage and no time inference from monthly totals.
 */
(function(root){
'use strict';
const key=(date,login)=>String(date)+'|'+String(login);
const round=n=>Math.round(n*1000)/1000;
const proc=p=>String(p||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleUpperCase('pl-PL');
function resolve({history=[],statuses=[],records=[],now=Date.now(),isConfirmed,isExcluded,makeSlots}){
 const active=new Map(),localTotals=new Map(),localProcesses=new Map(),lastShiftEnd=new Map();
 const planned=[];
 for(const r of records){
  const k=key(r.day,r.login),confirmed=!!isConfirmed(r,now),p=proc(r.process);
  const group=[r.day,r.shift,r.login,r.process,confirmed?'done':'future'].join('|');
  let agg=active.get(group);
  if(!agg){agg={date:r.day,shift:r.shift,login:r.login,process:r.process,hours:0,origin:'plan',kind:confirmed?'confirmed':'plan',source:'Planowanie',sourceType:'plan',confirmed};active.set(group,agg);}
  agg.hours+=1;
  if(confirmed){
   localTotals.set(k,(localTotals.get(k)||0)+1);
   const pm=localProcesses.get(k)||new Map();pm.set(p,(pm.get(p)||0)+1);localProcesses.set(k,pm);
  }
  if(typeof makeSlots==='function'){
   const slots=makeSlots(r.day,r.shift);const end=slots[slots.length-1]?.end;
   if(Number.isFinite(end))lastShiftEnd.set(k,Math.max(lastShiftEnd.get(k)||0,end));
  }
 }
 const onlineTotals=new Map(),onlineProcesses=new Map();
 const imported=history.map(r=>{
  const k=key(r.date,r.login),excluded=!!isExcluded({...r,kind:'work'}),hours=Number(r.hours)||0;
  if(!excluded){
   onlineTotals.set(k,(onlineTotals.get(k)||0)+hours);
   const pm=onlineProcesses.get(k)||new Map(),p=proc(r.process);
   pm.set(p,(pm.get(p)||0)+hours);onlineProcesses.set(k,pm);
  }
  return {...r,origin:'import',kind:'work',sourceType:r.sourceType||'main',superseded:localTotals.has(k),excluded};
 });
 const resolvedStatuses=statuses.map(r=>({...r,process:r.status,hours:0,sourceType:'status',origin:'import',kind:'status',excluded:!!isExcluded({...r,kind:'status'})}));
 const discrepancies=[];
 for(const [k,online] of onlineTotals){
  if(!localTotals.has(k))continue;
  const local=localTotals.get(k),a=onlineProcesses.get(k)||new Map(),b=localProcesses.get(k)||new Map();
  const processDifferent=[...new Set([...a.keys(),...b.keys()])].some(p=>Math.abs((a.get(p)||0)-(b.get(p)||0))>0.001);
  if(Math.abs(online-local)<=0.001&&!processDifferent)continue;
  const at=k.indexOf('|');
  discrepancies.push({date:k.slice(0,at),login:k.slice(at+1),imported:round(online),local:round(local),difference:round(online-local),processDifferent,pending:now<(lastShiftEnd.get(k)||0)});
 }
 discrepancies.sort((a,b)=>b.date.localeCompare(a.date)||a.login.localeCompare(b.login));
 return {rows:[...imported,...resolvedStatuses,...active.values()],discrepancies};
}
const api={resolve};root.MRObsadaUnifiedHistory=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
