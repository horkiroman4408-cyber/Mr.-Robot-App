'use strict';
const $=id=>document.getElementById(id);
const I=globalThis.MRBridgeI18n;
let locale=I.normalize(navigator.language);
const t=key=>I.t(key,locale);
async function initLocale(){
  try{const data=await chrome.storage.local.get('mrBridgeLanguage');locale=I.normalize(data.mrBridgeLanguage||navigator.language);}catch{}
  document.documentElement.lang=locale;I.apply(document,locale);
}


  // Controlled text inputs avoid browser-specific popup calendars and AM/PM pickers.
  // Users type DD.MM.YYYY and HH:MM:SS directly; values are normalized on blur.
  const pad2 = n => String(n).padStart(2,'0');
  function periodMarkup(prefix){
    return `<span class="mr-period-date" data-date="${prefix}" role="group">
      <input id="${prefix}-date" type="text" inputmode="numeric" maxlength="10" placeholder="DD.MM.YYYY" data-mr-aria="datePart" aria-label="Date DD.MM.YYYY" autocomplete="off"></span>`;
  }
  function clockMarkup(prefix){
    return `<span class="mr-period-clock" data-clock="${prefix}" role="group">
      <input id="${prefix}-time" type="text" inputmode="numeric" maxlength="8" placeholder="HH:MM:SS" data-mr-aria="timePart" aria-label="Time HH:MM:SS" autocomplete="off"></span>`;
  }
  const onlyDigits = value => String(value||'').replace(/\D/g,'');
  function formatDateInput(value){
    const d = onlyDigits(value).slice(0,8);
    if(d.length<=2) return d;
    if(d.length<=4) return d.slice(0,2)+'.'+d.slice(2);
    return d.slice(0,2)+'.'+d.slice(2,4)+'.'+d.slice(4);
  }
  function formatTimeInput(value){
    const d = onlyDigits(value).slice(0,6);
    if(d.length<=2) return d;
    if(d.length<=4) return d.slice(0,2)+':'+d.slice(2);
    return d.slice(0,2)+':'+d.slice(2,4)+':'+d.slice(4);
  }
  function parseDateValue(value){
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value||'').trim());
    if(!m) return null;
    const day=Number(m[1]), month=Number(m[2]), year=Number(m[3]);
    if(month<1||month>12||day<1) return null;
    const max = new Date(year,month,0).getDate();
    if(day>max) return null;
    return {year,month,day};
  }
  function parseTimeValue(value){
    const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(String(value||'').trim());
    if(!m) return null;
    const hour=Number(m[1]), minute=Number(m[2]), second=Number(m[3]);
    if(hour>23||minute>59||second>59) return null;
    return {hour,minute,second};
  }
  function setupPeriod(root,prefix,date,time){
    const dateInput=root.querySelector('#'+prefix+'-date');
    const timeInput=root.querySelector('#'+prefix+'-time');
    const [year,month,day]=date.split('-').map(Number);
    const [hour,minute,second]=time.split(':').map(Number);
    dateInput.value=`${pad2(day)}.${pad2(month)}.${year}`;
    timeInput.value=`${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
    dateInput.addEventListener('input',()=>{ dateInput.value = formatDateInput(dateInput.value); });
    timeInput.addEventListener('input',()=>{ timeInput.value = formatTimeInput(timeInput.value); });
    dateInput.addEventListener('blur',()=>{
      const parsed=parseDateValue(dateInput.value);
      if(parsed) dateInput.value=`${pad2(parsed.day)}.${pad2(parsed.month)}.${parsed.year}`;
    });
    timeInput.addEventListener('blur',()=>{
      const parsed=parseTimeValue(timeInput.value);
      if(parsed) timeInput.value=`${pad2(parsed.hour)}:${pad2(parsed.minute)}:${pad2(parsed.second)}`;
    });
    globalThis.MRBridgeCalendar?.attach(root,prefix);
  }
  function readPeriod(root,prefix){
    const dateValue=root.querySelector('#'+prefix+'-date')?.value;
    const timeValue=root.querySelector('#'+prefix+'-time')?.value;
    const d=parseDateValue(dateValue), t=parseTimeValue(timeValue);
    if(!d||!t) return null;
    return `${d.year}-${pad2(d.month)}-${pad2(d.day)} ${pad2(t.hour)}:${pad2(t.minute)}:${pad2(t.second)}`;
  }

const today=new Date();const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const prev=new Date(today);prev.setDate(prev.getDate()-1);
for(const prefix of ['from','to']){
  $('period-'+prefix+'-date').innerHTML=periodMarkup(prefix);
  $('period-'+prefix+'-time').innerHTML=clockMarkup(prefix);
}
setupPeriod(document,'from',localDate(prev),'00:00:00');
setupPeriod(document,'to',localDate(today),'23:59:59');
async function message(type,payload={}){const r=await chrome.runtime.sendMessage({type,...payload});if(!r?.ok)throw Error(r?.error||t('connectionError'));return r;}
async function update(){const {job}=await message('MR_STATUS');const running=job?.state==='running';$('start').disabled=running;$('cancel').hidden=!running;$('status').textContent=job?.message?I.status(job.message,locale):t('readyPopup');$('status').className='status '+(job?.state==='error'?'error':job?.state==='done'?'success':'');}
$('start').onclick=async()=>{try{
  const from=readPeriod(document,'from'),to=readPeriod(document,'to');
  if(!from||!to)throw Error(t('badTime'));
  if(from>to)throw Error(t('badPeriod'));
  await message('MR_START',{from,to,report:$('report').value});await update();
}catch(e){$('status').textContent=I.status(e.message,locale);$('status').className='status error';}};
$('cancel').onclick=async()=>{await message('MR_CANCEL');await update();};
initLocale().then(()=>update()).catch(e=>{$('status').textContent=I.status(e.message,locale);});
chrome.storage.onChanged.addListener((change,area)=>{
  if(area!=='local'||!change.mrBridgeLanguage)return;
  locale=I.normalize(change.mrBridgeLanguage.newValue);I.apply(document,locale);update().catch(()=>{});
});
setInterval(()=>update().catch(()=>{}),1500);
