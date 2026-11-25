/* Mr. Robot · Obsada | standalone XLSX analysis, no network calls */
(function(root){
'use strict';
const MONTHS=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
function normalize(v){return String(v==null?'':v).trim();}
function parseInterval(v){const m=normalize(v).match(/^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/);if(!m)return null;let a=+m[1]*60 + +m[2], b=+m[3]*60 + +m[4];if(+m[1]>23||+m[3]>23||+m[2]>59||+m[4]>59||a===b)return null;return {start:a,end:b,label:normalize(v)};}
function inInterval(interval,date){const minutes=date.getHours()*60+date.getMinutes();return interval.start<interval.end?minutes>=interval.start&&minutes<interval.end:minutes>=interval.start||minutes<interval.end;}
function parseAssignment(value){let raw=normalize(value);if(!raw)return {items:[],status:'empty',raw};if(/^(WOLNY|URLOP|L4|NN|NUN|CHOROBOWE|ZWOLNIENIE)$/i.test(raw))return {items:[],status:raw.toUpperCase(),raw};let found=[],rx=/([^()]+?)\s*\(\s*(\d+(?:[.,]\d+)?)\s*h\s*\)/gi,m;while((m=rx.exec(raw))!==null){const name=m[1].replace(/^[\s/;,|+]+|[\s/;,|+]+$/g,'').trim().toUpperCase(),hours=Number(m[2].replace(',','.'));if(name&&hours>0&&hours<=24)found.push({process:name,hours});}return {items:found,status:found.length?'work':'unrecognized',raw};}
function serialDate(value,XLSX){if(value instanceof Date&&!Number.isNaN(value.getTime()))return value.toISOString().slice(0,10);if(typeof value==='number'){const d=XLSX.SSF.parse_date_code(value);if(d&&d.y>=2020&&d.y<=2100)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}if(typeof value==='string'&&/^\d{4}-\d\d-\d\d$/.test(value))return value;return null;}
function extract(wb,XLSX){
 if(!wb.Sheets.STAN)throw Error('Brak arkusza STAN');
 const issues=[];
 const grid=XLSX.utils.sheet_to_json(wb.Sheets.STAN,{header:1,raw:true,defval:''});
 const head=grid[0]||[],intervals=[],labels=new Map();
 for(let c=1;c<head.length;c++){
  const iv=parseInterval(head[c]);if(!iv)continue;
  Object.assign(iv,{col:c,key:String(c),people:[],summary:{},officialSummary:{},officialTotal:null});intervals.push(iv);
  const k=iv.start+'-'+iv.end;
  if(labels.has(k))issues.push(`Powtórzony przedział ${iv.label} (kolumny ${labels.get(k)+1}, ${c+1})`);
  else labels.set(k,c);
 }
 if(!intervals.length)issues.push('Nie znaleziono nagłówków godzinowych STAN');
 // STAN has two different tables: assignments (top) and per-process numeric
 // totals (bottom). Numeric cells in the latter are NOT employee processes.
 // SUMA marks the bottom table; find its first numeric summary row by scanning
 // backwards through the contiguous process-count section.
 const isCountRow=row=>{
  const label=normalize(row?.[0]);
  if(!label||/^SUMA\s*:?$/i.test(label))return false;
  return intervals.some(iv=>{const v=row[iv.col];return typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&/^\d+(?:[.,]\d+)?$/.test(v.trim());});
 };
 const sumaIndex=grid.findIndex((row,i)=>i>1&&/^SUMA\s*:?$/i.test(normalize(row?.[0])));
 let summaryStart=grid.length;
 if(sumaIndex>=0){summaryStart=sumaIndex;while(summaryStart>1){
   if(isCountRow(grid[summaryStart-1]))summaryStart--;
   else if(!normalize(grid[summaryStart-1]?.[0])&&summaryStart>2&&isCountRow(grid[summaryStart-2]))summaryStart--;
   else break;
  }
  for(let r=summaryStart;r<sumaIndex;r++){
   const row=grid[r]||[],name=normalize(row[0]).toUpperCase();if(!name||!isCountRow(row))continue;
   for(const iv of intervals){const raw=row[iv.col];if(raw===''||raw==null)continue;const count=Number(String(raw).replace(',','.'));if(Number.isFinite(count)&&count>=0)iv.officialSummary[name]=count;}
  }
  for(const iv of intervals){const count=Number(String(grid[sumaIndex]?.[iv.col]??'').replace(',','.'));if(Number.isFinite(count))iv.officialTotal=count;}
 }
 const employees=new Set();
 for(let r=1;r<summaryStart;r++){
  const row=grid[r]||[],login=normalize(row[0]);if(!login)continue;
  for(const iv of intervals){
   const raw=row[iv.col],process=normalize(raw);
   // No numeric cells and no formulas yielding counts may become process names.
   if(!process||typeof raw==='number'||/^\d+(?:[.,]\d+)?$/.test(process))continue;
   iv.people.push({login,process});employees.add(login);
   iv.summary[process]=(iv.summary[process]||0)+1;
  }
 }
 const history=[],statuses=[],unexpected=[];
 for(const name of wb.SheetNames){
  if(!MONTHS.includes(name)&&!/^Inne\s+\d{2}$/i.test(name))continue;
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:true,defval:''});
  const dates=rows[0]||[],matched=[];
  for(let c=1;c<dates.length;c++){const date=serialDate(dates[c],XLSX);if(date)matched.push({col:c,date});}
  for(let r=1;r<rows.length;r++){
   const row=rows[r]||[],login=normalize(row[0]);if(!login||! /^[\w-]{3,}$/.test(login))continue;
   for(const {col,date} of matched){
    const entry=parseAssignment(row[col]);if(!entry.raw)continue;
    if(entry.status==='work')for(const item of entry.items)history.push({login,date,month:name,process:item.process,hours:item.hours,raw:entry.raw,source:name,sourceType:/^Inne\s+\d{2}$/i.test(name)?'other':'main'});
    else if(entry.status==='unrecognized')unexpected.push({login,date,source:name,raw:entry.raw});
    else statuses.push({login,date,status:entry.status,source:name});
   }
  }
 }
 if(unexpected.length)issues.push(`${unexpected.length} wpisów historii o nierozpoznanym formacie`);
 return {intervals,history,statuses,unexpected,issues,employees:[...employees].sort(),sheetNames:wb.SheetNames};
}
function analyze(history,{employee='',month='',process='',sourceType='main'}={}){const arr=history.filter(x=>(!sourceType||x.sourceType===sourceType)&&(!employee||x.login===employee)&&(!month||x.date.slice(0,7)===month)&&(!process||x.process===process));const hoursByProcess={},hoursByEmployee={},days=new Set();let hours=0;for(const x of arr){hours+=x.hours;hoursByProcess[x.process]=(hoursByProcess[x.process]||0)+x.hours;hoursByEmployee[x.login]=(hoursByEmployee[x.login]||0)+x.hours;days.add(x.login+'|'+x.date);}return {entries:arr.length,hours:Math.round(hours*100)/100,workerDays:days.size,processes:Object.entries(hoursByProcess).sort((a,b)=>b[1]-a[1]),employees:Object.entries(hoursByEmployee).sort((a,b)=>b[1]-a[1]),rows:arr};}
const API={MONTHS,parseInterval,inInterval,parseAssignment,extract,analyze};if(typeof module==='object'&&module.exports)module.exports=API;root.ObsadaParser=API;

})(typeof globalThis!=='undefined'?globalThis:this);
