'use strict';
const ORIGIN = 'https://openreports-wms.lpp.com/';
const APP_ORIGIN = 'https://horkiroman4408-cyber.github.io';
const APP_PREFIX = '/Mr.-Robot-App/';
const DOWNLOAD_SUBFOLDER = 'MrRobot/OpenReports/';
// Downloads API paths can be Windows paths or Unix-style absolute paths.
// Confirm exactly the designated directory, not a similarly named parent.
const inReportFolder = path => /(?:^|\/)MrRobot\/OpenReports\/[^/]+$/i.test(String(path||'').replace(/\\/g,'/'));
// Large OpenReports reports may take many minutes to generate before the download starts.
const MAX_PENDING_MS = 45 * 60 * 1000;
// Serialize event-driven job updates to avoid an old navigation callback overwriting a newer stage.
let jobMutations = Promise.resolve();
function withJobLock(fn){
  const result = jobMutations.then(fn,fn);
  jobMutations = result.catch(()=>{});
  return result;
}
const basename = name => String(name||'').replace(/\\/g,'/').split('/').pop();
const REPORTS = Object.freeze({
  ai_audyt: 'ECM_AI_Audit',
  godziny_mdt: 'ECM_STOCK_Items_after_receiving'
});
// Check the name against the selected job's report, not against any XLSX.
const isReportName = (name, key) => {
  const report = REPORTS[key];
  if (!report) return false;
  const file = basename(name).toLowerCase();
  const prefix = report.toLowerCase();
  return file === prefix + '.xlsx' || (file.startsWith(prefix+'_') && file.endsWith('.xlsx'));
};
const isApp = url => { try { const u=new URL(url);return u.origin===APP_ORIGIN&&(u.pathname===APP_PREFIX.slice(0,-1)||u.pathname.startsWith(APP_PREFIX)); } catch { return false; } };

const KEY = 'mrOpenReportsJob';
const getJob = async () => (await chrome.storage.local.get(KEY))[KEY] || null;
const save = async job => chrome.storage.local.set({[KEY]: job});
const currentJob = job => job && job.state==='running'; // explicit Cancel is required; never overlap active downloads

