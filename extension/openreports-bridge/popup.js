'use strict';
const $=id=>document.getElementById(id);
const I=globalThis.MRBridgeI18n;
let locale=I.normalize(navigator.language);
const t=key=>I.t(key,locale);
async function initLocale(){
  try{const data=await chrome.storage.local.get('mrBridgeLanguage');locale=I.normalize(data.mrBridgeLanguage||navigator.language);}catch{}
  document.documentElement.lang=locale;I.apply(document,locale);
}

const today=new Date();const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
$('to').value=localDate(today);$('time-to').value='23:59:59';const prev=new Date(today);prev.setDate(prev.getDate()-1);$('from').value=localDate(prev);$('time-from').value='00:00:00';
async function message(type,payload={}){const r=await chrome.runtime.sendMessage({type,...payload});if(!r?.ok)throw Error(r?.error||t('connectionError'));return r;}
async function update(){const {job}=await message('MR_STATUS');const running=job?.state==='running';$('start').disabled=running;$('cancel').hidden=!running;$('status').textContent=job?.message?I.status(job.message,locale):t('readyPopup');$('status').className='status '+(job?.state==='error'?'error':job?.state==='done'?'success':'');}
$('start').onclick=async()=>{try{
  const startDate=$('from').value,endDate=$('to').value;
  const startTime=$('time-from').value,endTime=$('time-to').value;
  // OpenReports expects YYYY-MM-DD HH:MM:SS. `time` step=1 permits seconds.
  if(!/^\d{2}:\d{2}:\d{2}$/.test(startTime)||!/^\d{2}:\d{2}:\d{2}$/.test(endTime))
    throw Error(t('badTime'));
  const from=`${startDate} ${startTime}`,to=`${endDate} ${endTime}`;
  if(!startDate||!endDate||from>to)throw Error(t('badPeriod'));
  const tabs=await chrome.tabs.query({url:'https://openreports-wms.lpp.com/*'});
  const tab=tabs.find(t=>t.active)||tabs[0];
  await message('MR_START',{...(tab?{tabId:tab.id}:{}),from,to,report:$('report').value});await update();
}catch(e){$('status').textContent=I.status(e.message,locale);$('status').className='status error';}};
$('cancel').onclick=async()=>{await message('MR_CANCEL');await update();};
initLocale().then(()=>update()).catch(e=>{$('status').textContent=I.status(e.message,locale);});
chrome.storage.onChanged.addListener((change,area)=>{
  if(area!=='local'||!change.mrBridgeLanguage)return;
  locale=I.normalize(change.mrBridgeLanguage.newValue);I.apply(document,locale);update().catch(()=>{});
});
setInterval(()=>update().catch(()=>{}),1500);
