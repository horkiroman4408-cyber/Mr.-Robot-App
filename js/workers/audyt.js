/* Kod Web Workera: MP · Audyt. Uruchamiany przez js/workers/common.js */
const AUDYT_WORKER_CODE=`

function findAuditHeaderRow(rows){for(let i=0;i<Math.min(10,rows.length);i++){const row=rows[i].map(c=>String(c).toLowerCase().trim());const hasLocation=row.some(c=>c==='location');const hasIncident=row.some(c=>c==='incident');const hasInfo=row.some(c=>c==='info');if(hasLocation&&hasIncident&&hasInfo)return i;}return 1;}
function colIdx(headers,variants){const norm=h=>String(h).toLowerCase().replace(/\\s+/g,' ').trim();for(const v of variants){const idx=headers.findIndex(h=>norm(h)===norm(v));if(idx!==-1)return idx;}for(const v of variants){const idx=headers.findIndex(h=>norm(h).includes(norm(v)));if(idx!==-1)return idx;}return -1;}
function val(row,idx){if(idx<0||!row)return '';const v=row[idx];return v===undefined||v===null?'':v;}
function parseAudyt(rows){
const hIdx=findAuditHeaderRow(rows);
const headers=rows[hIdx].map(h=>String(h).replace(/\\s+/g,' ').trim());
const cLocation=colIdx(headers,['Location']);
const cItemNo=colIdx(headers,['Item No.','Item No','Item number']);
const cIncident=colIdx(headers,['Incident']);
const cInfo=colIdx(headers,['INFO']);
const out=[];
const total=rows.length-hIdx-1;
let lastReport=0;
for(let i=hIdx+1;i<rows.length;i++){
const r=rows[i];
if(!r||r.every(c=>c==='')){continue;}
const locRaw=String(val(r,cLocation)).trim();
const itemRaw=String(val(r,cItemNo)).trim();
const incidentRaw=String(val(r,cIncident)).trim();
const infoRaw=String(val(r,cInfo)).trim();
if(['MP1','MP3'].some(prefix=>locRaw.toUpperCase().startsWith(prefix))){continue;}
if(itemRaw==='-'){continue;}
out.push({location:locRaw,incident:incidentRaw,info:infoRaw});
const pct=Math.floor((i-hIdx)/total*100);
if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}
}
return out;
}
function parseFormatka59(rows){
const hIdx=findAuditHeaderRow(rows);
const out=[];
const total=rows.length-hIdx-1;
let lastReport=0;
for(let i=hIdx+1;i<rows.length;i++){
const r=rows[i];
if(!r||r.every(c=>c==='')){continue;}
const locRaw=String(r[1]||'').trim();
if(!locRaw)continue;
const incidentRaw=String(r[11]||'').trim();
const uniqueQty=parseFloat(String(r[8]||'0').replace(',','.'))||0;
const countedQty=parseFloat(String(r[9]||'0').replace(',','.'))||0;
const diffQty=parseFloat(String(r[10]||'0').replace(',','.'))||0;
out.push({location:locRaw,incident:incidentRaw,uniqueQty,countedQty,diffQty});
const pct=Math.floor((i-hIdx)/total*100);
if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}
}
return out;
}
self.onmessage=function(e){try{const{buffer}=e.data;self.postMessage({type:'progress',stage:'read',percent:5});const data=new Uint8Array(buffer);self.postMessage({type:'progress',stage:'excel',percent:30});const wb=XLSX.read(data,{type:'array',dense:true,cellStyles:false,cellNF:false,cellHTML:false,cellFormula:false,sheetStubs:false});self.postMessage({type:'progress',stage:'excel',percent:60});const sheetName=wb.SheetNames.includes('ECM_AI_Audit')?'ECM_AI_Audit':wb.SheetNames[0];const sheet=wb.Sheets[sheetName];const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});self.postMessage({type:'progress',stage:'parse',percent:0});const records=parseAudyt(rows);const formatkaRecords=parseFormatka59(rows);self.postMessage({type:'done',records,formatkaRecords,sheetName});}catch(err){self.postMessage({type:'error',message:err.message});}};
`;
