/* SharePoint manual refresh experiment, completely separated from OpenReports jobs.
 * Does not intercept other files or read corporate workbook data.
 */
'use strict';
(()=>{
 const KEY='mr_sp_manual_job',SOURCE='mr_sp_source';
 const DEST='MrRobot/SharePoint/Grafik procesowy (godziny).xlsx';
 const MAX_AGE=4*60*1000;
 const EXPECTED=/^grafik\s+procesowy\s*\(godziny\)(?:\s*\(\d+\))?\.xlsx$/i;
 const get=async()=> (await chrome.storage.local.get(KEY))[KEY]||null;
 const put=async(j)=>chrome.storage.local.set({[KEY]:j});
 const safe=(s)=>String(s||'').replace(/https?:\/\/\S+/g,'[URL]').slice(0,150);
 const allowedUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&u.hostname==='lppsa-my.sharepoint.com'&&!u.username&&!u.password;}catch{return false;}};
 const nameOf=s=>String(s||'').replace(/\\/g,'/').split('/').pop();
 const validJob=j=>j&&['waiting','downloading'].includes(j.state)&&Date.now()-j.started<MAX_AGE;
 const expectedDownload=(item,j)=>validJob(j)&&EXPECTED.test(nameOf(item.filename))&&item.startTime&&Date.parse(item.startTime)>j.started-1500;
 // Chrome's onDeterminingFilename must be answered synchronously or via suggest() with return true.
 globalThis.mrSharePointDownloadName=(item,suggest)=>{
  // Item metadata may be incomplete at this stage; do not accidentally reroute other XLSX.
  // Triggered by exact expected original download name within the explicitly started job window.
  if(!EXPECTED.test(nameOf(item.filename)))return false;
  get().then(async j=>{
   if(!expectedDownload(item,j)){suggest();return;}
   await put({...j,downloadId:item.id,state:'downloading',filename:DEST});
   suggest({filename:DEST,conflictAction:'overwrite'});
  }).catch(()=>suggest());
  return true;
 };
 chrome.downloads.onChanged.addListener(async delta=>{
  if(!delta.state)return;
  const j=await get();if(j?.downloadId!==delta.id||j.state!=='downloading')return;
  if(delta.state.current==='complete')await put({...j,state:'complete',finished:Date.now()});
  if(delta.state.current==='interrupted')await put({...j,state:'failed',error:'POBIERANIE_PRZERWANE'});
 });
 async function tryClick(tabId){
  // The Polish Excel Online menu uses: Plik → Utwórz kopię → Pobierz kopię.
  // Other tenants may use the older Zapisz jako path. Only visible, text-matched
  // controls are touched; no coordinate clicking, no external scripts.
  const excelClick=async()=>{
   const sleep=ms=>new Promise(r=>setTimeout(r,ms));
   const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/Ł/g,'L').toLowerCase().replace(/\s+/g,' ').trim();
   const controls=()=>Array.from(document.querySelectorAll('button,[role="button"],[role="menuitem"],[role="tab"],a,[aria-haspopup]')).filter(el=>{
    const r=el.getBoundingClientRect();return r.width>0&&r.height>0;
   });
   const label=el=>norm([el.innerText,el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-automationid')].filter(Boolean).join(' '));
   const match=words=>{
    const all=controls();
    // Exact text first: prevents "Utwórz kopię online" winning over "Utwórz kopię".
    return all.find(el=>words.some(w=>label(el)===w)) ||
           all.find(el=>words.some(w=>label(el).startsWith(w+' ')));
   };
   const waitFor=async(words,ms=5500)=>{
    const deadline=Date.now()+ms;
    while(Date.now()<deadline){const el=match(words);if(el)return el;await sleep(140);}
    return null;
   };
   const activate=async(el,openSubmenu=false)=>{
    el.scrollIntoView({block:'nearest'});
    if(openSubmenu){
     // Flyout submenus can be mouse-hover activated, rather than click activated.
     for(const type of ['pointerover','mouseover','mouseenter']){
      try{el.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,view:window}));}catch(_){}
     }
     await sleep(250);
    }
    el.click();
    await sleep(350);
   };
   try{
    const file=await waitFor(['plik','file'],4000);
    if(!file)return {ok:false,reason:'FILE_MENU_NOT_FOUND'};
    await activate(file);
    // Primary path matches the actual Polish screenshot. Keep legacy variants.
    let copy=await waitFor(['utworz kopie','create a copy','make a copy','zapisz jako','save as','zapisz kopie','save a copy']);
    if(!copy)return {ok:false,reason:'CREATE_COPY_MENU_NOT_FOUND'};
    await activate(copy,true);
    let download=await waitFor(['pobierz kopie','download a copy','download copy'],4500);
    if(!download){
     // Some Excel Online builds open the secondary menu only after hover.
     copy=match(['utworz kopie','create a copy','make a copy','zapisz jako','save as','zapisz kopie','save a copy']);
     if(copy){await activate(copy,true);download=await waitFor(['pobierz kopie','download a copy','download copy'],2500);}
    }
    if(!download)return {ok:false,reason:'DOWNLOAD_COPY_NOT_FOUND'};
    await activate(download);
    return {ok:true}; // A separate Downloads event must confirm actual completion.
   }catch(_){return {ok:false,reason:'EXCEL_UI_ERROR'};}
  };
  // An inaccessible Office iframe must not make the entire injection fail.
  // Try the workbook's main frame first; fall back to permitted subframes.
  let results=[],errors=[];
  try{results=await chrome.scripting.executeScript({target:{tabId},func:excelClick});}
  catch(e){errors.push('MAIN_FRAME_SCRIPT_BLOCKED');}
  if(results.some(x=>x.result?.ok))return {ok:true};
  const mainReasons=results.map(x=>x.result?.reason).filter(Boolean);
  try{
   const frames=await chrome.scripting.executeScript({target:{tabId,allFrames:true},func:excelClick});
   if(frames.some(x=>x.result?.ok))return {ok:true};
   results.push(...frames);
  }catch(e){errors.push('IFRAME_PERMISSION_OR_LOADING');}
  const reasons=[...new Set([...mainReasons,...results.map(x=>x.result?.reason).filter(Boolean),...errors])];
  return {ok:false,error:reasons.join(', ')||'EXCEL_UI_NOT_FOUND'};
 }
 chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  if(!['SP_MANUAL_START','SP_MANUAL_STATUS'].includes(msg?.type))return false;
  const fromApp=sender.id===chrome.runtime.id&&sender.tab?.url?.startsWith('https://horkiroman4408-cyber.github.io/Mr.-Robot-App/');
  if(sender.id!==chrome.runtime.id||(!fromApp&&sender.tab))return false;
  (async()=>{
   if(msg.type==='SP_MANUAL_STATUS')return {ok:true,job:await get()};
   const old=await get();
   // Only a real, fresh waiting/download job may be resumed. A previous
   // manual_required failure is NEVER an active download and must not block retry.
   if(validJob(old)){
    const age=Date.now()-old.started;
    if(old.state==='downloading')return {ok:true,state:'downloading',resumed:true};
    if(age<90000)return {ok:true,state:'waiting',resumed:true};
    await put({...old,state:'failed',error:'PREVIOUS_DOWNLOAD_TIMED_OUT',finished:Date.now()});
   }
   const link=(await chrome.storage.local.get(SOURCE))[SOURCE];
   if(!allowedUrl(link))throw Error('ZAPISZ_LINK_SHAREPOINT');
   if(!await chrome.permissions.contains({origins:['https://lppsa-my.sharepoint.com/*']}))throw Error('BRAK_ZGODY_SHAREPOINT');
   // Prefer the actual Excel editor tab: a sharing URL often redirects to a
   // different document pathname, so exact-path matching misses an open file.
   // Avoid touching a different workbook. Match a tab to the saved source by
   // URL, or by the known workbook title, and prefer the active tab.
   const tabs=await chrome.tabs.query({});
   const filename='grafik procesowy (godziny)';
   const isEditor=t=>{try{const h=new URL(t.url||'').hostname.toLowerCase();return h==='lppsa-my.sharepoint.com'||h.endsWith('.officeapps.live.com')||h.endsWith('.office.com')||h.endsWith('.office.net');}catch{return false;}};
   const source=new URL(link);
   const matching=t=>{
    if(!isEditor(t))return false;
    try{const u=new URL(t.url||'');if(u.hostname===source.hostname&&u.pathname===source.pathname)return true;}catch(_){}
    return String(t.title||'').toLowerCase().includes(filename);
   };
   const existing=tabs.filter(matching).sort((a,b)=>Number(b.active)-Number(a.active))[0];
   // Explicit button click permits opening the editor. A background tab may
   // never initialize the Excel menus, so open a missing document visibly.
   let tab=existing||await chrome.tabs.create({url:link,active:true});
   if(!existing){
    for(let i=0;i<50;i++){
     const t=await chrome.tabs.get(tab.id);if(t.status==='complete')break;
     await new Promise(r=>setTimeout(r,400));
    }
   }
   const job={state:'waiting',started:Date.now(),tabId:tab.id,filename:DEST};await put(job);
   let clicked;
   // Excel Online renders the menu after document navigation, not necessarily
   // when tab.status becomes complete. Retry readiness without touching a
   // different file or claiming that a download has completed.
   for(let attempt=0;attempt<4;attempt++){
    try{clicked=await tryClick(tab.id);}catch(e){clicked={ok:false,error:'SCRIPT_NOT_ALLOWED_OR_EXCEL_LOADING'};}
    if(clicked.ok)break;
    if(!['FILE_MENU_NOT_FOUND','EXCEL_UI_NOT_FOUND','SCRIPT_NOT_ALLOWED_OR_EXCEL_LOADING','IFRAME_PERMISSION_OR_LOADING','MAIN_FRAME_SCRIPT_BLOCKED'].some(x=>String(clicked.error).includes(x)))break;
    await new Promise(r=>setTimeout(r,1800));
   }
   if(!clicked.ok){
    await put({...job,state:'manual_required',error:clicked.error});
    await chrome.tabs.update(tab.id,{active:true});
    return {ok:false,error:'EXCEL_UI_MANUAL_DOWNLOAD_REQUIRED',detail:clicked.error,folder:DEST};
   }
   return {ok:true,state:'waiting',folder:DEST};
  })().then(respond).catch(e=>respond({ok:false,error:safe(e?.message||e)}));return true;
 });
})();
