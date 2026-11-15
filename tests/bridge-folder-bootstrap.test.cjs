const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync(__dirname+'/../extension/openreports-bridge/background.js','utf8');
const start=source.indexOf('const MR_STORAGE_DIRS');
const end=source.indexOf('// Downloads API paths',start);
assert(start!==-1&&end>start);
const code=source.slice(start,end)+'\n globalThis.prepare=mrPrepareStorage;';
async function runScenario({moved=false,interrupted=false,failCleanup=false}={}){
  let next=0;const files=new Map(),calls=[],erasures=[];
  const chrome={downloads:{
    async download(spec){const id=++next;calls.push(spec);files.set(id,{id,filename:'C:/Users/Test/Downloads/'+(moved?'elsewhere':spec.filename),state:interrupted?'interrupted':'complete'});return id},
    async search({id}){return files.has(id)?[files.get(id)]:[]},
    async removeFile(id){if(failCleanup)throw Error('test cleanup');files.delete(id)},
    async erase({id}){erasures.push(id)}
  }};
  const context=vm.createContext({chrome,Date,Promise,setTimeout,Error,globalThis:null});context.globalThis=context;
  vm.runInContext(code,context);
  let res,err;try{res=await context.prepare()}catch(e){err=e.message}
  return {res,err,calls,erasures};
}
(async()=>{
  const ok=await runScenario();assert.equal(ok.res.ok,true);assert.deepEqual([...ok.res.folders],['OpenReports','SharePoint','Obsada','Import','Backup']);assert.equal(ok.calls.length,5);assert.equal(ok.erasures.length,5);assert(ok.calls.every(c=>c.filename.startsWith('MrRobot/')&&c.saveAs===false&&c.conflictAction==='overwrite'));
  const again=await runScenario();assert.equal(again.calls.length,5);
  const moved=await runScenario({moved:true});assert.equal(moved.err,'STORAGE_DOWNLOAD_PATH_CHANGED');assert.equal(moved.calls.length,1);
  const interrupted=await runScenario({interrupted:true});assert.equal(interrupted.err,'STORAGE_DOWNLOAD_INTERRUPTED');
  const failCleanup=await runScenario({failCleanup:true});assert.equal(failCleanup.err,'STORAGE_MARKER_CLEANUP_FAILED');
  console.log('PASS: 5 folders, repeat setup, moved download, interrupted download, cleanup error');
})().catch(e=>{console.error(e);process.exitCode=1});
