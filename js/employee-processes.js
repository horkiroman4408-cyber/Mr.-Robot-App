/* Employee profile / Procesy: read-only display of local Obsada hourly assignments. */
(function(root){
'use strict';
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const midnight=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return NaN;const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d).getTime();return dateKey(new Date(t))===iso?t:NaN;};
const clock=t=>{const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const normalized=s=>String(s||'').replace(/\s+/g,'').toUpperCase();
function aliases(id,brand,originalLogin){
 const ids=new Set([normalized(id),normalized(originalLogin)].filter(Boolean));
 // PM/SPM is the public MOHITO alias of its underlying PD login.
 // Never rewrite a SINSAY PD login into a MOHITO one.
 if(brand==='MOHITO')for(const value of [...ids]){
  const match=/^(?:PM|SPM)(\d+)$/.exec(value);
  if(match){ids.add('PM'+match[1]);ids.add('SPM'+match[1]);ids.add('PD'+match[1]);}
 }
 return ids;
}
function create(records,ids,makeSlots,now=Date.now()){
 if(!Array.isArray(records)||typeof makeSlots!=='function')return [];
 const allowed=ids instanceof Set?ids:new Set(ids||[]);
 const hours=[];const unique=new Set();
 for(const row of records){
  if(!allowed.has(normalized(row?.login))||!row.process)continue;
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
function forDate(intervals,day,now=Date.now()){
 const start=midnight(day);if(!Number.isFinite(start))return [];
 const end=new Date(start);end.setDate(end.getDate()+1);const finish=end.getTime();
 return (intervals||[]).filter(x=>x.start<finish&&x.end>start).map(x=>{
  const from=Math.max(start,x.start),to=Math.min(finish,x.end);
  return {...x,start:from,end:to,from:clock(from),to:to===finish?'24:00':clock(to),status:to<=now?'elapsed':from<=now?'current':'planned',fromPreviousDay:x.start<start};
 });
}
function around(intervals,now=Date.now()){
 const a=(intervals||[]),previous=a.filter(x=>x.end<=now).at(-1)||null;
 const current=a.find(x=>x.start<=now&&x.end>now)||null;
 const next=a.find(x=>x.start>now)||null;
 return {previous,current,next};
}
root.MREmployeeProcesses={aliases,create,forDate,around,dateKey,midnight};
if(typeof module==='object'&&module.exports)module.exports=root.MREmployeeProcesses;
})(typeof window!=='undefined'?window:globalThis);
