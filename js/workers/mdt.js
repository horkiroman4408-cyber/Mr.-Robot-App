/* Kod Web Workera: MDT. Uruchamiany przez js/workers/common.js */
const MDT_WORKER_CODE=`
self.onmessage=function(e){try{self.postMessage({type:'progress',stage:'read',percent:5});const data=new Uint8Array(e.data.buffer);self.postMessage({type:'progress',stage:'excel',percent:30});const wb=XLSX.read(data,{type:'array',dense:true,cellStyles:false,cellNF:false,cellHTML:false,cellFormula:false,sheetStubs:false});self.postMessage({type:'progress',stage:'excel',percent:60});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});self.postMessage({type:'progress',stage:'parse',percent:90});self.postMessage({type:'done',records:rows,sheetName:wb.SheetNames[0]});}catch(err){self.postMessage({type:'error',message:err.message});}};
`;
