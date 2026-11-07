'use strict';
// Does not read cookies, credentials or report data.
(function(){
  // Avoid duplicate listeners when manifest injection and on-demand injection meet.
  if(window.__MR_OR_WMS_CONTENT_022__)return;
  window.__MR_OR_WMS_CONTENT_022__=true;
  let busy=false;
  const waitingSince=new Map();
  const recentClicks=new Map();
  const visible = e => e && e.getClientRects().length>0;
  const clean = s => String(s||'').replace(/\s+/g,' ').trim();
  const label = e => clean(e?.textContent||e?.value||'');
  const click = e => { e.scrollIntoView({block:'center'});e.click(); };
  // OpenReports starts at Reports → Groups → ECM_Warehouse → report list.
  // Locate links by their visible labels, never by hard-coded action URLs.
  const findLink = name => [...document.querySelectorAll('a')]
    .find(a=>visible(a) && label(a).toLowerCase()===name.toLowerCase());
  const groupLink = report => findLink(report?.startsWith('kpi_')?'ECM_KPI':'ECM_Warehouse');
  const groupName = report => report?.startsWith('kpi_')?'ECM_KPI':'ECM_Warehouse';
  const REPORTS={ai_audyt:'ECM_AI_Audit',godziny_mdt:'ECM_STOCK_Items_after_receiving',stock:'ECM_PICK_Lacks_during_picking',mp_baza:'ECM_STOCK_MP_and_on_the_floor',kpi_audit:'Audit_ECM_KPI',kpi_scalanie:'Pick_ECM_KPI'};
  const reportLink = name => findLink(name);
  const button = name => [...document.querySelectorAll('button,input[type="submit"],input[type="button"],a')].find(e=>visible(e)&&label(e).toLowerCase()===name.toLowerCase());
  function setValue(element,value){
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter)setter.call(element,value);else element.value=value;
    element.dispatchEvent(new Event('input',{bubbles:true}));
    element.dispatchEvent(new Event('change',{bubbles:true}));
  }
  async function update(job,message){
    const res=await chrome.runtime.sendMessage({type:'MR_STEP',jobId:job.jobId,step:job.step,message});
    if(!res?.ok)throw Error(res?.error||'Błąd synchronizacji');
    // An old page may report a stage after navigation already moved on.
    // Never click another page button when the callback is stale.
    return !res.stale;
  }
  // If a job starts while the Groups page is already open, advancing the step
  // does not navigate; schedule an explicit retry after leaving the busy state.
  function retry(delay=350){setTimeout(()=>chrome.runtime.sendMessage({type:'MR_READY'}).catch(()=>{}),delay);}
  function waitForPage(job, message){
    const key=job.step;
    if(!waitingSince.has(key))waitingSince.set(key,Date.now());
    if(Date.now()-waitingSince.get(key)>12000)throw Error(message);
    retry(500);
  }
  function advanced(step){waitingSince.delete(step);}
  function clickAndRetry(element){
    click(element);
    // Supports asynchronous same-page navigation in addition to full reloads.
    retry(550);
  }
  async function execute(job){
    if(busy)return;busy=true;
    try{
      const title=clean(document.body?.innerText||document.body?.textContent||'').slice(0,30000);
      const report=REPORTS[job.report||'ai_audyt'];
      if(!report)throw Error('Nieznany raport OpenReports.');
      // Login/SSO may take several minutes. Wait without touching credentials.
      const loginVisible = /not currently logged into the system/i.test(title) ||
        !!document.querySelector('input[type="password"]') ||
        (/log\s?in|sign\s?in|zaloguj/i.test(title.slice(0,1200))&&!button('Reports')&&!groupLink(job.report));
      if(job.step==='open-reports' && loginVisible){
        await chrome.runtime.sendMessage({type:'MR_WAIT_LOGIN',jobId:job.jobId});
        retry(2500);return;
      }
      if(job.step==='open-reports'){
        // When the browser is already on Groups, avoid an unnecessary round trip.
        // Otherwise always go via the top-level Reports navigation, regardless
        // of whether the current page is Export Options, parameters or a list.
        if(groupLink(job.report)){
          if(!await update(job,'Wybieram grupę '+groupName(job.report)+'…'))return;
          advanced(job.step);retry();
          return;
        }
        const reports=button('Reports');
        if(!reports){
          // No Reports UI: treat as awaiting login/SSO rather than failing early.
          // The background enforces a bounded 15-minute wait and allows cancel.
          await chrome.runtime.sendMessage({type:'MR_WAIT_LOGIN',jobId:job.jobId});
          retry(2500);return;
        }
        if(!await update(job,'Otwieram Reports → Groups…'))return;
        advanced(job.step);clickAndRetry(reports);
        return;
      }
      if(job.step==='open-group'){
        const group=groupLink(job.report);
        if(!group){
          // Old page may still be loading or the Groups view may be updated by JS.
          if(reportLink(report)){
            if(!await update(job,'Raport znaleziony. Otwieram…'))return;
            advanced(job.step);retry();return;
          }
          waitForPage(job,'Nie znaleziono '+groupName(job.report)+'. Wejdź w Reports → Groups i sprawdź dostęp.');
          return;
        }
        if(!await update(job,'Otwieram grupę '+groupName(job.report)+'…'))return;
        advanced(job.step);clickAndRetry(group);
        return;
      }
      if(job.step==='find-report'){
        const link=reportLink(report);
        if(!link){
          waitForPage(job,'Nie znaleziono '+report+' w grupie '+groupName(job.report)+'. Sprawdź uprawnienia.');
          return;
        }
        if(!await update(job,'Otwieram parametry '+report+'…'))return;
        advanced(job.step);recentClicks.set(report,Date.now());clickAndRetry(link);
        return;
      }
      if(job.step==='fill-parameters'){
        const inputs=[...document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="radio"]):not([type="checkbox"])')].filter(visible);
        // OpenReports versions sometimes render the parameter heading differently.
        // Recognize it by BOTH the report title and the date field labels, never
        // by two arbitrary text inputs alone (prevents submitting a wrong form).
        const dates=inputs.filter(i=>i.type==='text'||i.type==='datetime-local');
        const namedForm=new RegExp('Parameters\\s+for\\s*:\\s*'+report,'i').test(title);
        const dateLabels=/\bDate\s+from\b\s*:?/i.test(title) && (job.report==='stock'||/\bDate\s+to\b\s*:?/i.test(title));
        const isParameterForm=(namedForm||(dateLabels&&!/Parameters\s+for\s*:/i.test(title)))&&!!button('Ok');
        if(!isParameterForm){
          // Some OpenReports navigation updates the report list asynchronously.
          // If the report link is STILL visible, repeat the standard click rather
          // than waiting until the job times out on the list screen.
          const link=reportLink(report);
          if(link && (Date.now()-(recentClicks.get(report)||0)>2000)){
            recentClicks.set(report,Date.now());
            clickAndRetry(link);
            return;
          }
          const page=clean(document.title||'').slice(0,80);
          const path=String(location.pathname||'').slice(0,150);
          const hint=link?'Lista raportów nadal widoczna.':'Brak listy raportów na tej stronie.';
          waitForPage(job,`Nie znaleziono formularza parametrów ${report}. ${hint} Strona: ${page||'(bez tytułu)'} ${path}.`);
          return;
        }
        if(job.report==='mp_baza'){
          // Only the explicitly identified Baza MP parameter form is permitted.
          if(!namedForm||!button('Ok'))throw Error('Nie rozpoznano formularza Baza MP.');
          const selects=[...document.querySelectorAll('select')].filter(visible);
          if(selects.length!==2 || dates.length!==1)
            throw Error('Nieznany układ parametrów Baza MP. Nie uruchomiono raportu.');
          const source=selects.find(sel=>[...sel.options].some(o=>clean(o.textContent||o.text)==='WMS ECM REPL PODKARPACIE'));
          const brands=['(None)','HOUSE','SINSAY','CROPP','MOHITO','RESERVED'];
          const brandSelect=selects.find(sel=>sel!==source&&brands.every(b=>[...sel.options].some(o=>clean(o.textContent||o.text)===b)));
          const areaInput=dates[0];
          if(!source||!brandSelect||!areaInput||!/^MP(?:[123])?\*$/.test(job.area||'')||!['','HOUSE','SINSAY','CROPP','MOHITO','RESERVED'].includes(job.brand))
            throw Error('Nieprawidłowe pola lub parametry Baza MP.');
          const srcOpt=[...source.options].find(o=>clean(o.textContent||o.text)==='WMS ECM REPL PODKARPACIE');
          const brandLabel=job.brand||'(None)';
          const brandOption=[...brandSelect.options].find(o=>clean(o.textContent||o.text)===brandLabel);
          if(!srcOpt||!brandOption)throw Error('Brak żądanego Data Source lub marki.');
          source.value=srcOpt.value;source.dispatchEvent(new Event('change',{bubbles:true}));
          // OpenReports uses SQL-style % wildcard, not the * used in saved Bridge values.
          // Leave persisted MP area identifiers unchanged for backward compatibility.
          setValue(areaInput,job.area.slice(0,-1)+'%');
          brandSelect.value=brandOption.value;brandSelect.dispatchEvent(new Event('change',{bubbles:true}));
        }else if(job.report==='stock'){
          // STOCK: one day only, no time and no Date to. Verify the exact source.
          if(!/\bDate\s+from\b\s*:?/i.test(title)||/\bDate\s+to\b\s*:?/i.test(title))
            throw Error('Nieprawidłowy formularz STOCK: wymagane tylko Date from.');
          const source=[...document.querySelectorAll('select')].find(s=>visible(s)&&[...s.options].some(o=>clean(o.textContent||o.text)==='WMS ECM PODKARPACIE Prod'));
          if(!source)throw Error('Brak Data Source: WMS ECM PODKARPACIE Prod.');
          const option=[...source.options].find(o=>clean(o.textContent||o.text)==='WMS ECM PODKARPACIE Prod');
          source.value=option.value;source.dispatchEvent(new Event('change',{bubbles:true}));
          if(dates.length!==1)throw Error('Nieznany układ pól raportu STOCK ('+dates.length+').');
          setValue(dates[0],job.from.slice(0,10));
        }else if(job.report==='kpi_audit'||job.report==='kpi_scalanie'){
          // Only submit the exact KPI form; fail closed if the corporate layout changes.
          if(!namedForm || dates.length!==2 || !/\bDate\s+from\b/i.test(title) || !/\bDate\s+to\b/i.test(title))
            throw Error('Nie rozpoznano pól dat raportu KPI. Nie uruchomiono raportu.');
          const selects=[...document.querySelectorAll('select')].filter(visible);
          const source=selects.find(sel=>[...sel.options].some(o=>clean(o.textContent||o.text)==='WMS ECM REPL PODKARPACIE'));
          if(!source)throw Error('Brak Data Source: WMS ECM REPL PODKARPACIE.');
          const sourceOpt=[...source.options].find(o=>clean(o.textContent||o.text)==='WMS ECM REPL PODKARPACIE');
          if(job.report==='kpi_scalanie'){
            if(selects.length!==2 || !/Select\s+pick\s+type/i.test(title))
              throw Error('Nie rozpoznano pola Select pick type dla KPI Scalanie.');
            const pick=selects.find(sel=>sel!==source && [...sel.options].some(o=>clean(o.textContent||o.text)==='Pick Scal'));
            if(!pick)throw Error('Brak opcji Pick Scal w raporcie KPI Scalanie.');
            const option=[...pick.options].find(o=>clean(o.textContent||o.text)==='Pick Scal');
            pick.value=option.value;pick.dispatchEvent(new Event('change',{bubbles:true}));
          }else if(selects.length!==1){
            throw Error('Nieznane dodatkowe parametry KPI Audyt.');
          }
          source.value=sourceOpt.value;source.dispatchEvent(new Event('change',{bubbles:true}));
          setValue(dates[0],job.from);setValue(dates[1],job.to);
        }else if(job.report==='godziny_mdt'){
          // MDT form: Data Source (required), Date from, Date to, EAN, Location.
          // The last two filters are optional and must remain empty.
          if(!/\bEAN\b/i.test(title)||!/\bLocation\b/i.test(title))
            throw Error('Brak pól EAN / Location w formularzu MDT. Nie uruchomiono raportu.');
          const source=[...document.querySelectorAll('select')]
            .find(sel=>[...sel.options].some(o=>clean(o.textContent||o.text)==='WMS ECM REPL PODKARPACIE'));
          if(!source)throw Error('Brak Data Source: WMS ECM REPL PODKARPACIE.');
          const repl=[...source.options].find(o=>clean(o.textContent||o.text)==='WMS ECM REPL PODKARPACIE');
          source.value=repl.value;source.dispatchEvent(new Event('change',{bubbles:true}));
          // Prefer a single field in a labeled table row. Fall back to the
          // four-field layout verified by the provided OpenReports screenshot.
          function byRow(labelPattern){
            const row=[...document.querySelectorAll('tr')].find(tr=>{
              const text=clean(tr.textContent);
              const available=[...tr.querySelectorAll('input')].filter(i=>dates.includes(i));
              return labelPattern.test(text)&&available.length===1;
            });
            return row?[...row.querySelectorAll('input')].find(i=>dates.includes(i)):null;
          }
          let from=byRow(/^Date\s+from\s*:/i),to=byRow(/^Date\s+to\s*:/i),
              ean=byRow(/^EAN\s*$/i),location=byRow(/^Location\s*$/i);
          if(!from||!to||!ean||!location){
            if(dates.length!==4)throw Error('Nieznany układ pól raportu MDT ('+dates.length+').');
            [from,to,ean,location]=dates;
          }
          if(new Set([from,to,ean,location]).size!==4)throw Error('Nie można rozpoznać pól MDT.');
          setValue(from,job.from);setValue(to,job.to);
          setValue(ean,'');setValue(location,'');
        }else{
          if(dates.length!==2)throw Error('Nieznany układ pól dat ('+dates.length+'). Nie wpisano parametrów.');
          setValue(dates[0],job.from);setValue(dates[1],job.to);
        }
        const submit=button('Ok');if(!submit)throw Error('Nie znaleziono przycisku Ok.');
        if(!await update(job,'Zapisuję okres raportu…'))return;advanced(job.step);clickAndRetry(submit);return;
      }
      if(job.step==='export'){
        if(!new RegExp('Export Options for:\\s*'+report,'i').test(title)){
          waitForPage(job,'Nie znaleziono opcji eksportu '+report+'.');
          return;
        }
        const selected=[...document.querySelectorAll('input[type="radio"]')].find(r=>r.checked);
        // Confirm selected radio corresponds to XLSX; reject ambiguous layouts.
        const xlsxRadio=[...document.querySelectorAll('input[type="radio"]')].find(r=>/xlsx/i.test(label(r.closest('label')))||/xlsx/i.test(clean(r.parentElement?.textContent)));
        if(!xlsxRadio)throw Error('Nie rozpoznano opcji XLSX.');
        if(!xlsxRadio.checked)xlsxRadio.click();
        const selects=[...document.querySelectorAll('select')].filter(visible);
        if(selects.length!==1)throw Error('Nie rozpoznano metody dostarczenia.');
        const runOpt=[...selects[0].options].find(o=>/Open in Browser/i.test(o.text));
        if(!runOpt)throw Error('Brak metody Open in Browser.');
        selects[0].value=runOpt.value;selects[0].dispatchEvent(new Event('change',{bubbles:true}));
        const executeButton=button('Execute Now');if(!executeButton)throw Error('Nie znaleziono Execute Now.');
        if(!await update(job,'Generuję plik XLSX…'))return;advanced(job.step);click(executeButton);return;
      }
    }catch(e){await chrome.runtime.sendMessage({type:'MR_ERROR',jobId:job.jobId,step:job.step,message:e.message||'Nieznany błąd'});}
    finally{busy=false;}
  }
  chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
    if(message?.type==='MR_PROCESS') {execute(message);sendResponse({ok:true});}
  });
  chrome.runtime.sendMessage({type:'MR_READY'}).catch(()=>{});
})();
