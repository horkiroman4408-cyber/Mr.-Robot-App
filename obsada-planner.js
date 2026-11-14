/* Mr. Robot · Obsada local planning, isolated from source STAN and WMS reports. */
(function(root){
'use strict';
const STORAGE='mrrobot-obsada-plan-v1', FILE='MrRobot_Obsada_Baza.xlsx';
const SHIFT_OPTIONS=[['06-18','06:00','18:00'],['18-06','18:00','06:00'],['06-16','06:00','16:00'],['16-02','16:00','02:00'],['06-14','06:00','14:00'],['14-22','14:00','22:00']];
const norm=x=>String(x||'').trim();
function pad(x){return String(x).padStart(2,'0');}
function localDate(date=new Date()){return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;}
function minutes(hhmm){const a=/^(\d{2}):(\d{2})$/.exec(hhmm||'');return a?Number(a[1])*60+Number(a[2]):NaN;}
function shiftKey(day,code){return `${day}|${code}`;}
function makeSlots(day,code){
 const shift=SHIFT_OPTIONS.find(x=>x[0]===code);if(!shift||!/^\d{4}-\d{2}-\d{2}$/.test(day))return [];
 const start=minutes(shift[1]),end=minutes(shift[2]);const duration=(end-start+1440)%1440;
 const startDate=new Date(day+'T00:00:00');if(!Number.isFinite(startDate.getTime())||!duration)return [];
 const base=startDate.getTime()+start*60000;return Array.from({length:duration/60},(_,i)=>{
  const from=new Date(base+i*3600000),to=new Date(base+(i+1)*3600000);
  const fmt=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {index:i,start:from.getTime(),end:to.getTime(),from:fmt(from),to:fmt(to),label:fmt(from)+'–'+fmt(to)};
 });
}
function db(){return new Promise((res,rej)=>{const r=indexedDB.open(STORAGE,1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function get(key){const d=await db();try{return await new Promise((res,rej)=>{const t=d.transaction('data','readonly');const r=t.objectStore('data').get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}finally{d.close();}}
async function put(key,value){const d=await db();try{await new Promise((res,rej)=>{const t=d.transaction('data','readwrite');t.objectStore('data').put(value,key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);});}finally{d.close();}}
function validRecord(r){return r&&/^\d{4}-\d{2}-\d{2}$/.test(r.day)&&SHIFT_OPTIONS.some(s=>s[0]===r.shift)&&/^\d+$/.test(String(r.slot))&&Number(r.slot)<makeSlots(r.day,r.shift).length&&!!norm(r.login)&&!!norm(r.process);}
function applyAssignment(records,{day,shift,from,to,login,process}){
 const length=makeSlots(day,shift).length;
 if(!norm(login)||!norm(process)||!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<=from||to>length)throw Error('INVALID_ASSIGNMENT');
 const keep=records.filter(r=>!(r.day===day&&r.shift===shift&&r.login===login&&r.slot>=from&&r.slot<to));
 const updated=new Date().toISOString();for(let slot=from;slot<to;slot++)keep.push({day,shift,slot,login,process,updated});
 return keep;
}
function sheetRows(records){const shifts=new Map();for(const r of records){const key=shiftKey(r.day,r.shift);if(!shifts.has(key))shifts.set(key,{day:r.day,shift:r.shift});}return {shifts:[['DATA_ZMIANY','GRAFIK'],...[...shifts.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(x=>[x.day,x.shift])],assignments:[['DATA_ZMIANY','GRAFIK','GODZINA_OD','GODZINA_DO','LOGIN_TH','PROCES','STATUS','ZMIENIONO'],...records.slice().sort((a,b)=>a.day.localeCompare(b.day)||a.shift.localeCompare(b.shift)||a.slot-b.slot||a.login.localeCompare(b.login)).map(r=>{const slot=makeSlots(r.day,r.shift)[r.slot];const format=stamp=>{const d=new Date(stamp);return localDate(d)+' '+pad(d.getHours())+':'+pad(d.getMinutes());};return [r.day,r.shift,format(slot.start),format(slot.end),r.login,r.process,'PLAN',r.updated||''];})]};}
function buildWorkbook(XLSX,records){const wb=XLSX.utils.book_new();const rows=sheetRows(records);for(const [sheet,data] of [['PRZYDZIALY',rows.assignments],['ZMIANY',rows.shifts],['INFO',[['MR_ROBOT_OBSADA_BAZA','1'],['FORMAT','One row per employee per hour. Local planned assignments, not verified worked hours.'],['GENERATED',new Date().toISOString()]]]]){const ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=data[0].map((_,i)=>({wch:i===5?28:20}));XLSX.utils.book_append_sheet(wb,ws,sheet);}return wb;}
function readWorkbook(XLSX,wb){if(!wb.Sheets.PRZYDZIALY)throw Error('NO_LOCAL_ASSIGNMENTS_SHEET');const rows=XLSX.utils.sheet_to_json(wb.Sheets.PRZYDZIALY,{header:1,raw:false,defval:''});if(rows[0]?.slice(0,6).join('|')!==['DATA_ZMIANY','GRAFIK','GODZINA_OD','GODZINA_DO','LOGIN_TH','PROCES'].join('|'))throw Error('INVALID_LOCAL_DATABASE');const records=[];for(const row of rows.slice(1)){if(!norm(row[0]))continue;const day=norm(row[0]),shift=norm(row[1]),from=norm(row[2]),login=norm(row[4]),process=norm(row[5]);const slots=makeSlots(day,shift),slot=slots.find(s=>`${localDate(new Date(s.start))} ${s.from}`===from);const record={day,shift,slot:slot?.index,login,process,updated:norm(row[7])};if(!validRecord(record))throw Error('INVALID_LOCAL_RECORD');records.push(record);}const keys=new Set();for(const r of records){const key=[r.day,r.shift,r.slot,r.login].join('|');if(keys.has(key))throw Error('DUPLICATE_LOCAL_RECORD');keys.add(key);}return records;}
function create({reactive,computed,roster,source}){
 const state=reactive({day:localDate(),shift:'06-18',mode:false,records:[],selectedLogin:'',search:'',newProcess:'',from:0,to:1,folderName:'',busy:false,dirty:false,status:'',error:'',active:false,additionalProcesses:[],historyWindow:'week'});
 let folderHandle=null,writing=false,queued=false,lastExportHash=null;
 const fingerprint=records=>JSON.stringify(records.map(r=>[r.day,r.shift,r.slot,r.login,r.process]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
 const shifts=SHIFT_OPTIONS.map(([value,start,end])=>({value,label:start+'–'+end}));
 const slots=computed(()=>makeSlots(state.day,state.shift));
 const selectedSlot=computed(()=>slots.value[state.from]||slots.value[0]||null);
 const current=computed(()=>state.records.filter(r=>r.day===state.day&&r.shift===state.shift&&r.slot===state.from));
 const initialWorkers=computed(()=>{
  const people=new Set([...(source()?.employees||[]),...(source()?.intervals||[]).flatMap(s=>s.people.map(p=>p.login)),...state.records.map(r=>r.login)]);
  for(const r of roster()||[])if(r.source!=='rezygnacje')people.add(r.id);
  return [...people].filter(Boolean).sort();
 });
 const listedWorkers=computed(()=>initialWorkers.value.filter(s=>!state.search||s.toLowerCase().includes(state.search.toLowerCase())));
 const processes=computed(()=>{
  const set=new Set([...(source()?.intervals||[]).flatMap(s=>s.people.map(p=>p.process)),...(source()?.intervals||[]).flatMap(s=>Object.keys(s.officialSummary||{})),...(source()?.history||[]).map(r=>r.process),...state.records.map(r=>r.process),...state.additionalProcesses]);
  return [...set].map(norm).filter(Boolean).sort((a,b)=>a.localeCompare(b));
 });
 const processCards=computed(()=>processes.value.map(name=>({name,people:current.value.filter(r=>r.process===name)})));
 const unassigned=computed(()=>listedWorkers.value.filter(login=>!current.value.some(r=>r.login===login)));
 const days=computed(()=>[...new Set(state.records.map(r=>r.day))].sort().reverse());
 const historyRows=computed(()=>{const days=state.historyWindow==='week'?7:state.historyWindow==='month'?31:366;const limit=Date.parse(state.day+'T00:00:00')-(days-1)*86400000;const rows=state.records.filter(r=>new Date(r.day+'T00:00:00').getTime()>=limit);const groups=new Map();for(const r of rows){const key=[r.day,r.login,r.process].join('|');if(!groups.has(key))groups.set(key,{day:r.day,login:r.login,process:r.process,hours:0});groups.get(key).hours++;}return [...groups.values()].sort((a,b)=>b.day.localeCompare(a.day)||a.login.localeCompare(b.login));});
 function selectLogin(login){state.selectedLogin=norm(login);}
 async function save(){await put('records',JSON.parse(JSON.stringify({records:state.records,additionalProcesses:state.additionalProcesses})));state.dirty=true;state.status='LOCAL_SAVED';await syncIfAllowed();}
 async function assign(login,process){login=norm(login);process=norm(process);if(!login||!process||state.to<=state.from||state.to>slots.value.length)return false;state.records=applyAssignment(state.records,{day:state.day,shift:state.shift,from:state.from,to:state.to,login,process});state.selectedLogin='';await save();return true;}
 async function remove(login){const n=state.records.length;state.records=state.records.filter(r=>!(r.day===state.day&&r.shift===state.shift&&r.slot===state.from&&r.login===login));if(n!==state.records.length)await save();}
 function startDrag(event,login){event.dataTransfer.setData('text/plain',login);event.dataTransfer.effectAllowed='move';state.selectedLogin=login;}
 async function drop(event,process){event.preventDefault();const login=event.dataTransfer.getData('text/plain')||state.selectedLogin;await assign(login,process);}
 async function addProcess(name){name=norm(name).toUpperCase();if(!name||name.length>90)return; if(!processes.value.includes(name)){state.additionalProcesses.push(name);await save();}}
 async function seedFromSource(){const slot=slots.value[state.from];const matched=(source()?.intervals||[]).find(s=>s.start===minutes(slot?.from));if(!matched)return false;const people=matched.people||[];if(!people.length)return false;let overwrite=state.records.some(r=>r.day===state.day&&r.shift===state.shift&&r.slot===state.from);if(overwrite&&!root.confirm('Existing local assignments for this hour will be replaced. Continue?'))return false;state.records=state.records.filter(r=>!(r.day===state.day&&r.shift===state.shift&&r.slot===state.from));for(const p of people)state.records.push({day:state.day,shift:state.shift,slot:state.from,login:p.login,process:p.process,updated:new Date().toISOString()});await save();return true;}
 async function chooseFolder(){if(typeof root.showDirectoryPicker!=='function'){state.error='FOLDER_ACCESS_UNSUPPORTED';return;}try{const handle=await root.showDirectoryPicker({id:'mrrobot-obsada-local',mode:'readwrite'});const permission=await handle.requestPermission({mode:'readwrite'});if(permission!=='granted')throw Error('FOLDER_PERMISSION_REQUIRED');folderHandle=handle;state.folderName=handle.name;await put('folder',handle);await syncIfAllowed(true);}catch(err){if(err?.name!=='AbortError')state.error=err.message||String(err);}}
 async function syncIfAllowed(force=false){if(writing){queued=true;return;}if(!folderHandle){state.status='LOCAL_SAVED_NOT_EXPORTED';return;}if(await folderHandle.queryPermission({mode:'readwrite'})!=='granted'){state.status='FOLDER_PERMISSION_REQUIRED';return;}writing=true;state.busy=true;try{const workbook=buildWorkbook(root.XLSX,state.records);const buffer=root.XLSX.write(workbook,{type:'array',bookType:'xlsx'});let existing=null;
 try{existing=await folderHandle.getFileHandle(FILE);}catch(e){if(e.name!=='NotFoundError')throw e;}
 if(existing){
  const file=await existing.getFile();const workbook=root.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const currentRecords=readWorkbook(root.XLSX,workbook);
  const diskHash=fingerprint(currentRecords),localHash=fingerprint(state.records);
  if(lastExportHash===null && currentRecords.length && !state.records.length){state.records=currentRecords;await put('records',{records:JSON.parse(JSON.stringify(state.records)),additionalProcesses:[...state.additionalProcesses]});lastExportHash=diskHash;await put('lastExportHash',diskHash);state.dirty=false;state.status='XLSX_IMPORTED_FROM_FOLDER';return;}
  if(diskHash!==localHash && diskHash!==lastExportHash){state.status='EXTERNAL_CHANGES_DETECTED';return;}
 }
 const fileHandle=existing||await folderHandle.getFileHandle(FILE,{create:true});const writable=await fileHandle.createWritable();try{await writable.write(buffer);await writable.close();}catch(e){await writable.abort().catch(()=>{});throw e;}lastExportHash=fingerprint(state.records);await put('lastExportHash',lastExportHash);state.dirty=false;state.status='XLSX_SYNCED';state.error='';}catch(err){state.status='XLSX_FAILED';state.error=err.message||String(err);}finally{writing=false;state.busy=false;if(queued){queued=false;syncIfAllowed();}}}
 function download(){const workbook=buildWorkbook(root.XLSX,state.records);root.XLSX.writeFile(workbook,FILE);state.status='XLSX_DOWNLOADED';}
 async function importFile(event){const file=event.target.files?.[0];if(event.target)event.target.value='';if(!file)return;try{const wb=root.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const next=readWorkbook(root.XLSX,wb);if(state.records.length&&!root.confirm('Replace local planned history with the imported Excel?'))return;state.records=next;lastExportHash=fingerprint(next);await put('lastExportHash',lastExportHash);await save();state.status='LOCAL_IMPORTED';state.error='';}catch(err){state.error=err.message||String(err);}}
 async function init(){try{const saved=await get('records');if(saved){state.records=Array.isArray(saved.records)?saved.records.filter(validRecord):[];state.additionalProcesses=Array.isArray(saved.additionalProcesses)?saved.additionalProcesses:[];}lastExportHash=await get('lastExportHash')||null;folderHandle=await get('folder')||null;state.folderName=folderHandle?.name||'';state.active=true;}catch(err){state.error=err.message||String(err);state.active=true;}}
 init();
 return {state,shifts,slots,selectedSlot,current,initialWorkers,listedWorkers,unassigned,processes,processCards,days,historyRows,selectLogin,assign,remove,startDrag,drop,addProcess,seedFromSource,chooseFolder,syncIfAllowed,download,importFile};
}
root.MRObsadaPlanner={create,makeSlots,sheetRows,readWorkbook,buildWorkbook,validRecord,applyAssignment,localDate};
if(typeof module==='object'&&module.exports)module.exports=root.MRObsadaPlanner;
})(typeof window!=='undefined'?window:globalThis);
