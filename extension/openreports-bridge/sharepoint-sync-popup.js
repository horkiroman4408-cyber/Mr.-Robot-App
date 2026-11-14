/* SharePoint source controls: save, replace, delete. The link is stored in extension storage only. */
'use strict';
(()=>{
 const input=document.getElementById('sp-link'),status=document.getElementById('sp-sync-status');
 const save=document.getElementById('sp-save-source'),remove=document.getElementById('sp-clear-source');
 if(!input||!status||!save||!remove)return;
 const set=(value,ok)=>{status.textContent=value;status.className='status '+(ok?'success':'error');};
 async function permission(){return chrome.permissions.request({origins:['https://lppsa-my.sharepoint.com/*']});}
 save.addEventListener('click',async()=>{
  const url=input.value.trim();if(!url){set('Wklej link SharePoint.',false);return;}
  try{if(!await permission()){set('Nie przyznano dostępu do SharePoint.',false);return;}
   const r=await chrome.runtime.sendMessage({type:'SP_SYNC_SET_SOURCE',url});set(r?.ok?'Źródło zapisane.':('Nie zapisano: '+r?.error),!!r?.ok);
  }catch(e){set('Błąd: '+e.message,false);}
 });
 remove.addEventListener('click',async()=>{
  try{const r=await chrome.runtime.sendMessage({type:'SP_SYNC_CLEAR_SOURCE'});if(r?.ok){input.value='';set('Usunięto zapisany link. Możesz wkleić nowy.',true);}else set('Nie udało się usunąć: '+(r?.error||'UNKNOWN'),false);}catch(e){set('Błąd: '+e.message,false);}
 });
 chrome.runtime.sendMessage({type:'SP_SYNC_GET_SOURCE'}).then(r=>{if(r?.configured)set('Źródło SharePoint zapisane. Aby zmienić, wklej nowy link i kliknij Zapisz / zamień link.',true);}).catch(()=>{});
})();
