/* Explicit user initiated operation. No background timer. */
'use strict';
(()=>{
 const start=document.getElementById('sp-manual-start');
 const status=document.getElementById('sp-manual-status');
 const result=document.getElementById('sp-manual-result');
 if(!start||!status||!result)return;
 const show=(message,ok)=>{result.textContent=message;result.className='status '+(ok?'success':'error');};
 start.addEventListener('click',async()=>{
  start.disabled=true;show('Otwieram Excel Online i próbuję pobrać kopię…',true);
  try{
   // Additional permissions only on direct user action.
   const approved=await chrome.permissions.request({origins:['https://lppsa-my.sharepoint.com/*','https://*.officeapps.live.com/*','https://*.office.com/*','https://*.office.net/*']});
   if(!approved){show('Brak zgody na dostęp do Excel Online.',false);return;}
   const r=await chrome.runtime.sendMessage({type:'SP_MANUAL_START'});
   show(r?.ok?'Polecenie wysłane. Kliknij Sprawdź wynik po zakończeniu pobierania.':'Nie udało się kliknąć menu automatycznie. Otworzono Excel. Wybierz Plik → Utwórz kopię → Pobierz kopię. '+(r?.detail||r?.error||''),!!r?.ok);
  }catch(e){show(String(e?.message||e),false);}finally{start.disabled=false;}
 });
 status.addEventListener('click',async()=>{
  try{
   const r=await chrome.runtime.sendMessage({type:'SP_MANUAL_STATUS'});const j=r?.job;
   show(!j?'Brak pobierania.':j.state==='complete'?'OK: XLSX zapisany w Downloads/MrRobot/SharePoint.':j.state==='downloading'?'Trwa pobieranie XLSX…':j.state==='waiting'?'Czekam na rozpoczęcie pobierania…':j.state==='manual_required'?'Potrzebne ręczne Pobierz kopię. Wynik tego testu jeszcze nie tworzy odświeżenia Obsada.':'Stan: '+j.state, j?.state==='complete');
  }catch(e){show(String(e?.message||e),false);}
 });
})();
