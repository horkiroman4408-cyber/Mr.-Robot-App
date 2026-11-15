/* Obsada Intelligence: reusable, read-only team comparison from already reconciled history. */
(function(root){
'use strict';
const today=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function shiftDay(iso,n){const [y,m,d]=iso.split('-').map(Number);const dt=new Date(y,m-1,d+n,12);return today(dt);}
function summarize(rows,selected,from,to,referenceDay=today()){
 const employees=[...new Set(selected)].filter(Boolean), names=new Set(employees);
 const dayBefore=shiftDay(referenceDay,-1),twoBefore=shiftDay(referenceDay,-2);
 const kept=rows.filter(r=>names.has(r.login)&&r.date>=from&&r.date<=to&&!r.excluded&&!r.superseded&&(r.kind==='work'||r.kind==='confirmed')&&Number(r.hours)>0);
 const cards=employees.map(login=>{
  const all=kept.filter(r=>r.login===login),byProcess=new Map(),byDay=new Map();
  for(const r of all){const hrs=Number(r.hours),name=String(r.process||'').trim();if(!name)continue;byProcess.set(name,(byProcess.get(name)||0)+hrs);const key=r.date+'|'+name;byDay.set(key,(byDay.get(key)||0)+hrs);}
  const processes=[...byProcess].map(([process,hours])=>({process,hours,lastDate:all.filter(r=>r.process===process).map(r=>r.date).sort().at(-1)||''})).sort((a,b)=>b.hours-a.hours||a.process.localeCompare(b.process));
  function forDate(day){return [...byDay].filter(([k])=>k.startsWith(day+'|')).map(([k,hours])=>({process:k.slice(day.length+1),hours})).sort((a,b)=>b.hours-a.hours||a.process.localeCompare(b.process));}
  return {login,hours:processes.reduce((n,r)=>n+r.hours,0),processes,days:new Set(all.map(r=>r.date)).size,yesterday:forDate(dayBefore),dayBeforeYesterday:forDate(twoBefore)};
 });
 const procMap=new Map();for(const card of cards)for(const v of card.processes)procMap.set(v.process,(procMap.get(v.process)||0)+v.hours);
 return {cards,processes:[...procMap].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(x=>x[0]),from,to,yesterday:dayBefore,dayBeforeYesterday:twoBefore};
}
const API={today,shiftDay,summarize};root.MRObsadaTeamIntelligence=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
