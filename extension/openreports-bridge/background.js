'use strict';
const ORIGIN = 'https://openreports-wms.lpp.com/';
const REPORT_GROUP_URL = 'https://openreports-wms.lpp.com/openreports/reportGroup.action';
const APP_ORIGIN = 'https://horkiroman4408-cyber.github.io';
const APP_PREFIX = '/Mr.-Robot-App/';
const DOWNLOAD_SUBFOLDER = 'MrRobot/OpenReports/';
// Downloads API paths can be Windows paths or Unix-style absolute paths.
// Confirm exactly the designated directory, not a similarly named parent.
const inReportFolder = path => /(?:^|\/)MrRobot\/OpenReports\/[^/]+$/i.test(String(path||'').replace(/\\/g,'/'));
// Large OpenReports reports may take many minutes to generate before the download starts.
const MAX_PENDING_MS = 45 * 60 * 1000;
const MAX_LOGIN_MS = 15 * 60 * 1000;
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
  godziny_mdt: 'ECM_STOCK_Items_after_receiving',
  stock: 'ECM_PICK_Lacks_during_picking',
  mp_baza: 'ECM_STOCK_MP_and_on_the_floor',
  kpi_audit: 'Audit_ECM_KPI',
  kpi_scalanie: 'Pick_ECM_KPI',
  kpi_rozk: 'Storage_RSORT_ECM_KPI',
  kpi_nadwevas: 'NADWE_VAS_ECM_KPI'
});
// Check the name against the selected job's report, not against any XLSX.
const isReportName = (name, key) => {
  const report = REPORTS[key];
  if (!report) return false;
  const file = basename(name).toLowerCase();
  const prefix = report.toLowerCase();
  // Edge's conflictAction:'uniquify' may add (1), (2), ... before .xlsx.
  // Remove ONLY a final positive-number duplicate suffix, then apply the
  // original strict report-specific filename test.
  const canonical = file.replace(/ \([1-9]\d*\)(?=\.xlsx$)/i, '');
  return canonical === prefix + '.xlsx' || (canonical.startsWith(prefix+'_') && canonical.endsWith('.xlsx'));
};
const isApp = url => { try { const u=new URL(url);return u.origin===APP_ORIGIN&&(u.pathname===APP_PREFIX.slice(0,-1)||u.pathname.startsWith(APP_PREFIX)); } catch { return false; } };

const MP_AREAS=['MP*','MP1*','MP2*','MP3*'];
const MP_BRANDS=['','HOUSE','SINSAY','CROPP','MOHITO','RESERVED'];
const validMpParams=(area,brand)=>MP_AREAS.includes(area)&&MP_BRANDS.includes(brand);
const KEY = 'mrOpenReportsJob';
const getJob = async () => (await chrome.storage.local.get(KEY))[KEY] || null;
const save = async job => chrome.storage.local.set({[KEY]: job});
const currentJob = job => job && job.state==='running'; // never overlap active downloads

