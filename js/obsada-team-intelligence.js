/* Obsada Intelligence: reusable, read-only team comparison from already reconciled history. */
(function(root){
'use strict';
const today=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function shiftDay(iso,n){const [y,m,d]=iso.split('-').map(Number);const dt=new Date(y,m-1,d+n,12);return today(dt);}
function calendarRange(mode,offset=0,referenceDay=today()){
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(referenceDay);
 if(!m||!['week','month'].includes(mode)||!Number.isInteger(offset))return null;
 const date=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12);
 if(mode==='week'){
  const monday=(date.getDay()+6)%7;
  date.setDate(date.getDate()-monday+offset*7);
  const from=today(date);date.setDate(date.getDate()+6);
  return {from,to:today(date)};
 }
 const first=new Date(date.getFullYear(),date.getMonth()+offset,1,12);
 const last=new Date(first.getFullYear(),first.getMonth()+1,0,12);
 return {from:today(first),to:today(last)};
}
function summarize(rows,selected,from,to,referenceDay=today()){
 const employees=[...new Set(selected)].filter(Boolean), names=new Set(employees);
 const dayBefore=shiftDay(referenceDay,-1),twoBefore=shiftDay(referenceDay,-2);
 const valid=rows.filter(r=>names.has(r.login)&&!r.excluded&&!r.superseded&&(r.kind==='work'||r.kind==='confirmed')&&Number(r.hours)>0);
 const kept=valid.filter(r=>r.date>=from&&r.date<=to);
 // Monthly workbook day statuses (WOLNY, URLOP, L4...) are informational,
 // not hours. Keep them available even outside the chosen analysis range.
 const dayStatuses=rows.filter(r=>names.has(r.login)&&r.kind==='status'&&!r.excluded&&
  (r.date===dayBefore||r.date===twoBefore)&&String(r.status||r.process||'').trim());
 const cards=employees.map(login=>{
  const all=kept.filter(r=>r.login===login),byProcess=new Map(),byDay=new Map();
  for(const r of all){const hrs=Number(r.hours),name=String(r.process||'').trim();if(!name)continue;byProcess.set(name,(byProcess.get(name)||0)+hrs);const key=r.date+'|'+name;byDay.set(key,(byDay.get(key)||0)+hrs);}
  // Recent-day context is always relative to today, even when an older period is selected.
  for(const r of valid){if(r.login!==login||(r.date!==dayBefore&&r.date!==twoBefore))continue;const key=r.date+'|'+String(r.process||'').trim();if(!r.process)continue;if(!all.includes(r))byDay.set(key,(byDay.get(key)||0)+Number(r.hours));}
  const processes=[...byProcess].map(([process,hours])=>({process,hours,lastDate:all.filter(r=>r.process===process).map(r=>r.date).sort().at(-1)||''})).sort((a,b)=>b.hours-a.hours||a.process.localeCompare(b.process));
  function forDate(day){return [...byDay].filter(([k])=>k.startsWith(day+'|')).map(([k,hours])=>({process:k.slice(day.length+1),hours})).sort((a,b)=>b.hours-a.hours||a.process.localeCompare(b.process));}
  const statusOn=day=>[...new Set(dayStatuses.filter(r=>r.login===login&&r.date===day).map(r=>String(r.status||r.process).trim().toUpperCase()))];
  return {login,hours:processes.reduce((n,r)=>n+r.hours,0),processes,days:new Set(all.map(r=>r.date)).size,
   yesterday:forDate(dayBefore),dayBeforeYesterday:forDate(twoBefore),
   yesterdayStatuses:statusOn(dayBefore),dayBeforeYesterdayStatuses:statusOn(twoBefore)};
 });
 const procMap=new Map();for(const card of cards)for(const v of card.processes)procMap.set(v.process,(procMap.get(v.process)||0)+v.hours);
 return {cards,processes:[...procMap].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(x=>x[0]),from,to,yesterday:dayBefore,dayBeforeYesterday:twoBefore};
}
const API={today,shiftDay,calendarRange,summarize};root.MRObsadaTeamIntelligence=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
