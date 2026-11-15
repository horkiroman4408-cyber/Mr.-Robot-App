/* SharePoint ⇄ Obsada: explicit user-initiated download control only. No secrets or report bytes cross the page boundary. */
'use strict';
(()=>{
 const TYPES=new Map([['MR_SP_JOB_START','SP_MANUAL_START'],['MR_SP_JOB_STATUS','SP_MANUAL_STATUS'],['MR_SP_SOURCE_STATUS','SP_SYNC_GET_SOURCE'],['MR_SP_SOURCE_SAVE','SP_SYNC_SET_SOURCE'],['MR_SP_SOURCE_CLEAR','SP_SYNC_CLEAR_SOURCE'],['MR_SP_PERMISSION_OPEN','SP_PERMISSION_OPEN'],['MR_STORAGE_PREPARE','MR_STORAGE_PREPARE']]);
 const ORIGIN=location.origin;
 window.addEventListener('message',async event=>{
  const data=event.data;
  if(event.source!==window||event.origin!==ORIGIN||!TYPES.has(data?.type)||!/^sp-[a-f0-9]{32}$/.test(data?.nonce||''))return;
  const responseType=data.type+'_RESULT';
  let result;
  try{result=await chrome.runtime.sendMessage({type:TYPES.get(data.type),...(data.type==='MR_SP_SOURCE_SAVE'?{url:String(data.url||'')}: {})});}catch(e){result={ok:false,error:String(e?.message||'Bridge unavailable').slice(0,120)};}
  window.postMessage({type:responseType,nonce:data.nonce,result},ORIGIN);
 });
})();