const fail = async (job, message) => save({...job, state:'error', message, updatedAt:Date.now()});
const validDate = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if(!m)return false;
  const [year,month,day,hour,minute,second]=m.slice(1).map(Number);
  if(hour>23||minute>59||second>59||month<1||month>12||day<1)return false;
  const daysInMonth=new Date(Date.UTC(year,month,0)).getUTCDate();
  return day<=daysInMonth;
};
function isTrusted(url){try{return new URL(url).origin === new URL(ORIGIN).origin;}catch{return false;}}
// Also reaches tabs that were open before the extension was installed/reloaded.
// Such tabs do not yet have a manifest-declared content script. On-demand
// injection (into the already permitted OpenReports origin only) fixes this.
const injectingTabs = new Map();
async function runOnTab(tabId){
  const job=await getJob();
  if(!job||job.tabId!==tabId||job.state!=='running')return;
  const tab=await chrome.tabs.get(tabId).catch(()=>null);
  if(!tab||!isTrusted(tab.url))return fail(job,'Karta OpenReports została zamknięta lub zmieniła adres.');
  const command={type:'MR_PROCESS',jobId:job.jobId,step:job.step,from:job.from,to:job.to,report:job.report||'ai_audyt'};
  try {
    await chrome.tabs.sendMessage(tabId,command);
    return;
  } catch (_missingReceiver) {
    // May be a full page navigation in progress; onUpdated or the newly
    // injected content script will resubmit the current job when ready.
    if(tab.status==='loading')return;
    if(!injectingTabs.has(tabId)){
      const task=(async()=>{
        try {
          await chrome.scripting.executeScript({target:{tabId},files:['content.js']});
        } catch(e) {
          const now=await getJob();
          if(now?.state==='running'&&now.tabId===tabId){
            await fail(now,'Nie mogę połączyć się ze stroną OpenReports. Odśwież kartę (F5) i spróbuj ponownie. Szczegóły: '+String(e.message||e));
          }
        }
      })().finally(()=>injectingTabs.delete(tabId));
      injectingTabs.set(tabId,task);
    }
    await injectingTabs.get(tabId);
    // Injected content.js sends MR_READY. This explicit send also covers
    // the case where a browser delays that notification.
    const fresh=await getJob();
    if(fresh?.state==='running'&&fresh.tabId===tabId){
      try{await chrome.tabs.sendMessage(tabId,{type:'MR_PROCESS',jobId:fresh.jobId,step:fresh.step,from:fresh.from,to:fresh.to,report:fresh.report||'ai_audyt'});}
      catch(e){/* content.js will signal when ready / tab navigation */}
    }
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async()=>{
    if(message?.type==='MR_START'){
      const {tabId,from,to}=message;
      const report=message.report||'ai_audyt';
      if(!REPORTS[report])throw Error('Nieznany raport OpenReports.');
      if(!Number.isInteger(tabId)||!validDate(from)||!validDate(to)||from>to) throw Error('Nieprawidłowy okres.');
      const tab=await chrome.tabs.get(tabId);
      if(!isTrusted(tab.url)) throw Error('Otwórz autoryzowaną stronę OpenReports.');
      const existing=await getJob();
      if(currentJob(existing)) throw Error('Inny raport jest już uruchomiony.');
      await save({jobId:crypto.randomUUID(),report,tabId,from,to,step:'open-reports',state:'running',message:'Łączę się z kartą OpenReports…',startedAt:Date.now(),updatedAt:Date.now()});
      await runOnTab(tabId);
      sendResponse({ok:true});return;
    }
    if(message?.type==='MR_START_FROM_APP'){
      if(!isApp(sender.url) || !isApp(sender.tab?.url) || !Number.isInteger(sender.tab?.id))
        throw Error('Polecenie dostępne tylko w Mr. Robot.');
      const {from,to}=message;
      const report=message.report||'ai_audyt';
      if(!REPORTS[report])throw Error('Nieznany raport OpenReports.');
      if(!validDate(from)||!validDate(to)||from>to)throw Error('Nieprawidłowy okres.');
      const previous=await getJob();
      if(currentJob(previous))throw Error('Inny raport jest już uruchomiony.');
      const tabs=await chrome.tabs.query({url:'https://openreports-wms.lpp.com/*'});
      const tab=tabs.filter(t=>isTrusted(t.url)).sort((a,b)=>(b.lastAccessed||0)-(a.lastAccessed||0))[0];
      if(!tab)throw Error('Otwórz OpenReports-WMS w osobnej karcie Edge i zaloguj się.');
      const job={jobId:crypto.randomUUID(),report,tabId:tab.id,appTabId:sender.tab.id,from,to,step:'open-reports',state:'running',message:'Łączę się z kartą OpenReports…',startedAt:Date.now(),updatedAt:Date.now()};
      await save(job);
      await runOnTab(tab.id);
      sendResponse({ok:true,jobId:job.jobId});return;
    }
    if(message?.type==='MR_CANCEL'){
      const job=await getJob();if(job?.state==='running')await save({...job,state:'cancelled',message:'Anulowano.',updatedAt:Date.now()});
      sendResponse({ok:true});return;
    }
    if(message?.type==='MR_STATUS'){
      let job=await getJob();
      if(job?.state==='running' && job.step==='download'){
        if(job.downloadId==null && Date.now()-(job.downloadStartedAt||job.startedAt)>MAX_PENDING_MS){
          await fail(job,'OpenReports nie rozpoczął pobierania XLSX przez 45 minut. Sprawdź raport i spróbuj ponownie.');
          job=await getJob();
        }else if(job.downloadId!=null){
          try {
            const [item]=await chrome.downloads.search({id:job.downloadId});
            if(item?.state==='complete'){
              await finishDownload(job,item);
              job=await getJob();
            }else if(item?.state==='interrupted'){
              await fail(job,'Pobieranie przerwane.');
              job=await getJob();
            }else if(item){
              const received=Number(item.bytesReceived)||0;
              const total=Number(item.totalBytes)||0;
              const info=total>0?`${Math.min(100,Math.floor(received/total*100))}% (${formatMB(received)} / ${formatMB(total)})`:`${formatMB(received)}`;
              job={...job,message:'Pobieranie XLSX… '+info};
            }
          }catch(e){/* progress is optional; continue waiting for download event */}
        } else {
          job={...job,message:'OpenReports przygotowuje raport. Czekam na rozpoczęcie pobierania XLSX…'};
        }
      }
      sendResponse({ok:true,job});return;
    }
    if(message?.type==='MR_READY'){
      if(sender.tab?.id) await runOnTab(sender.tab.id);
      sendResponse({ok:true});return;
    }
    if(message?.type==='MR_STEP'){
      const result=await withJobLock(async()=>{
        const job=await getJob();
        // Old page callbacks, duplicate progress messages or callbacks from a
        // previous report must never turn the current report into an error.
        if(!job || job.state!=='running' || job.tabId!==sender.tab?.id || job.jobId!==message.jobId)
          return {ok:true,stale:true};
        if(message.step!==job.step){
          // Normal race: a page transition has already advanced the job.
          return {ok:true,stale:true};
        }
        const transitions={'open-reports':'open-group','open-group':'find-report','find-report':'fill-parameters','fill-parameters':'export','export':'download'};
        const next=transitions[job.step];
        if(!next) return {ok:true,stale:true};
        await save({...job,step:next,message:message.message||'Przetwarzanie…',
          updatedAt:Date.now(),downloadStartedAt:next==='download'?Date.now():job.downloadStartedAt});
        return {ok:true,stale:false};
      });
      sendResponse(result);return;
    }
    if(message?.type==='MR_ERROR'){
      await withJobLock(async()=>{
        const job=await getJob();
        // Ignore errors from a previous document/stage (especially while
        // OpenReports is busy generating a large XLSX).
        if(job?.state==='running' && job.tabId===sender.tab?.id &&
           job.jobId===message.jobId && job.step===message.step){
          await fail(job,message.message||'Nieznany błąd.');
        }
      });
      sendResponse({ok:true});return;
    }
    throw Error('Unknown message');
  })().catch(e=>sendResponse({ok:false,error:String(e.message||e)}));
  return true;
});
// Some report links open a new OpenReports tab. If it was opened by the
// current tab, follow it instead of polling the old report list forever.
// Do not attach to unrelated OpenReports tabs without a verified opener.
const adoptingTabs=new Set();
async function adoptOpenedTab(tabId,tabData){
  if(adoptingTabs.has(tabId))return;
  adoptingTabs.add(tabId);
  try{
    const job=await getJob();
    if(!job||job.state!=='running'||!['find-report','fill-parameters','export'].includes(job.step))return;
    const tab=tabData?.url?tabData:await chrome.tabs.get(tabId).catch(()=>null);
    if(!tab||!isTrusted(tab.url)||tab.openerTabId!==job.tabId||tab.id===job.tabId)return;
    await save({...job,tabId:tab.id,message:'Otwarta nowa karta OpenReports. Sprawdzam formularz…',updatedAt:Date.now()});
    await runOnTab(tab.id);
  }finally{adoptingTabs.delete(tabId);}
}
chrome.tabs.onCreated.addListener(tab=>{adoptOpenedTab(tab.id,tab).catch(()=>{});});
chrome.tabs.onUpdated.addListener((tabId,change,tab)=>{
  if(change.status==='complete'||change.url){
    adoptOpenedTab(tabId,tab).then(()=>runOnTab(tabId)).catch(()=>{});
  }
});
// Use the Edge download ID as the authoritative completion signal.
// No fixed two-minute timeout: server-side generation may take substantially longer.
const formatMB = n => (Number(n||0)/1048576).toFixed(1)+' MB';
const canReceive = job => job?.state==='running' && job.step==='download' &&
  Date.now()-(job.downloadStartedAt||job.startedAt)<MAX_PENDING_MS;
