'use strict';
// Extension-only integration. Does not modify Mr. Robot source or its Excel parser.
// The downloaded XLSX stays on the user's computer; File System Access is read-only.
(() => {
  if (window.__mrOpenReportsContentReady) return;
  window.__mrOpenReportsContentReady = true;

  // Passive availability signal for Mr. Robot UI (no credentials or report data).
  // Readable DOM marker is for display only, never authorization.
  const bridgeVersion = '0.2.8';
  function announceBridge(){
    document.documentElement.dataset.mrOpenreportsBridge = bridgeVersion;
    document.dispatchEvent(new CustomEvent('mr-openreports-bridge-ready',{detail:{version:bridgeVersion}}));
  }
  announceBridge();
  document.addEventListener('mr-openreports-bridge-query',announceBridge);


  const I = globalThis.MRBridgeI18n;
  const lang = () => I.normalize(document.documentElement.lang);
  const tt = (key, vars={}) => I.t(key, lang(), vars);
  const DB_NAME = 'mr-openreports-bridge-v1';
  const EXPECTED_FOLDER = 'Downloads/MrRobot/OpenReports';
  const REPORTS = Object.freeze({
    ai_audyt: {name:'ECM_AI_Audit',label:'ECM_AI_Audit.xlsx',module:'AL_AUDYT / FORMATKA_59'},
    godziny_mdt: {name:'ECM_STOCK_Items_after_receiving',label:'ECM_STOCK_Items_after_receiving.xlsx',module:'GODZINY_MDT'}
  });
  let selectedReport = 'ai_audyt';
  const MAX_FILE_BYTES = 160 * 1024 * 1024;
  const allowedFolder = h => !!h && String(h.name||'').toLowerCase()==='openreports';
  let modal, msg, dirName, pickButton, importButton, startButton, closeButton;
  let handle = null;
  let currentJobId = null;
  let seenDownload = false;
  let importBusy = false;
  let opening = false;
  let lastNotice = null;

  const $ = id => document.getElementById(id);
  const validName = (name, report) => {
    const reportName=REPORTS[report]?.name?.toLowerCase();
    if(!reportName)return false;
    const n=String(name||'').toLowerCase();
    return n===reportName+'.xlsx'||(n.startsWith(reportName+'_')&&n.endsWith('.xlsx'));
  };
  const localDate = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  const tryMessage = async (type, data = {}) => {
    const response = await chrome.runtime.sendMessage({type, ...data});
    if (!response?.ok) throw new Error(response?.error || tt('connectionError'));
    return response;
  };

  function notice(text, type = 'info') {
    if (!msg) return;
    lastNotice={text, type};
    msg.textContent = I.status(text,lang());
    msg.dataset.kind = type;
  }
  function noticeKey(key, vars={}, type='info') {
    if (!msg) return;
    lastNotice={key,vars,type};
    msg.textContent=tt(key,vars);
    msg.dataset.kind=type;
  }
  function buttonBusy(busy) {
    if (startButton) startButton.disabled = !!busy;
  }

  // Exact existing upload control discovered in Mr. Robot v3.17.0.
  // Vue's @change="audytOnFile" handler remains the only import path.
  function findInput(report) {
    for (const bar of document.querySelectorAll('.grafik-bar')) {
      const exactLabel = [...bar.querySelectorAll('span')]
        .some(span => span.textContent?.trim() === REPORTS[report]?.label);
      if (!exactLabel) continue;
      const input = bar.querySelector('input[type="file"][accept*=".xlsx"]');
      if (input) return {bar, input};
    }
    return null;
  }
  function mountButton() {
    for(const [key,config] of Object.entries(REPORTS)){
      const target=findInput(key);
      if(!target)continue;
      const existing=target.bar.querySelector('.mr-or-trigger[data-report="'+key+'"]');
      if(existing){ existing.textContent=tt('trigger');existing.title=tt('triggerTitle',{report:config.name,module:config.module});continue; }
      const trigger=document.createElement('button');
      trigger.type='button';trigger.className='mr-or-trigger';trigger.dataset.report=key;
      trigger.textContent=tt('trigger');
      trigger.title=tt('triggerTitle',{report:config.name,module:config.module});
      trigger.addEventListener('click',()=>openModal(key));
      const originalLabel=target.input.closest('label');
      if(originalLabel)originalLabel.insertAdjacentElement('afterend',trigger);
      else target.bar.append(trigger);
    }
  }
  function injectStyle() {
    if ($('mr-or-style')) return;
    const style = document.createElement('style');
    style.id = 'mr-or-style';
    style.textContent = `
      .mr-or-trigger{appearance:none;border:1px solid #a1a1aa;border-radius:11px;padding:9px 13px;
      font:600 12px/1.3 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--text-primary,#23272f);
      background:var(--card-bg,#fff);white-space:nowrap;cursor:pointer;transition:filter .15s}
      .mr-or-trigger:hover{filter:brightness(.94)}
      #mr-or-overlay{position:fixed;inset:0;z-index:2147483644;display:none;align-items:center;
      justify-content:center;padding:16px;background:rgba(12,18,27,.54);font-family:system-ui,-apple-system,Segoe UI,sans-serif}
      #mr-or-overlay[aria-hidden="false"]{display:flex}
      #mr-or-panel{width:min(100%,450px);max-height:min(90vh,700px);overflow-y:auto;box-sizing:border-box;
      border-radius:19px;background:#fff;color:#20252e;box-shadow:0 25px 90px rgba(0,0,0,.3);padding:23px;
      border:1px solid #e2e5ec}
      #mr-or-panel *{box-sizing:border-box}
      #mr-or-panel h2{margin:0;font-size:18px;font-weight:750}
      #mr-or-panel .mr-or-sub{font-size:12px;line-height:1.6;color:#64748b;margin:6px 0 18px}
      #mr-or-panel .mr-or-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:10px;margin:12px 0}
      #mr-or-panel label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;color:#475569}
      #mr-or-panel input{width:100%;border:1px solid #d7dbe3;border-radius:9px;padding:10px;
      color:#1e293b;background:#fff;font-size:13px;min-height:40px}
      #mr-or-panel button{border-radius:10px;cursor:pointer;padding:10px 13px;font-size:12px;font-weight:700}
      #mr-or-panel button:disabled{opacity:.5;cursor:wait}
      #mr-or-panel .mr-or-primary{background:#242b36;color:#fff;border:1px solid #242b36;width:100%;margin-top:12px}
      #mr-or-panel .mr-or-outline{background:#fff;color:#303947;border:1px solid #c8cdd6}
      #mr-or-panel .mr-or-close{padding:5px 8px;background:transparent;border:0;font-size:20px}
      #mr-or-panel .mr-or-status{font-size:12px;line-height:1.6;border-radius:10px;background:#f3f5f8;
      color:#455365;margin-top:12px;padding:11px 12px;white-space:pre-wrap;overflow-wrap:anywhere}
      #mr-or-panel .mr-or-status[data-kind="error"]{background:#fff0f0;color:#b91c1c}
      #mr-or-panel .mr-or-status[data-kind="success"]{background:#edfdf3;color:#166534}
      #mr-or-panel .mr-or-help{font-size:11px;line-height:1.55;color:#7a8494;margin-top:9px}
      #mr-or-panel .mr-or-folder{font-size:11px;color:#506176;margin:6px 0 9px;overflow-wrap:anywhere}
    `;
    document.head.append(style);
  }
  function createModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'mr-or-overlay';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div id="mr-or-panel" role="dialog" aria-modal="true" aria-labelledby="mr-or-heading">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <h2 id="mr-or-heading">OpenReports</h2>
          <button class="mr-or-close" id="mr-or-close" type="button" data-mr-aria="close" aria-label="Zamknij">×</button>
        </div>
        <p class="mr-or-sub" id="mr-or-description"></p>
        <div class="mr-or-grid"><label><span data-mr-tr="dateFrom">Data od</span><input type="date" id="mr-or-from-date"></label>
          <label><span data-mr-tr="timeFrom">Godzina od</span><input type="time" id="mr-or-from-time" step="1"></label></div>
        <div class="mr-or-grid"><label><span data-mr-tr="dateTo">Data do</span><input type="date" id="mr-or-to-date"></label>
          <label><span data-mr-tr="timeTo">Godzina do</span><input type="time" id="mr-or-to-time" step="1"></label></div>
        <button id="mr-or-start" class="mr-or-primary" type="button" data-mr-tr="start">↓ Pobierz z OpenReports</button>
        <div class="mr-or-status" id="mr-or-status" role="status" aria-live="polite"></div>
        <div style="height:1px;background:#e4e8ee;margin:16px 0 12px"></div>
        <div style="font-size:12px;font-weight:700" data-mr-tr="autoImport">Automatyczny import lokalnego XLSX</div>
        <p class="mr-or-folder" id="mr-or-dir-name"></p>
        <div style="display:flex;flex-wrap:wrap;gap:7px">
          <button id="mr-or-pick" class="mr-or-outline" type="button" data-mr-tr="pickFolder">📁 Wybierz folder</button>
          <button id="mr-or-import" class="mr-or-outline" type="button" data-mr-tr="importLast">Wczytaj ostatni pasujący XLSX</button>
        </div>
        <div class="mr-or-help" data-mr-html="help"></div>
      </div>`;
    document.body.append(modal);
    msg = $('mr-or-status');
    dirName = $('mr-or-dir-name');
    pickButton = $('mr-or-pick');
    importButton = $('mr-or-import');
    startButton = $('mr-or-start');
    closeButton = $('mr-or-close');
    const now = new Date();
    const prev = new Date(now); prev.setDate(prev.getDate()-1);
    $('mr-or-from-date').value = localDate(prev);
    $('mr-or-to-date').value = localDate(now);
    $('mr-or-from-time').value = '00:00:00';
    $('mr-or-to-time').value = '23:59:59';
    I.apply(modal,lang());
    noticeKey('ready');
    dirName.textContent=tt('noFolder');
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', event => {if(event.target===modal)closeModal();});
    document.addEventListener('keydown', e => {if(e.key==='Escape' && modal.getAttribute('aria-hidden')==='false')closeModal();});
    pickButton.addEventListener('click', pickFolder);
    importButton.addEventListener('click', () => importLatest(true));
    startButton.addEventListener('click', startReport);
  }
  function closeModal() {if(modal)modal.setAttribute('aria-hidden','true');}
  async function openModal(report='ai_audyt') {
    selectedReport=REPORTS[report]?report:'ai_audyt';
    injectStyle(); createModal();
    const config=REPORTS[selectedReport];
    $('mr-or-heading').textContent='OpenReports · '+config.name;
    $('mr-or-description').textContent=tt('choosePeriod',{module:config.module})+
      (selectedReport==='godziny_mdt'?tt('mdtHint'):'');
    modal.setAttribute('aria-hidden','false');
    if(opening)return;
    opening = true;
    try {
      handle = handle || await getStoredHandle();
      await updateFolderStatus();
    } catch(e) {noticeKey('folderProblem',{reason:e.message},'error');}
    finally {opening=false;}
  }

  function dbOpen() {
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>req.result.createObjectStore('handles');
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function stored(action, value) {
    const db=await dbOpen();
    try {
      return await new Promise((resolve,reject)=>{
        const transaction=db.transaction('handles', action==='get'?'readonly':'readwrite');
        const store=transaction.objectStore('handles');
        const req=action==='get'?store.get('folder'):store.put(value,'folder');
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
      });
    } finally {db.close();}
  }
  const getStoredHandle=()=>stored('get');
  async function updateFolderStatus() {
    if (!dirName) return;
    if(!handle){dirName.textContent=tt('folderUnset',{folder:EXPECTED_FOLDER});return;}
    if(!allowedFolder(handle)){dirName.textContent=tt('folderWrong',{folder:EXPECTED_FOLDER});return;}
    const permission=await handle.queryPermission({mode:'read'});
    dirName.textContent=handle.name+' · '+(permission==='granted'?tt('folderGranted'):tt('folderExpired'));
  }
  async function pickFolder() {
    if(typeof window.showDirectoryPicker!=='function') {
      noticeKey('pickerUnavailable',{},'error');return;
    }
    try {
      // Must be called directly from this user click, before any await.
      const selected=await window.showDirectoryPicker({startIn:'downloads',mode:'read'});
      if(!allowedFolder(selected))throw Error(tt('pickerWrong'));
      handle=selected;
      await stored('set',handle);
      await updateFolderStatus();
      noticeKey('folderLinked',{},'success');
      const {job}=await tryMessage('MR_STATUS');
      if(job?.state==='done' && job.report===selectedReport && validName(job.downloadFilename,job.report))await importLatest(false,selectedReport);
    } catch(e) {
      if(e?.name==='AbortError')return;
      noticeKey('pickerError',{reason:e.message||e},'error');
    }
  }
  async function startReport() {
    try {
      const d1=$('mr-or-from-date').value,d2=$('mr-or-to-date').value;
      const t1=$('mr-or-from-time').value,t2=$('mr-or-to-time').value;
      if(!d1||!d2||!/^\d{2}:\d{2}:\d{2}$/.test(t1)||!/^\d{2}:\d{2}:\d{2}$/.test(t2))
        throw Error(tt('badTime'));
      const from=`${d1} ${t1}`,to=`${d2} ${t2}`;
      if(from>to)throw Error(tt('badPeriod'));
      buttonBusy(true);
      noticeKey('launching');
      const result=await tryMessage('MR_START_FROM_APP',{from,to,report:selectedReport});
      currentJobId=result.jobId;
      seenDownload=false;
      noticeKey('started');
    } catch(e) { buttonBusy(false); notice(e.message||String(e),'error'); }
  }

  // Manual import: read ONLY XLSX names matching the selected module, then
  // choose the newest matching file. Never import a random/last browser download.
  async function newestMatchingFile(directory, targetReport) {
    let selected=null;
    for await (const entry of directory.values()) {
      if(entry.kind!=='file'||!validName(entry.name,targetReport))continue;
      const candidate=await entry.getFile();
      if(candidate.size===0||candidate.size>MAX_FILE_BYTES)continue;
      if(!selected || candidate.lastModified>selected.lastModified ||
         (candidate.lastModified===selected.lastModified && candidate.name>selected.name)){
        selected=candidate;
      }
    }
    if(!selected)throw Error(tt('noMatch',{report:REPORTS[targetReport].name}));
    return selected;
  }

  async function importLatest(canPrompt, targetReport=selectedReport) {
    if(importBusy)return;
    importBusy=true;
    try {
      if(!handle)handle=await getStoredHandle();
      if(!handle)throw Error(tt('chooseFolder',{folder:EXPECTED_FOLDER}));
      if(!allowedFolder(handle))throw Error(tt('folderWrong',{folder:EXPECTED_FOLDER}));
      const perm=await handle.queryPermission({mode:'read'});
      if(perm!=='granted'){
        if(!canPrompt)throw Error(tt('staleFolder'));
        // This branch is reached only after an actual user click.
        const result=await handle.requestPermission({mode:'read'});
        if(result!=='granted')throw Error(tt('noPermission'));
      }
      const found=findInput(targetReport);
      if(!found)throw Error(tt('openModule',{module:REPORTS[targetReport].module}));
      if(found.input.disabled)throw Error(tt('waitImport'));

      let file;
      if(canPrompt){
        // Explicit "load latest matching" action: safe even when the previous
        // completed job was a different report. Never mix the two report types.
        file=await newestMatchingFile(handle,targetReport);
      }else{
        // Automatic import: use EXACT name from the current verified Edge
        // download, never silently substitute an older matching file.
        const {job}=await tryMessage('MR_STATUS');
        if(job?.state!=='done'||job.report!==targetReport||!job.inDedicatedFolder||
           !validName(job.downloadFilename,targetReport))
          throw Error(tt('noRecent',{report:REPORTS[targetReport].name,folder:EXPECTED_FOLDER}));
        let fileHandle;
        try{fileHandle=await handle.getFileHandle(job.downloadFilename);}
        catch(e){if(e.name==='NotFoundError')throw Error(tt('fileNotFound',{name:job.downloadFilename,folder:EXPECTED_FOLDER}));throw e;}
        file=await fileHandle.getFile();
      }
      if(!validName(file.name,targetReport)||file.size===0||file.size>MAX_FILE_BYTES)
        throw Error(tt('badFile'));
      const magic=new Uint8Array(await file.slice(0,4).arrayBuffer());
      if(magic[0]!==0x50||magic[1]!==0x4b)throw Error(tt('badZip'));
      // Reuse the same native Vue handler as manual file selection.
      const dt=new DataTransfer();dt.items.add(file);
      found.input.files=dt.files;
      found.input.dispatchEvent(new Event('change',{bubbles:true}));
      noticeKey('imported',{name:file.name,module:REPORTS[targetReport].module},'success');
      await updateFolderStatus();
    } catch(e) {notice(e.message||String(e),'error');}
    finally {importBusy=false;}
  }
  let periodicRunning=false;
  async function poll() {
    if(periodicRunning || !currentJobId)return;
    periodicRunning=true;
    try {
      const {job}=await tryMessage('MR_STATUS');
      if(job?.jobId!==currentJobId)return;
      if(job.state==='running')notice(job.message||tt('serverPreparing'));
      if(job.state==='error'||job.state==='cancelled'){
        notice(job.message||tt('failed'),'error');
        currentJobId=null;buttonBusy(false);
      }
      if(job.state==='done'&&!seenDownload){
        seenDownload=true;currentJobId=null;buttonBusy(false);
        if(job.inDedicatedFolder){
          if(!handle)handle=await getStoredHandle();
          if(handle && await handle.queryPermission({mode:'read'})==='granted')await importLatest(false,job.report);
          else noticeKey('folderForImport',{folder:EXPECTED_FOLDER});
        } else {
          noticeKey('outsideFolder',{folder:EXPECTED_FOLDER});
        }
      }
    }catch(e){noticeKey('syncError',{reason:e.message},'error');}
    finally {periodicRunning=false;}
  }
  function initialize() {
    injectStyle();
    mountButton();
    // Keeps the button after navigating between Vue views, without modifying Vue components.
    setInterval(mountButton,1500);
    // Mr. Robot sets <html lang> whenever its own language changes.
    // Read only that DOM attribute (the extension runs in an isolated world).
    const syncLanguage=()=>{
      const l=lang();
      chrome.storage.local.set({mrBridgeLanguage:l}).catch(()=>{});
      mountButton();
      if(modal){
        I.apply(modal,l);
        const config=REPORTS[selectedReport];
        $('mr-or-description').textContent=tt('choosePeriod',{module:config.module})+(selectedReport==='godziny_mdt'?tt('mdtHint'):'');
        if(lastNotice){
          if(lastNotice.key)noticeKey(lastNotice.key,lastNotice.vars,lastNotice.type);
          else notice(lastNotice.text,lastNotice.type);
        }
        updateFolderStatus().catch(()=>{});
      }
    };
    syncLanguage();
    new MutationObserver(syncLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    setInterval(poll,1300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
