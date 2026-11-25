/* Employee profile / Procesy: read-only display of local Obsada hourly assignments. */
(function(root){
'use strict';
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const midnight=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return NaN;const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d).getTime();return dateKey(new Date(t))===iso?t:NaN;};
const clock=t=>{const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const normalized=s=>String(s??'').replace(/\s+/g,'').toUpperCase();
function loginIdentity(value){
 const code=normalized(value),match=/^(PD|PM|SPM)0*(\d+)$/.exec(code);
 return match ? match[1]+String(Number(match[2])) : code;
}
function aliases(id,brand,originalLogin){
 const ids=new Set();
 const add=value=>{const raw=normalized(value);if(raw){ids.add(raw);ids.add(loginIdentity(raw));}};
 add(id);add(originalLogin);
 // PM/SPM are MOHITO aliases for the same underlying PD number.
 // Keep the SINSAY PD namespace isolated from MOHITO.
 if(brand==='MOHITO')for(const value of [...ids]){
  const match=/^(?:PM|SPM|PD)0*(\d+)$/.exec(value);
  if(match){const number=String(Number(match[1]));add('PM'+number);add('SPM'+number);add('PD'+number);}
 }
 return ids;
}
function create(records,ids,makeSlots,now=Date.now()){
 if(!Array.isArray(records)||typeof makeSlots!=='function')return [];
 const allowed=ids instanceof Set?ids:new Set(ids||[]);
 const hours=[];const unique=new Set();
 for(const row of records){
  if(!allowed.has(normalized(row?.login))&&!allowed.has(loginIdentity(row?.login))||!row.process)continue;
  const slots=makeSlots(row.day,row.shift);const slot=slots?.[Number(row.slot)];
  if(!slot||!Number.isFinite(slot.start)||!Number.isFinite(slot.end)||slot.end<=slot.start)continue;
  const id=[row.day,row.shift,row.slot,normalized(row.login),row.process].join('|');
  if(unique.has(id))continue;unique.add(id);
  hours.push({start:slot.start,end:slot.end,process:String(row.process),shift:String(row.shift),day:row.day});
 }
 hours.sort((a,b)=>a.start-b.start||a.end-b.end||a.process.localeCompare(b.process));
 // Adjacent hours with the same process and shift are one interval.
 const intervals=[];
 for(const item of hours){const prev=intervals[intervals.length-1];if(prev&&prev.end===item.start&&prev.process===item.process&&prev.shift===item.shift&&prev.day===item.day){prev.end=item.end;}else intervals.push({...item});}
 return intervals.map(x=>({...x,status:x.end<=now?'elapsed':x.start<=now?'current':'planned',from:clock(x.start),to:clock(x.end)}));
}
// The workday belongs to the shift START date. Night hours after midnight
// remain attached to their originating day, without changing saved records.
function forDate(intervals,day,now=Date.now()){
 if(!Number.isFinite(midnight(day)))return [];
 return (intervals||[]).filter(x=>x.day===day).map(x=>({
  ...x,status:x.end<=now?'elapsed':x.start<=now?'current':'planned'
 }));
}
function calendarProcesses(intervals,year,month,days){
 const result=new Map();
 const prefix=`${year}-${pad(month)}-`;
 for(const item of intervals||[]){
  if(!item.day?.startsWith(prefix))continue;
  const d=Number(item.day.slice(8));
  if(!Number.isInteger(d)||d<1||d>days)continue;
  if(!result.has(item.day))result.set(item.day,[]);
  const names=result.get(item.day);
  if(!names.includes(item.process))names.push(item.process);
 }
 return result;
}
function around(intervals,now=Date.now()){
 const a=(intervals||[]),previous=a.filter(x=>x.end<=now).at(-1)||null;
 const current=a.find(x=>x.start<=now&&x.end>now)||null;
 const next=a.find(x=>x.start>now)||null;
 return {previous,current,next};
}
root.MREmployeeProcesses={aliases,create,forDate,calendarProcesses,around,dateKey,midnight};
if(typeof module==='object'&&module.exports)module.exports=root.MREmployeeProcesses;
})(typeof window!=='undefined'?window:globalThis);