const fromReport = (item,job) => {
  if(!canReceive(job))return false;
  if(!isReportName(item.filename,job.report||'ai_audyt'))return false;
  if(Number.isInteger(item.tabId) && item.tabId>=0 && item.tabId!==job.tabId)return false;
  return isTrusted(item.url)||isTrusted(item.referrer);
};
async function claimDownload(item){
  return withJobLock(async()=>{
    const job=await getJob();
    if(!fromReport(item,job))return false;
    if(job.downloadId!=null && job.downloadId!==item.id)return false;
    await save({...job,downloadId:item.id,downloadFilename:basename(item.filename),
      message:'Pobieranie XLSX…',updatedAt:Date.now()});
    return true;
  });
}
async function finishDownload(job,item){
  const fresh=await getJob();
  if(!fresh||fresh.jobId!==job.jobId||fresh.state!=='running'||fresh.step!=='download'||fresh.downloadId!==item.id)return;
  const fullName=String(item.filename||fresh.downloadFilename||'').replace(/\\/g,'/');
  const name=basename(fullName);
  if(!isReportName(name,fresh.report||'ai_audyt')){
    await fail(fresh,'Pobrany plik nie pasuje do raportu '+REPORTS[fresh.report||'ai_audyt']+'.');return;
  }
  const inDedicatedFolder=inReportFolder(fullName);
  await save({...fresh,state:'done',downloadFilename:name,inDedicatedFolder,
    message:inDedicatedFolder?'Excel pobrany do Downloads/MrRobot/OpenReports. Import do Mr. Robot…':'Excel pobrany poza Downloads/MrRobot/OpenReports. Sprawdź ustawienia pobierania Edge i wskaż rzeczywisty folder pliku.',updatedAt:Date.now()});
}
chrome.downloads.onDeterminingFilename.addListener((item,suggest)=>{
  getJob().then(async job=>{
    if(fromReport(item,job)){
      const claimed=await claimDownload(item);
      if(claimed){suggest({filename:DOWNLOAD_SUBFOLDER+basename(item.filename),conflictAction:'uniquify'});return;}
    }
    suggest();
  }).catch(()=>suggest());
  return true;
});
chrome.downloads.onCreated.addListener(item=>{
  claimDownload(item).catch(()=>{});
});
chrome.downloads.onChanged.addListener(delta=>{
  withJobLock(async()=>{
    let job=await getJob();
    if(!job||job.state!=='running'||job.step!=='download')return;
    // Chromium may initially report an empty/temporary download name.
    if(job.downloadId==null && delta.filename?.current){
      const [candidate]=await chrome.downloads.search({id:delta.id});
      if(candidate && fromReport(candidate,job)){
        await save({...job,downloadId:delta.id,downloadFilename:basename(candidate.filename),
          message:'Pobieranie XLSX…',updatedAt:Date.now()});
        job=await getJob();
      }
    }
    if(job.downloadId!==delta.id)return;
    if(delta.state?.current==='complete'){
      const [item]=await chrome.downloads.search({id:delta.id});
      if(item)await finishDownload(job,item);
    }else if(delta.state?.current==='interrupted')await fail(job,'Pobieranie przerwane.');
  }).catch(()=>{});
});
