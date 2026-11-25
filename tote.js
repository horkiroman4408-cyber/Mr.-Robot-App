/* Kod Web Workera: RS · Tote. Uruchamiany przez js/workers/common.js */
const TOTE_WORKER_CODE=`

function findHeaderRow(rows,expectedNames){for(let i=0;i<Math.min(10,rows.length);i++){if(!Array.isArray(rows[i]))continue;const rowStr=rows[i].map(c=>String(c).toLowerCase().trim());const hits=expectedNames.filter(name=>rowStr.some(cell=>cell.includes(name.toLowerCase()))).length;if(hits>=3)return i;}return 0;}
function findRsDataRows(wb){
  // Warehouse exports can contain an empty cover sheet. Inspect the first ten
  // rows of each sheet and select the first sheet with recognizable RS columns.
  const expected=['SKU code','Shelf type','Shelf code','Shelf bin','Inventory qty'];
  for(const sheetName of wb.SheetNames){
    const sheet=wb.Sheets[sheetName];if(!sheet)continue;
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
    if(!Array.isArray(rows)||!rows.length)continue;
    const hIdx=findHeaderRow(rows,expected);
    const header=Array.isArray(rows[hIdx])?rows[hIdx].map(x=>String(x).toLowerCase().trim()):[];
    const matches=expected.filter(name=>header.some(cell=>cell.includes(name.toLowerCase()))).length;
    if(matches>=3)return rows;
  }
  const error=new Error('RS worksheet with required columns was not found');
  error.code='RS_SHEET_NOT_FOUND';
  throw error;
}
function colIdx(headers,variants){const norm=h=>String(h).toLowerCase().replace(/\\s+/g,' ').trim();for(const v of variants){const idx=headers.findIndex(h=>norm(h)===norm(v));if(idx!==-1)return idx;}for(const v of variants){const idx=headers.findIndex(h=>norm(h).includes(norm(v)));if(idx!==-1)return idx;}return -1;}
function val(row,idx){if(idx<0||!row)return '';const v=row[idx];return v===undefined||v===null?'':v;}
function num(v){const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?0:n;}
function numOrNull(v){if(v===undefined||v===null||v==='')return null;const s=String(v).trim();if(s==='')return null;const n=parseFloat(s.replace(',','.'));return isNaN(n)?null:n;}
function parseMP(rows){const hIdx=findHeaderRow(rows,['BRAND','LOCATION','LOCATION TYPE','EAN','NO OF ITEMS']);const headers=rows[hIdx].map(h=>String(h).replace(/\\s+/g,' ').trim());const cLoc=colIdx(headers,['LOCATION']);const cType=colIdx(headers,['LOCATION TYPE']);const cLock=colIdx(headers,['LOCK_DESC']);const cEan=colIdx(headers,['EAN']);const cAbc=colIdx(headers,['ABC']);const cQty=colIdx(headers,['NO OF ITEMS']);const cAvail=colIdx(headers,['QTY AVAILABLE']);const cRes=colIdx(headers,['QTY RESERVED']);const cDescription=colIdx(headers,['TECHNICAL DESCRIPTION']);const out=[];const total=rows.length-hIdx-1;let lastReport=0;for(let i=hIdx+1;i<rows.length;i++){const r=rows[i];if(r&&!r.every(c=>c==='')){const ean=String(val(r,cEan)).trim();if(ean){out.push({location:String(val(r,cLoc)).trim(),locationType:String(val(r,cType)).trim(),lockDesc:String(val(r,cLock)).trim(),ean,technicalDescription:String(val(r,cDescription)).trim(),abc:String(val(r,cAbc)).trim().toUpperCase(),qty:num(val(r,cQty)),qtyAvailable:numOrNull(val(r,cAvail)),qtyReserved:numOrNull(val(r,cRes)),raw4:val(r,3),raw5:val(r,4),raw15:val(r,14),raw16:val(r,15)});}}const pct=Math.floor((i-hIdx)/total*100);if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}}return out;}
function parseRS(rows){const hIdx=findHeaderRow(rows,['SKU code','Shelf type','Shelf code','Shelf bin','Inventory qty']);const headers=rows[hIdx].map(h=>String(h).replace(/\\s+/g,' ').trim());const cEan=colIdx(headers,['SKU code']);const cType=colIdx(headers,['Shelf type']);const cCode=colIdx(headers,['Shelf code']);const cBin=colIdx(headers,['Shelf bin']);const cQty=colIdx(headers,['Inventory qty']);const out=[];const total=rows.length-hIdx-1;let lastReport=0;for(let i=hIdx+1;i<rows.length;i++){const r=rows[i];if(r&&!r.every(c=>c==='')){const ean=String(val(r,cEan)).trim();if(ean){out.push({ean,shelfType:String(val(r,cType)).trim(),shelfCode:String(val(r,cCode)).trim(),shelfBin:String(val(r,cBin)).trim(),qty:num(val(r,cQty))});}}const pct=Math.floor((i-hIdx)/total*100);if(pct>=lastReport+10){lastReport=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}}return out;}
// Large warehouse exports may have a worksheet XML exceeding the JavaScript
// maximum string length. Do not pass such a sheet through XLSX.read(): SheetJS
// suppresses the RangeError and returns a workbook without the worksheet.
const RS_STREAM_THRESHOLD=350*1024*1024;
function rsZipEntries(buffer){
  const data=new Uint8Array(buffer),dv=new DataView(buffer),len=data.length;
  let end=-1;
  for(let i=len-22;i>=Math.max(0,len-65557);i--){if(dv.getUint32(i,true)===0x06054b50){end=i;break;}}
  if(end<0)throw Error('Invalid XLSX ZIP directory');
  const count=dv.getUint16(end+10,true),start=dv.getUint32(end+16,true);
  if(start===0xffffffff||count===0xffff)throw Error('Unsupported ZIP64 XLSX');
  const entries=[];let pos=start;
  for(let n=0;n<count;n++){
    if(dv.getUint32(pos,true)!==0x02014b50)throw Error('Invalid XLSX ZIP entry');
    const nameLen=dv.getUint16(pos+28,true),extraLen=dv.getUint16(pos+30,true),commentLen=dv.getUint16(pos+32,true);
    const name=new TextDecoder().decode(data.subarray(pos+46,pos+46+nameLen));
    entries.push({name,method:dv.getUint16(pos+10,true),compressed:dv.getUint32(pos+20,true),size:dv.getUint32(pos+24,true),offset:dv.getUint32(pos+42,true)});
    pos+=46+nameLen+extraLen+commentLen;
  }
  return entries;
}
function rsWorksheetEntries(entries){return entries.filter(e=>/^xl\\/worksheets\\/sheet\\d+\\.xml$/.test(e.name)).sort((a,b)=>Number(a.name.match(/sheet(\\d+)/)[1])-Number(b.name.match(/sheet(\\d+)/)[1]));}
function rsZipXmlStream(buffer,entry){
  const dv=new DataView(buffer),u8=new Uint8Array(buffer),at=entry.offset;
  if(dv.getUint32(at,true)!==0x04034b50)throw Error('Invalid XLSX ZIP data');
  const begin=at+30+dv.getUint16(at+26,true)+dv.getUint16(at+28,true);
  if(begin+entry.compressed>u8.length)throw Error('Incomplete XLSX ZIP data');
  const stream=new Blob([u8.subarray(begin,begin+entry.compressed)]).stream();
  if(entry.method===0)return stream;
  if(entry.method!==8)throw Error('Unsupported XLSX ZIP compression');
  if(typeof DecompressionStream!=='function')throw Error('Streaming XLSX requires a newer browser');
  return stream.pipeThrough(new DecompressionStream('deflate-raw'));
}
function rsXmlUnescape(s){return String(s).replace(/&(?:amp|lt|gt|quot|apos|#x[0-9a-f]+|#\\d+);/gi,m=>{
  if(m==='&amp;')return '&';if(m==='&lt;')return '<';if(m==='&gt;')return '>';if(m==='&quot;')return '"';if(m==='&apos;')return "'";
  const hex=m[2]==='x'||m[2]==='X';const code=parseInt(m.slice(hex?3:2,-1),hex?16:10);
  try{return String.fromCodePoint(code);}catch{return m;}
});}
function rsExcelCol(s){let n=0;for(const c of s)n=n*26+c.charCodeAt(0)-64;return n-1;}
function rsXmlRow(xml){
  const values=[];const re=/<c\\b([^>]*?)>([\\s\\S]*?)<\\/c>/g;let cell;
  while((cell=re.exec(xml))!==null){
    const address=/\\br="([A-Z]+)\\d+"/.exec(cell[1]);if(!address)continue;
    const t=/<t(?:\\s[^>]*)?>([\\s\\S]*?)<\\/t>/.exec(cell[2]);
    const v=t||/<v>([\\s\\S]*?)<\\/v>/.exec(cell[2]);
    if(v)values[rsExcelCol(address[1])]=rsXmlUnescape(v[1]);
  }
  return values;
}
async function rsStreamWorksheet(buffer,entry){
  const expected=['sku code','shelf type','shelf code','shelf bin','inventory qty'];
  const stream=rsZipXmlStream(buffer,entry);
  const reader=stream.getReader(),decoder=new TextDecoder();let pending='',consumed=0;
  let mapping=null,processed=0,last=0;const records=[];
  try{
    while(true){
      const result=await reader.read();if(result.done)break;
      consumed+=result.value.byteLength;
      pending+=decoder.decode(result.value,{stream:true});
      let end;
      while((end=pending.indexOf('</row>'))>=0){
        const start=pending.lastIndexOf('<row',end);
        if(start>=0){
          const row=rsXmlRow(pending.slice(start,end+6));
          if(!mapping){
            const normalized=row.map(v=>String(v||'').toLowerCase().replace(/\\s+/g,' ').trim());
            const indexes=expected.map(name=>normalized.indexOf(name));
            if(indexes.every(i=>i>=0))mapping=indexes;
          }else{
            const ean=String(row[mapping[0]]||'').trim();
            if(ean)records.push({ean,shelfType:String(row[mapping[1]]||'').trim(),shelfCode:String(row[mapping[2]]||'').trim(),shelfBin:String(row[mapping[3]]||'').trim(),qty:num(row[mapping[4]])});
          }
          processed++;
        }
        pending=pending.slice(end+6);
      }
      if(pending.length>8388608)throw Error('Invalid XLSX worksheet row');
      const pct=Math.min(99,Math.floor(consumed/entry.size*100));
      if(pct>=last+10){last=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}
    }
  }finally{reader.releaseLock();}
  if(!mapping)return null;
  return records;
}
async function rsStreamWorkbook(buffer,entries){
  for(const entry of rsWorksheetEntries(entries)){
    const records=await rsStreamWorksheet(buffer,entry);
    if(records!==null)return records;
  }
  const err=new Error('RS worksheet with required columns was not found');err.code='RS_SHEET_NOT_FOUND';throw err;
}


// Big MP exports: stream XML rows instead of materializing the entire workbook
// and its large AOA. Keep every record key and legacy field normalization.
// This optimized path deliberately supports inline strings (OpenReports XML).
// Workbooks with sharedStrings continue through the proven SheetJS path.
const MP_STREAM_THRESHOLD=100*1024*1024;
function mpXmlRow(xml){
  const row=[];let m;
  const cells=/<c\\b([^>]*?)(?:\\/\\s*>|>([\\s\\S]*?)<\\/c>)/g;
  while((m=cells.exec(xml))!==null){
    const addr=/\\br="([A-Z]+)\\d+"/.exec(m[1]);if(!addr)continue;
    const index=rsExcelCol(addr[1]);const body=m[2]||'';
    const type=/\\bt="([^"]+)"/.exec(m[1])?.[1]||'n';
    let v='';
    if(type==='inlineStr'||type==='str'){
      const texts=/<t(?:\\s[^>]*)?>([\\s\\S]*?)<\\/t>/g;let t;
      while((t=texts.exec(body))!==null)v+=rsXmlUnescape(t[1]);
      if(!v){const raw=/<v>([\\s\\S]*?)<\\/v>/.exec(body);if(raw)v=rsXmlUnescape(raw[1]);}
    }else{
      const raw=/<v>([\\s\\S]*?)<\\/v>/.exec(body);
      if(raw){const value=rsXmlUnescape(raw[1]);
        v=type==='b'?value==='1':type==='n'?(value===''?'':Number(value)):value;
      }
    }
    row[index]=v;
  }
  return row;
}
function mpMapping(header){
  const h=header.map(v=>String(v||'').replace(/\\s+/g,' ').trim());
  const found=['BRAND','LOCATION','LOCATION TYPE','EAN','NO OF ITEMS'].filter(k=>h.some(v=>v.toLowerCase().includes(k.toLowerCase()))).length;
  if(found<3)return null;
  return {loc:colIdx(h,['LOCATION']),type:colIdx(h,['LOCATION TYPE']),lock:colIdx(h,['LOCK_DESC']),
    ean:colIdx(h,['EAN']),abc:colIdx(h,['ABC']),qty:colIdx(h,['NO OF ITEMS']),
    avail:colIdx(h,['QTY AVAILABLE']),res:colIdx(h,['QTY RESERVED']),desc:colIdx(h,['TECHNICAL DESCRIPTION'])};
}
function mpRecord(row,c){
  const ean=String(val(row,c.ean)).trim();if(!ean)return null;
  return {location:String(val(row,c.loc)).trim(),locationType:String(val(row,c.type)).trim(),
    lockDesc:String(val(row,c.lock)).trim(),ean,technicalDescription:String(val(row,c.desc)).trim(),
    abc:String(val(row,c.abc)).trim().toUpperCase(),qty:num(val(row,c.qty)),
    qtyAvailable:numOrNull(val(row,c.avail)),qtyReserved:numOrNull(val(row,c.res)),
    raw4:val(row,3),raw5:val(row,4),raw15:val(row,14),raw16:val(row,15)};
}
async function mpStreamWorksheet(buffer,entry){
  const reader=rsZipXmlStream(buffer,entry).getReader(),decoder=new TextDecoder();
  let pending='',consumed=0,seenRows=0,mapping=null,last=-1;const records=[];
  try{
    while(true){
      const {done,value}=await reader.read();if(done)break;
      consumed+=value.byteLength;pending+=decoder.decode(value,{stream:true});
      let end;
      while((end=pending.indexOf('</row>'))>=0){
        const start=pending.lastIndexOf('<row',end);
        if(start>=0){
          const row=mpXmlRow(pending.slice(start,end+6));
          if(!mapping){if(seenRows<10)mapping=mpMapping(row);}
          else{const record=mpRecord(row,mapping);if(record)records.push(record);}
          seenRows++;
        }
        pending=pending.slice(end+6);
      }
      if(pending.length>8388608)throw Error('Invalid MP XLSX worksheet row');
      const pct=Math.min(99,Math.floor(consumed/entry.size*100));
      if(pct>=last+2){last=pct;self.postMessage({type:'progress',stage:'parse',percent:pct});}
    }
  }finally{reader.releaseLock();}
  return mapping?records:null;
}
async function mpStreamWorkbook(buffer,entries){
  for(const entry of rsWorksheetEntries(entries)){
    const found=await mpStreamWorksheet(buffer,entry);
    if(found!==null)return found;
  }
  const err=new Error('MP worksheet with required columns was not found');err.code='MP_SHEET_NOT_FOUND';throw err;
}

self.onmessage=async function(e){try{const{buffer,kind}=e.data;self.postMessage({type:'progress',stage:'read',percent:10});const data=new Uint8Array(buffer);self.postMessage({type:'progress',stage:'excel',percent:30});if(kind==='RS'){const entries=rsZipEntries(buffer);if(rsWorksheetEntries(entries).some(e=>e.size>RS_STREAM_THRESHOLD)){self.postMessage({type:'progress',stage:'parse',percent:0});const records=await rsStreamWorkbook(buffer,entries);self.postMessage({type:'done',records});return;}}if(kind==='MP'){const entries=rsZipEntries(buffer);if(!entries.some(e=>e.name==='xl/sharedStrings.xml')&&rsWorksheetEntries(entries).some(e=>e.size>MP_STREAM_THRESHOLD)){self.postMessage({type:'progress',stage:'parse',percent:0});const records=await mpStreamWorkbook(buffer,entries);self.postMessage({type:'done',records});return;}}const wb=XLSX.read(data,{type:'array',dense:true,cellStyles:false,cellNF:false,cellHTML:false,cellFormula:false,sheetStubs:false});self.postMessage({type:'progress',stage:'excel',percent:60});const rows=kind==='RS'?findRsDataRows(wb):XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});self.postMessage({type:'progress',stage:'parse',percent:0});const records=kind==='MP'?parseMP(rows):parseRS(rows);self.postMessage({type:'done',records});}catch(err){self.postMessage({type:'error',message:err.message,code:err.code||''});}};
`;
