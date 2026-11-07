'use strict';
const $=id=>document.getElementById(id);
const I=globalThis.MRBridgeI18n;
let locale=I.normalize(navigator.language);
const t=key=>I.t(key,locale);
async function initLocale(){
  try{const data=await chrome.storage.local.get('mrBridgeLanguage');locale=I.normalize(data.mrBridgeLanguage||navigator.language);}catch{}
  document.documentElement.lang=locale;I.apply(document,locale);reflectReport();
}


  // Controlled text inputs avoid browser-specific popup calendars and AM/PM pickers.
  // Users type DD.MM.YYYY and HH:MM:SS directly; values are normalized on blur.
  const pad2 = n => String(n).padStart(2,'0');
  function periodMarkup(prefix){
    return `<span class="mr-period-date" data-date="${prefix}" role="group">
      <input id="${prefix}-date" type="text" inputmode="numeric" maxlength="10" placeholder="DD.MM.YYYY" data-mr-aria="datePart" aria-label="Date DD.MM.YYYY" autocomplete="off"></span>`;
  }
  const clockMarkup = prefix => globalThis.MRBridgeTime.markup(prefix);
  const onlyDigits = value => String(value||'').replace(/\D/g,'');
  function formatDateInput(value){
    const d = onlyDigits(value).slice(0,8);
    if(d.length<=2) return d;
    if(d.length<=4) return d.slice(0,2)+'.'+d.slice(2);
    return d.slice(0,2)+'.'+d.slice(2,4)+'.'+d.slice(4);
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
  function setupPeriod(root,prefix,date,time){
    const dateInput=root.querySelector('#'+prefix+'-date');
    const [year,month,day]=date.split('-').map(Number);
    dateInput.value=`${pad2(day)}.${pad2(month)}.${year}`;
    globalThis.MRBridgeTime.attach(root,prefix,time);
    dateInput.addEventListener('input',()=>{ dateInput.value = formatDateInput(dateInput.value); });
    dateInput.addEventListener('blur',()=>{
      const parsed=parseDateValue(dateInput.value);
      if(parsed) dateInput.value=`${pad2(parsed.day)}.${pad2(parsed.month)}.${parsed.year}`;
    });
    globalThis.MRBridgeCalendar?.attach(root,prefix);
  }
  function readPeriod(root,prefix){
    const dateValue=root.querySelector('#'+prefix+'-date')?.value;
    const d=parseDateValue(dateValue), t=globalThis.MRBridgeTime.read(root,prefix);
    if(!d||!t) return null;
    return `${d.year}-${pad2(d.month)}-${pad2(d.day)} ${t}`;
  }

const today=new Date();const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const prev=new Date(today);prev.setDate(prev.getDate()-1);
for(const prefix of ['from','to']){
  $('period-'+prefix+'-date').innerHTML=periodMarkup(prefix);
  $('period-'+prefix+'-time').innerHTML=clockMarkup(prefix);
}
setupPeriod(document,'from',localDate(prev),'00:00:00');
setupPeriod(document,'to',localDate(today),'23:59:59');
const periodStore=globalThis.MRBridgePeriodStore;
const mpOptions=globalThis.MRBridgeMpOptions;
$('popup-mp-fields').innerHTML=mpOptions.markup('popup-mp');
mpOptions.apply(document,'popup-mp',mpOptions.DEFAULT);
mpOptions.attach(document,'popup-mp');
let mpDirty=false,mpToken=0;
for(const id of ['popup-mp-area','popup-mp-brand'])$(id).addEventListener('change',()=>{mpDirty=true;mpOptions.save(mpOptions.read(document,'popup-mp')).catch(()=>{});});
function loadMpOptions(){const token=++mpToken;mpDirty=false;mpOptions.load().then(o=>{if(token===mpToken&&!mpDirty&&$('report').value==='mp_baza')mpOptions.apply(document,'popup-mp',o);}).catch(()=>{});}

let loadingPeriod=false,periodSelectionToken=0,periodDirty=false;
const currentPeriod=()=>{const raw=readPeriod(document,'from');return $('report').value==='stock'?{from:raw?raw.slice(0,10)+' 00:00:00':null,to:raw?raw.slice(0,10)+' 23:59:59':null}:{from:raw,to:readPeriod(document,'to')};};
function reflectReport(){const hint=$('popup-kpi-hint');hint.hidden=$('report').value!=='kpi_scalanie';hint.textContent=({pl:'Typ kompletacji: Pick Scal · automatycznie',ru:'Тип комплектации: Pick Scal · автоматически',en:'Pick type: Pick Scal · automatic',uk:'Тип комплектування: Pick Scal · автоматично'})[locale]||'Pick Scal';document.body.classList.toggle('mp-mode',$('report').value==='mp_baza');document.body.classList.toggle('stock-mode',$('report').value==='stock');$('popup-date-label').textContent=$('report').value==='stock'?t('stockDate'):t('dateFrom');}
async function loadPeriod(report){
  const token=++periodSelectionToken;
  const loaded=await periodStore.load(report);
  if(token!==periodSelectionToken||$('report').value!==report||periodDirty)return;
  if(loaded){loadingPeriod=true;try{periodStore.apply(document,'from','to',loaded);}finally{loadingPeriod=false;}}
}
async function savePeriod(){
  if(loadingPeriod)return;
  const period=currentPeriod();
  if(period.from&&period.to&&period.from<=period.to)
    await periodStore.save($('report').value,period.from,period.to);
}
$('report').addEventListener('change',()=>{
  reflectReport();periodDirty=false;if($('report').value==='mp_baza'){loadMpOptions();return;}
  const now=new Date(),prev=new Date(now);prev.setDate(prev.getDate()-1);
  loadingPeriod=true;try{periodStore.apply(document,'from','to',{from:localDate($('report').value==='stock'?now:prev)+' 00:00:00',to:localDate(now)+' 23:59:59'});}finally{loadingPeriod=false;}
  loadPeriod($('report').value).catch(()=>{});
});
for(const id of ['period-from-date','period-from-time','period-to-date','period-to-time']){
  const target=$(id);
  for(const event of ['input','change','keydown','paste'])
    target.addEventListener(event,()=>{periodDirty=true;queueMicrotask(()=>savePeriod().catch(()=>{}));});
}
reflectReport();if($('report').value==='mp_baza')loadMpOptions();else loadPeriod($('report').value).catch(()=>{});
async function message(type,payload={}){const r=await chrome.runtime.sendMessage({type,...payload});if(!r?.ok)throw Error(r?.error||t('connectionError'));return r;}
async function update(){const {job}=await message('MR_STATUS');const running=job?.state==='running';$('start').disabled=running;$('cancel').hidden=!running;$('status').textContent=job?.message?I.status(job.message,locale):t('readyPopup');$('status').className='status '+(job?.state==='error'?'error':job?.state==='done'?'success':'');}
$('start').onclick=async()=>{try{
  if($('report').value==='mp_baza'){
    const opts=mpOptions.read(document,'popup-mp');if(!mpOptions.valid(opts))throw Error(t('mpInvalid'));
    await mpOptions.save(opts);await message('MR_START',{report:'mp_baza',...opts});await update();return;
  }
  const {from,to}=currentPeriod();
  if(!from||!to)throw Error(t('badTime'));
  if(from>to)throw Error(t('badPeriod'));
  await periodStore.save($('report').value,from,to);
  await message('MR_START',{from,to,report:$('report').value});await update();
}catch(e){$('status').textContent=I.status(e.message,locale);$('status').className='status error';}};
$('cancel').onclick=async()=>{await message('MR_CANCEL');await update();};
initLocale().then(()=>update()).catch(e=>{$('status').textContent=I.status(e.message,locale);});
chrome.storage.onChanged.addListener((change,area)=>{
  if(area!=='local'||!change.mrBridgeLanguage)return;
  locale=I.normalize(change.mrBridgeLanguage.newValue);I.apply(document,locale);update().catch(()=>{});
});
setInterval(()=>update().catch(()=>{}),1500);