const fail = async (job, message) => save({...job, state:'error', message, updatedAt:Date.now()});
// A login page is not a report failure. Keep the job until the user signs in.
// Restore only demonstrably abandoned jobs. Never clear an active server download early.
async function refreshedJob(){
  let job=await getJob();
  if(!currentJob(job))return job;
  const now=Date.now();
  const tab=await chrome.tabs.get(job.tabId).catch(()=>null);
  if(!tab){await fail(job,'Karta OpenReports została zamknięta.');return getJob();}
  if(job.awaitingLogin && now-(job.loginStartedAt||job.startedAt)>MAX_LOGIN_MS){
    await fail(job,'Upłynął czas oczekiwania na logowanie do OpenReports (15 minut).');return getJob();
  }
  if(job.step==='download' && now-(job.downloadStartedAt||job.startedAt)>MAX_PENDING_MS){
    await fail(job,'OpenReports nie rozpoczął pobierania XLSX w wyznaczonym czasie.');return getJob();
  }
  if(job.step!=='download' && !job.awaitingLogin && now-(job.updatedAt||job.startedAt)>3*60*1000){
    await fail(job,'Poprzednie zadanie nie odpowiada od 3 minut. Uruchom raport ponownie.');return getJob();
  }
  return job;
}
const loginMessage='Oczekuję na zalogowanie w OpenReports. Dokończ logowanie w otwartej karcie…';
// Keep the report tab in the background for authorized sessions.
// Bring it to the front only when the user must complete login/SSO.
async function focusForLogin(tabId){
  const tab=await chrome.tabs.get(tabId).catch(()=>null);
  if(!tab)return;
  try{if(Number.isInteger(tab.windowId))await chrome.windows.update(tab.windowId,{focused:true});}catch{}
  try{await chrome.tabs.update(tab.id,{active:true});}catch{}
}
async function chooseTab(){
  const tabs=await chrome.tabs.query({url:'https://openreports-wms.lpp.com/*'});
  const existing=tabs.filter(t=>isTrusted(t.url)).sort((a,b)=>(b.lastAccessed||0)-(a.lastAccessed||0))[0];
  return existing||chrome.tabs.create({url:REPORT_GROUP_URL,active:false});
}
async function requestLogin(jobId,tabId){
  const shouldFocus=await withJobLock(async()=>{
    const job=await getJob();
    if(!job||job.state!=='running'||job.step!=='open-reports'||job.tabId!==tabId||job.jobId!==jobId)return false;
    const firstPrompt=!job.loginFocused;
    await save({...job,awaitingLogin:true,loginFocused:true,
      loginStartedAt:job.loginStartedAt||Date.now(),message:loginMessage,updatedAt:Date.now()});
    return firstPrompt;
  });
  if(shouldFocus)await focusForLogin(tabId);
}
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
  if(!tab)return fail(job,'Karta OpenReports została zamknięta.');
  // Corporate SSO can temporarily navigate outside the permitted origin.
  // Never inject into authentication providers or read their forms.
  if(!isTrusted(tab.url)){
    // If the assigned OpenReports tab already moved to corporate SSO before
    // our navigation callback, surface it for manual sign-in now.
    if(job.step==='open-reports' && /^https?:/i.test(tab.url||''))
      await requestLogin(job.jobId,tabId);
    return;
  }
  const command={type:'MR_PROCESS',jobId:job.jobId,step:job.step,from:job.from,to:job.to,report:job.report||'ai_audyt',area:job.area,brand:job.brand};
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
      try{await chrome.tabs.sendMessage(tabId,{type:'MR_PROCESS',jobId:fresh.jobId,step:fresh.step,from:fresh.from,to:fresh.to,report:fresh.report||'ai_audyt',area:fresh.area,brand:fresh.brand});}
      catch(e){/* content.js will signal when ready / tab navigation */}
    }
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async()=>{
    if(message?.type==='MR_START'){
      const {from,to}=message;
      const requestedTabId=message.tabId;
      const report=message.report||'ai_audyt';
      if(!REPORTS[report])throw Error('Nieznany raport OpenReports.');
      if(report==='mp_baza'?!validMpParams(message.area,message.brand):(!validDate(from)||!validDate(to)||from>to)) throw Error('Nieprawidłowy okres.');
      let tab=Number.isInteger(requestedTabId)?await chrome.tabs.get(requestedTabId):await chooseTab();
      if(!isTrusted(tab.url))throw Error('Otwórz autoryzowaną stronę OpenReports.');
      const tabId=tab.id;
      await withJobLock(async()=>{
        const existing=await refreshedJob();
        if(currentJob(existing)) throw Error('Inny raport jest już uruchomiony.');
        await save({jobId:crypto.randomUUID(),report,tabId,from,to,area:report==='mp_baza'?message.area:undefined,brand:report==='mp_baza'?message.brand:undefined,step:'open-reports',state:'running',message:'Łączę się z kartą OpenReports…',startedAt:Date.now(),updatedAt:Date.now()});
      });
      await runOnTab(tabId);
      sendResponse({ok:true});return;
    }
    if(message?.type==='MR_START_FROM_APP'){
      if(!isApp(sender.url) || !isApp(sender.tab?.url) || !Number.isInteger(sender.tab?.id))
        throw Error('Polecenie dostępne tylko w Mr. Robot.');
      const {from,to}=message;
      const report=message.report||'ai_audyt';
      if(!REPORTS[report])throw Error('Nieznany raport OpenReports.');
      if(report==='mp_baza'?!validMpParams(message.area,message.brand):(!validDate(from)||!validDate(to)||from>to))throw Error('Nieprawidłowy okres.');
      if(currentJob(await refreshedJob()))throw Error('Inny raport jest już uruchomiony.');
      const tab=await chooseTab();
      const job={jobId:crypto.randomUUID(),report,tabId:tab.id,appTabId:sender.tab.id,from,to,area:report==='mp_baza'?message.area:undefined,brand:report==='mp_baza'?message.brand:undefined,step:'open-reports',state:'running',message:'Łączę się z kartą OpenReports…',startedAt:Date.now(),updatedAt:Date.now()};
      await withJobLock(async()=>{
        const previous=await refreshedJob();
        if(currentJob(previous))throw Error('Inny raport jest już uruchomiony.');
        await save(job);
      });
      await runOnTab(tab.id);
      sendResponse({ok:true,jobId:job.jobId});return;
    }
    if(message?.type==='MR_WAIT_LOGIN'){
      // Content script has confirmed login is needed. Activation is deliberately
      // postponed until now, so authorized background reports stay invisible.
      await requestLogin(message.jobId,sender.tab?.id);
      sendResponse({ok:true});return;
    }
    if(message?.type==='MR_CANCEL'){
      const job=await getJob();if(job?.state==='running'&&(!message.jobId||message.jobId===job.jobId))await save({...job,state:'cancelled',message:'Anulowano.',updatedAt:Date.now()});
      sendResponse({ok:true});return;
    }
    if(message?.type==='MR_STATUS'){
      let job=await refreshedJob();
      if(job?.state==='running' && job.awaitingLogin && job.step==='open-reports' && Date.now()-(job.loginStartedAt||job.startedAt)>MAX_LOGIN_MS){
        await fail(job,'Upłynął czas oczekiwania na logowanie do OpenReports (15 minut). Spróbuj ponownie.');
        job=await getJob();
      }
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
        await save({...job,step:next,awaitingLogin:false,loginStartedAt:null,message:message.message||'Przetwarzanie…',
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
chrome.tabs.onRemoved.addListener(tabId=>{withJobLock(async()=>{
  const job=await getJob();
  if(job?.state==='running'&&job.tabId===tabId)await fail(job,'Karta OpenReports została zamknięta.');
}).catch(()=>{});});
chrome.tabs.onUpdated.addListener((tabId,change,tab)=>{
  if(change.status==='complete'||change.url){
    // SSO may redirect to an external identity provider before content.js can
    // report a login form. Never inject or read the identity provider page.
    // Only focus the exact tab assigned to the pending login-stage job.
    if(change.url && !isTrusted(change.url)){
      getJob().then(job=>{
        if(job?.state==='running'&&job.step==='open-reports'&&job.tabId===tabId)
          return requestLogin(job.jobId,tabId);
      }).catch(()=>{});
    }
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
