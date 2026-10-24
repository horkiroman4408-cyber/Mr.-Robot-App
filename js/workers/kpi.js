/* Kod Web Workera: KPI Norms. Uruchamiany przez js/workers/common.js */
const KPI_WORKER_CODE=`

const SHIFT_AB=new Set(${SHIFT_AB_STR});
const SHIFT_CD=new Set(${SHIFT_CD_STR});

// 🌟 NOWE: mapa przekazana z main thread (login → {firma, proces, shift})
let PRACOWNICY_MAP = null;

function detectShift(login){
  // 1. Ze справочника (jeśli przekazany)
  if (PRACOWNICY_MAP) {
    const p = PRACOWNICY_MAP[login];
    if (p && p.shift) return p.shift;
  }
  // 2. Fallback: hardkod
  if(SHIFT_AB.has(login))return 'AB';
  if(SHIFT_CD.has(login))return 'CD';
  return null;
}

function detectFirma(login){
  if (PRACOWNICY_MAP) {
    const p = PRACOWNICY_MAP[login];
    if (p && p.firma) return p.firma;
  }
  return null;
}

function detectProces(login){
  if (PRACOWNICY_MAP) {
    const p = PRACOWNICY_MAP[login];
    if (p && p.proces) return p.proces;
  }
  return null;
}

// 🌟 STARA funkcja detectGroup — zostawiamy jako fallback
function detectGroup(login){
  const l=String(login).toUpperCase();
  if(l.startsWith('SPM'))return 'spm';
  if(l.startsWith('SPD'))return 'spd';
  if(l.startsWith('PM'))return 'mohito';
  if(l.startsWith('PD'))return 'sinsay';
  if(l.startsWith('36'))return 'lpp';
  return 'inne';
}

function findHeaderRow(rows,expectedNames){for(let i=0;i<Math.min(15,rows.length);i++){const rowStr=rows[i].map(c=>String(c).toLowerCase().trim());const hits=expectedNames.filter(name=>rowStr.some(cell=>cell.includes(name.toLowerCase()))).length;if(hits>=2)return i;}return 0;}
function colIdx(headers,variants){const norm=h=>String(h).toLowerCase().replace(/\\s+/g,' ').trim();for(const v of variants){const idx=headers.findIndex(h=>norm(h)===norm(v));if(idx!==-1)return idx;}for(const v of variants){const idx=headers.findIndex(h=>norm(h).includes(norm(v)));if(idx!==-1)return idx;}return -1;}
function val(row,idx){if(idx<0||!row)return '';const v=row[idx];return v===undefined||v===null?'':v;}
function num(v){if(v===''||v===null||v===undefined)return 0;const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?0:n;}
function detectGroup(login){const l=String(login).toUpperCase();if(l.startsWith('SPM'))return 'spm';if(l.startsWith('SPD'))return 'spd';if(l.startsWith('PM'))return 'mohito';if(l.startsWith('PD'))return 'sinsay';if(l.startsWith('36'))return 'lpp';return 'inne';}
function detectRodzaj(notice){const n=String(notice).toUpperCase().replace(/[\\s_\\-]+/g,' ').trim();if(n==='SCAL RSORT')return null;if(n==='NADWE RSORT')return 'RSORT';if(n==='B2B RETURNS RSORT')return 'Zwroty';return undefined;}
function parseAudit(rows){const hIdx=findHeaderRow(rows,['USER LOGIN','NUMBER OF ITEMS','NUMBER OF ITEMS PER HOUR']);const headers=rows[hIdx].map(h=>String(h).replace(/\\s+/g,' ').trim());const cLogin=colIdx(headers,['USER LOGIN']);const cItems=colIdx(headers,['NUMBER OF ITEMS']);const cTime=colIdx(headers,['TOTAL TIME IN THE PROCESS (A+I) (H)','TOTAL TIME IN THE PROCESS (A+I)','TOTAL TIME IN THE PROCESS']);const cPerH=colIdx(headers,['NUMBER OF ITEMS PER HOUR']);const cInfo=colIdx(headers,['INFO TIME (A+I)','INFO TIME']);const cAudit=colIdx(headers,['AUDIT PROCESS TIME']);const out=[];const total=rows.length-hIdx-1;let lastReport=0;for(let i=hIdx+1;i<rows.length;i++){const r=rows[i];if(r&&!r.every(c=>c==='')){const login=String(val(r,cLogin)).trim();const shift=detectShift(login);if(login&&login.toUpperCase()!=='USER LOGIN'){const items=num(val(r,cItems));if(items===0)continue;out.push({login,items,time:num(val(r,cTime)),perHour:num(val(r,cPerH)),infoTime:num(val(r,cInfo)),auditTime:num(val(r,cAudit)),group:detectGroup(login),shift,firma:detectFirma(login),proces:detectProces(login)});}}const pct=Math.floor((i-hIdx)/total*100);if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}}return out;}function parseScalanie(rows){const hIdx=findHeaderRow(rows,['USER LOGIN','NUMBER OF ITEMS','NUMBER OF ITEMS PER HOUR']);const headers=rows[hIdx].map(h=>String(h).replace(/\\s+/g,' ').trim());const cLogin=colIdx(headers,['USER LOGIN']);const cItems=colIdx(headers,['NUMBER OF ITEMS']);const cTime=colIdx(headers,['TOTAL TIME IN PROCESS','TOTAL TIME IN THE PROCESS']);const cPerH=colIdx(headers,['NUMBER OF ITEMS PER HOUR']);const out=[];const total=rows.length-hIdx-1;let lastReport=0;for(let i=hIdx+1;i<rows.length;i++){const r=rows[i];if(r&&!r.every(c=>c==='')){const login=String(val(r,cLogin)).trim();const shift=detectShift(login);if(login&&login.toUpperCase()!=='USER LOGIN'){const items=num(val(r,cItems));if(items===0)continue;out.push({login,items,time:num(val(r,cTime)),perHour:num(val(r,cPerH)),infoTime:0,auditTime:0,group:detectGroup(login),shift,firma:detectFirma(login),proces:detectProces(login)});}}const pct=Math.floor((i-hIdx)/total*100);if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}}return out;}
function parseRozkladanie(rows){const hIdx=findHeaderRow(rows,['USER LOGIN','NUMBER OF ITEMS','NUMBER OF ITEMS PER HOUR']);const headers=rows[hIdx].map(h=>String(h).replace(/\\s+/g,' ').trim());const cLogin=colIdx(headers,['USER LOGIN']);const cItems=colIdx(headers,['NUMBER OF ITEMS']);const cTime=colIdx(headers,['TOTAL TIME IN THE PROCESS (H)','TOTAL TIME IN THE PROCESS','TOTAL TIME IN PROCESS']);const cPerH=colIdx(headers,['NUMBER OF ITEMS PER HOUR']);const cNotice=colIdx(headers,['NOTICE']);const out=[];const total=rows.length-hIdx-1;let lastReport=0;for(let i=hIdx+1;i<rows.length;i++){const r=rows[i];if(r&&!r.every(c=>c==='')){const login=String(val(r,cLogin)).trim();const notice=String(val(r,cNotice)).trim();const rodzaj=detectRodzaj(notice);const shift=detectShift(login);if(rodzaj!==undefined&&login&&login.toUpperCase()!=='USER LOGIN'){const items=num(val(r,cItems));const time=num(val(r,cTime));const perHour=num(val(r,cPerH));if(items===0)continue;out.push({login,items,time,perHour,infoTime:0,auditTime:0,rodzaj,group:detectGroup(login),shift,firma:detectFirma(login),proces:detectProces(login)});}}const pct=Math.floor((i-hIdx)/total*100);if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}}return out;}
function parseNadweVas(rows){let hIdx=-1;for(let i=0;i<Math.min(15,rows.length);i++){const firstCell=String(rows[i][0]||'').toUpperCase().trim();if(firstCell==='USER LOGIN'){hIdx=i;break;}}if(hIdx===-1)return [];const out=[];const total=rows.length-hIdx-1;let lastReport=0;for(let i=hIdx+1;i<rows.length;i++){const r=rows[i];if(r&&!r.every(c=>c==='')){const login=String(val(r,0)).trim();const shift=detectShift(login);if(!login||login.toUpperCase()==='USER LOGIN'){const pct=Math.floor((i-hIdx)/total*100);if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}continue;}const nadweItems=num(val(r,1));const vasItems=num(val(r,2));const nadweTime=num(val(r,3));const vasTime=num(val(r,4));const nadwePerH=num(val(r,10));const vasPerH=num(val(r,11));if(nadweItems>0||nadwePerH>0){out.push({excelRow:i+1,login,items:nadweItems,time:nadweTime,perHour:nadwePerH,infoTime:0,auditTime:0,rodzaj:'NADWE',group:detectGroup(login),shift,firma:detectFirma(login),proces:detectProces(login)});}if(vasItems>0||vasPerH>0){out.push({excelRow:i+1,login,items:vasItems,time:vasTime,perHour:vasPerH,infoTime:0,auditTime:0,rodzaj:'VAS',group:detectGroup(login),shift,firma:detectFirma(login),proces:detectProces(login)});}}const pct=Math.floor((i-hIdx)/total*100);if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}}return out;}
self.onmessage=function(e){try{const{buffer,kind,pracownicyMap}=e.data;if(pracownicyMap)PRACOWNICY_MAP=pracownicyMap;self.postMessage({type:'progress',stage:'read',percent:5});const data=new Uint8Array(buffer);self.postMessage({type:'progress',stage:'excel',percent:30});const wb=XLSX.read(data,{type:'array',dense:true,cellStyles:false,cellNF:false,cellHTML:false,cellFormula:false,sheetStubs:false});self.postMessage({type:'progress',stage:'excel',percent:60});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});self.postMessage({type:'progress',stage:'parse',percent:0});let records;if(kind==='SCALANIE')records=parseScalanie(rows);else if(kind==='ROZKŁADANIE')records=parseRozkladanie(rows);else if(kind==='NADWE_VAS')records=parseNadweVas(rows);else records=parseAudit(rows);self.postMessage({type:'done',records});}catch(err){self.postMessage({type:'error',message:err.message});}};
`;
