/* SharePoint Bridge 0.3.23: saved source management; no SharePoint writes. */
'use strict';
(()=>{
 const TENANT='lppsa-my.sharepoint.com';
 const validUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname===TENANT&&!u.username&&!u.password;}catch{return false;}};
 const errorCode=e=>String(e?.message||e).slice(0,100);
 chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  if(!['SP_SYNC_SET_SOURCE','SP_SYNC_CLEAR_SOURCE','SP_SYNC_GET_SOURCE','SP_PERMISSION_OPEN'].includes(msg?.type))return false;
  const fromExtension=sender.id===chrome.runtime.id&&!sender.tab;
  const fromApp=sender.id===chrome.runtime.id&&sender.tab?.url?.startsWith('https://horkiroman4408-cyber.github.io/Mr.-Robot-App/');
  if(msg.type==='SP_SYNC_GET_SOURCE'){
   if(!fromExtension&&!fromApp)return false;
   Promise.all([chrome.storage.local.get('mr_sp_source'),chrome.permissions.contains({origins:['https://lppsa-my.sharepoint.com/*']})])
     .then(([v,permissionGranted])=>respond({ok:true,configured:!!v.mr_sp_source,permissionGranted}))
     .catch(e=>respond({ok:false,error:errorCode(e)}));return true;
  }
  if(msg.type==='SP_PERMISSION_OPEN'){
   if(!fromExtension&&!fromApp)return false;
   // Browser-owned consent stays inside this extension's trusted page. Never
   // call permissions.request in response to arbitrary web page messages.
   chrome.windows.create({url:chrome.runtime.getURL('sharepoint-consent.html'),type:'popup',width:440,height:330,focused:true})
     .then(()=>respond({ok:true})).catch(e=>respond({ok:false,error:errorCode(e)}));return true;
  }
  if(!fromExtension&&!fromApp)return false;
  if(msg.type==='SP_SYNC_SET_SOURCE'){
   if(!validUrl(msg.url)){respond({ok:false,error:'INVALID_SHAREPOINT_LINK'});return false;}
   chrome.storage.local.set({mr_sp_source:msg.url}).then(()=>respond({ok:true})).catch(e=>respond({ok:false,error:errorCode(e)}));return true;
  }
  chrome.storage.local.remove(['mr_sp_source','mr_sp_manual_job']).then(()=>respond({ok:true})).catch(e=>respond({ok:false,error:errorCode(e)}));return true;
 });
})();
