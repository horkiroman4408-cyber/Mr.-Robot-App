/* Employee profile / Procesy: safe read-only view of local Obsada assignments. */
(function(root){
'use strict';
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const midnight=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return NaN;const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d).getTime();return dateKey(new Date(t))===iso?t:NaN;};
const clock=t=>{const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const normalized=s=>String(s??'').replace(/\s+/g,'').toUpperCase();
const loginIdentity=s=>{const code=normalized(s),m=/^(PD|PM|SPM)0*(\d+)$/.exec(code);return m?m[1]+String(Number(m[2])):code;};
function aliases(id,brand,originalLogin){
 const ids=new Set();
 const add=x=>{const n=normalized(x);if(n){ids.add(n);ids.add(loginIdentity(n));}};
 add(id);add(originalLogin);
 // MOHITO PM and SPM can reference the underlying PD number.
 if(brand==='MOHITO')for(const value of [...ids]){
  const m=/^(?:PM|SPM|PD)0*(\d+)$/.exec(value);
  if(m){const n=String(Number(m[1]));add('PM'+n);add('SPM'+n);add('PD'+n);}
 }
 return ids;
}
function create(records,ids,makeSlots,now=Date.now()){
 if(!Array.isArray(records)||typeof makeSlots!=='function')return [];
 const allowed=ids instanceof Set?ids:new Set(ids||[]), hours=[], unique=new Set();
 for(const row of records){
  if(!row||!row.process||!allowed.has(normalized(row.login))&&!allowed.has(loginIdentity(row.login)))continue;
  const slots=makeSlots(row.day,row.shift), slot=slots?.[Number(row.slot)];
  if(!slot||!Number.isFinite(slot.start)||!Number.isFinite(slot.end)||slot.end<=slot.start)continue;
  const id=[row.day,row.shift,row.slot,normalized(row.login),row.process].join('|');
  if(unique.has(id))continue;unique.add(id);
  hours.push({start:slot.start,end:slot.end,process:String(row.process),shift:String(row.shift),day:row.day});
 }
 hours.sort((a,b)=>a.start-b.start||a.end-b.end||a.process.localeCompare(b.process));
 const intervals=[];
 for(const item of hours){
  const prev=intervals[intervals.length-1];
  if(prev&&prev.end===item.start&&prev.process===item.process&&prev.shift===item.shift&&prev.day===item.day)prev.end=item.end;
  else intervals.push({...item});
 }
 return intervals.map(x=>({...x,status:x.end<=now?'elapsed':x.start<=now?'current':'planned',from:clock(x.start),to:clock(x.end)}));
}
function forDate(intervals,day,now=Date.now()){
 if(!Number.isFinite(midnight(day)))return [];
 return (intervals||[]).filter(x=>x.day===day).map(x=>({...x,status:x.end<=now?'elapsed':x.start<=now?'current':'planned'}));
}
function calendarProcesses(intervals,year,month,days){
 const result=new Map(),prefix=`${year}-${pad(month)}-`;
 for(const item of intervals||[]){
  if(!item.day?.startsWith(prefix))continue;
  const d=Number(item.day.slice(8));
  if(!Number.isInteger(d)||d<1||d>days)continue;
  if(!result.has(item.day))result.set(item.day,[]);
  const names=result.get(item.day);if(!names.includes(item.process))names.push(item.process);
 }
 return result;
}
function around(intervals,now=Date.now()){
 const a=intervals||[];
 return {previous:a.filter(x=>x.end<=now).at(-1)||null,current:a.find(x=>x.start<=now&&x.end>now)||null,next:a.find(x=>x.start>now)||null};
}
/* DOM template repair: runs before app.js mounts Vue. Does not mutate Obsada data. */
function repairEmployeeProfileTemplate(){
 if(!root.document)return;
 const sections=[...root.document.querySelectorAll('section.employee-process-section')];
 const full=sections.find(el=>el.querySelector('.employee-process-heading'));
 const fallback=sections.find(el=>el!==full&&el.getAttribute('role')==='status');
 if(full){
  // Previously this section depended on computed values and could fall into a stale fallback.
  full.setAttribute('v-else-if',"employeeProfileTab==='processes'");
  if(fallback&&fallback.previousElementSibling===full)fallback.remove();
 }
 const calendar=root.document.querySelector('.employee-calendar-grid');
 if(calendar){
  const day=calendar.querySelector('[v-for="day in employeeSchedule.days"]');
  if(day){
   const expression="employeeProcessGoDay(`${employeeSchedule.year}-${String(employeeSchedule.month+1).padStart(2,'0')}-${String(day.day).padStart(2,'0')}`)";
   day.setAttribute('@click',expression);
   day.querySelectorAll('.employee-process-calendar-chip').forEach(chip=>chip.setAttribute('@click.stop',expression));
  }
 }
}
try{repairEmployeeProfileTemplate();}catch(error){root.console?.warn?.('Mr. Robot: employee profile template repair failed',error);}
root.MREmployeeProcesses={aliases,create,forDate,calendarProcesses,around,dateKey,midnight};
if(typeof module==='object'&&module.exports)module.exports=root.MREmployeeProcesses;
})(typeof window!=='undefined'?window:globalThis);
