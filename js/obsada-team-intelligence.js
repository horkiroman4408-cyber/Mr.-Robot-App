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
 const valid=rows.filter(r=>names.has(r.login)&&!r.excluded&&!r.superseded&&(r.kind==='work'||r.kind==='confirmed')&&Number(r.hours)>0);
 const kept=valid.filter(r=>r.date>=from&&r.date<=to);
 // Retain all explicit day statuses for the selected analysis period; never
 // infer a day off from missing records or count duplicated imported rows.
 const dayStatuses=rows.filter(r=>names.has(r.login)&&r.kind==='status'&&!r.excluded&&!r.superseded&&
  String(r.status||r.process||'').trim());
 const statusCategory=value=>{
  const v=String(value||'').trim().normalize('NFKC').toUpperCase();
  if(v==='WOLNY')return 'dayOff';
  if(v==='URLOP')return 'leave';
  if(v==='L4'||v==='CHOROBOWE'||v==='ZWOLNIENIE')return 'sick';
  return '';
 };
 const cards=employees.map(login=>{
  const all=kept.filter(r=>r.login===login),byProcess=new Map();
  for(const r of all){const hrs=Number(r.hours),name=String(r.process||'').trim();if(!name)continue;byProcess.set(name,(byProcess.get(name)||0)+hrs);}
  // Last two dates with counted work, across the whole locally saved history.
  // Neither day-off/leave statuses nor unconfirmed future planning count as shifts.
  // Monthly XLSX supplies a work date but not a precise shift boundary, so
  // one date is the best available unit when grouping historical entries.
  const recentByDay=new Map();
  for(const r of valid){
   if(r.login!==login)continue;
   const date=String(r.date||'');
   const name=String(r.process||'').trim();
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!name)continue;
   if(!recentByDay.has(date))recentByDay.set(date,new Map());
   const processes=recentByDay.get(date);
   processes.set(name,(processes.get(name)||0)+Number(r.hours));
  }
  const lastShifts=[...recentByDay.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,2)
   .map(([date,processes])=>({date,processes:[...processes].map(([process,hours])=>({process,hours}))
    .sort((a,b)=>b.hours-a.hours||a.process.localeCompare(b.process))}));
  const daysByStatus={dayOff:new Set(),leave:new Set(),sick:new Set()};
  for(const r of dayStatuses){
   if(r.login!==login||r.date<from||r.date>to)continue;
   const category=statusCategory(r.status||r.process);
   if(category)daysByStatus[category].add(r.date);
  }
  const processes=[...byProcess].map(([process,hours])=>({process,hours,lastDate:all.filter(r=>r.process===process).map(r=>r.date).sort().at(-1)||''})).sort((a,b)=>b.hours-a.hours||a.process.localeCompare(b.process));
  return {login,hours:processes.reduce((n,r)=>n+r.hours,0),processes,
   days:new Set(all.map(r=>r.date)).size,dayOffDays:daysByStatus.dayOff.size,
   leaveDays:daysByStatus.leave.size,sickDays:daysByStatus.sick.size,lastShifts};
 });
 const procMap=new Map();for(const card of cards)for(const v of card.processes)procMap.set(v.process,(procMap.get(v.process)||0)+v.hours);
 return {cards,processes:[...procMap].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(x=>x[0]),from,to};
}
const API={today,shiftDay,calendarRange,summarize};root.MRObsadaTeamIntelligence=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
