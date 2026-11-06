'use strict';
const $=id=>document.getElementById(id);
const I=globalThis.MRBridgeI18n;
let locale=I.normalize(navigator.language);
const t=key=>I.t(key,locale);
async function initLocale(){
  try{const data=await chrome.storage.local.get('mrBridgeLanguage');locale=I.normalize(data.mrBridgeLanguage||navigator.language);}catch{}
  document.documentElement.lang=locale;I.apply(document,locale);
}


  // Deterministic DD/MM/YYYY and 24-hour HH:MM:SS controls. Native date/time
  // input presentation varies with the OS locale (sometimes showing AM/PM).
  const pad2 = n => String(n).padStart(2,'0');
  function periodMarkup(prefix){
    return `<span class="mr-period-date" data-date="${prefix}" role="group">
      <select id="${prefix}-day" data-mr-aria="dayPart" data-mr-aria="dayPart" aria-label="Day"></select><span class="mr-period-separator">/</span>
      <select id="${prefix}-month" data-mr-aria="monthPart" data-mr-aria="monthPart" aria-label="Month"></select><span class="mr-period-separator">/</span>
      <select id="${prefix}-year" data-mr-aria="yearPart" data-mr-aria="yearPart" aria-label="Year"></select></span>`;
  }
  function clockMarkup(prefix){
    return `<span class="mr-period-clock" data-clock="${prefix}" role="group">
      <input id="${prefix}-hour" type="text" inputmode="numeric" maxlength="2" placeholder="HH" data-mr-aria="hourPart" data-mr-aria="hourPart" aria-label="Hour 00–23" autocomplete="off"><b>:</b>
      <input id="${prefix}-minute" type="text" inputmode="numeric" maxlength="2" placeholder="MM" data-mr-aria="minutePart" data-mr-aria="minutePart" aria-label="Minute 00–59" autocomplete="off"><b>:</b>
      <input id="${prefix}-second" type="text" inputmode="numeric" maxlength="2" placeholder="SS" data-mr-aria="secondPart" data-mr-aria="secondPart" aria-label="Second 00–59" autocomplete="off"></span>`;
  }
  function setupPeriod(root,prefix,date,time){
    const parts=date.split('-').map(Number), [h,m,s]=time.split(':').map(Number);
    const el=id=>root.querySelector('#'+prefix+'-'+id);
    const y=el('year'),mo=el('month'),d=el('day');
    const add=(select,n,label)=>{const opt=document.createElement('option');opt.value=String(n);opt.textContent=label;select.append(opt);};
    for(let i=1;i<=31;i++)add(d,i,pad2(i));
    for(let i=1;i<=12;i++)add(mo,i,pad2(i));
    for(let i=Math.max(2010,new Date().getFullYear()-15);i<=new Date().getFullYear()+5;i++)add(y,i,String(i));
    y.value=String(parts[0]);mo.value=String(parts[1]);d.value=String(parts[2]);
    const adjust=()=>{const max=new Date(Number(y.value),Number(mo.value),0).getDate();for(const opt of d.options)opt.disabled=Number(opt.value)>max;if(Number(d.value)>max)d.value=String(max);};
    y.addEventListener('change',adjust);mo.addEventListener('change',adjust);adjust();
    [['hour',h],['minute',m],['second',s]].forEach(([part,v])=>{
      const input=el(part);input.value=pad2(v);
      input.addEventListener('blur',()=>{const n=Number(input.value);if(/^\d{1,2}$/.test(input.value)&&n<=(part==='hour'?23:59))input.value=pad2(n);});
      input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,2);});
    });
  }
  function readPeriod(root,prefix){
    const el=id=>root.querySelector('#'+prefix+'-'+id);
    const year=Number(el('year').value),month=Number(el('month').value),day=Number(el('day').value);
    const nums=['hour','minute','second'].map(part=>el(part).value.trim());
    if(!nums.every((s,i)=>/^\d{1,2}$/.test(s)&&Number(s)<=(i?59:23)))return null;
    if(day<1||day>new Date(year,month,0).getDate())return null;
    return `${year}-${pad2(month)}-${pad2(day)} ${nums.map(s=>pad2(Number(s))).join(':')}`;
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
