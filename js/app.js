(function(){console.log('%cMr. Robot%c — All-in-One','font-size:20px;font-weight:800;background:linear-gradient(135deg,#64748b,#1e293b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;padding:4px 0;','font-size:14px;color:#6e6e73;padding:4px 0;');console.log('%c© 2026 Mr. Robot · Made by Raman Horki · LPP','color:#8e8e93;font-size:11px;');})();

const MODULE_LABELS={kpi:{label:'KPI Norms',color:'#0a84ff',bg:'rgba(10,132,255,0.10)'},tote:{label:'RS · Tote',color:'#059669',bg:'rgba(48,209,88,0.10)'},audyt:{label:'MP · Audyt',color:'#9333ea',bg:'rgba(168,85,247,0.10)'},hub:{label:'Hub',color:'#6366f1',bg:'rgba(99,102,241,0.10)'},rs:{label:'RS',color:'#059669',bg:'rgba(48,209,88,0.10)'},mp:{label:'MP',color:'#9333ea',bg:'rgba(168,85,247,0.10)'},inne:{label:'Inne',color:'#d97706',bg:'rgba(245,158,11,0.10)'},ui:{label:'Interfejs',color:'#6366f1',bg:'rgba(99,102,241,0.10)'}};

function median(arr){if(!arr.length)return 0;const s=[...arr].sort((a,b)=>a-b);const mid=Math.floor(s.length/2);return s.length%2?s[mid]:(s[mid-1]+s[mid])/2;}
function medal(i){return ['🥇','🥈','🥉'][i]||(i+1);}
function isPopTote(shelfType){return String(shelfType||'').toLowerCase().trim().startsWith('pop tote');}
function is2x2(shelfType){return String(shelfType||'').toLowerCase().includes('2 x 2');}
function pickMedianByQty(rows){if(!rows||rows.length===0)return null;const sorted=[...rows].sort((a,b)=>a.qty-b.qty);const mid=Math.floor((sorted.length-1)/2);return sorted[mid];}
function pickToteByStrategy(rows,strategy){if(!rows||rows.length===0)return null;const sorted=[...rows].sort((a,b)=>a.qty-b.qty);if(strategy==='min')return sorted[0];const mid=Math.floor((sorted.length-1)/2);return sorted[mid];}
function hasReservation(r){return r.qtyAvailable!==null||r.qtyReserved!==null;}

const{createApp,ref,reactive,computed,watch,markRaw}=Vue;
createApp({setup(){

const uiLanguage=ref(window.MRI18N.language);
window.MRI18N.subscribe(v=>{uiLanguage.value=v;});
const uiLanguages=[{code:'pl',name:'Polski'},{code:'ru',name:'Русский'},{code:'en',name:'English'},{code:'uk',name:'Українська'}];
const currentTheme=ref(document.documentElement.dataset.theme||'light');
new MutationObserver(()=>{currentTheme.value=document.documentElement.dataset.theme||'light';}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
function tr(value){uiLanguage.value;return window.MRI18N.t(value);}
function setLanguage(value){window.MRI18N.set(value);}
function setTheme(value){window.MRTheme.set(value);}
let settingsReturn={view:'hub',scroll:0};
function openSettings(){if(view.value==='settings')return;settingsReturn={view:view.value,scroll:window.scrollY};view.value='settings';window.scrollTo(0,0);}
function closeSettings(){view.value=settingsReturn.view;requestAnimationFrame(()=>window.scrollTo(0,settingsReturn.scroll));}
function goFromSettings(target){view.value=target;window.scrollTo(0,0);}

async function openSettingsMemory(){
 if(!mrMemoryItems.value.length)return;
 mrRestore.expanded=true;
 view.value='hub';
 await Vue.nextTick();
 const panel=document.getElementById('mr-memory-manager');
 if(panel)panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
}



const view=ref('hub');const toast=ref('');const mobileLite=!!window.MR_MOBILE_LITE;
// Visual-only marker for theme-specific module accents; it does not affect application logic.
watch(view,active=>{const host=document.getElementById('app');if(host)host.dataset.activeModule=active;},{immediate:true});
window.__MRBOT_VIEW__=view;watch(view,()=>window.dispatchEvent(new Event('mrbot-view-change')));
const showWelcome=ref(false);
try { if(!localStorage.getItem('mrrobot_welcomed')) showWelcome.value = true; } catch(e){}
function closeWelcome(){ showWelcome.value = false; try{ localStorage.setItem('mrrobot_welcomed', '1'); }catch(e){} }
const rsView=ref('cards');const mpView=ref('cards');
function showToast(msg,ms=2500){toast.value=msg;setTimeout(()=>{toast.value='';},ms);}
watch(view,(v)=>{if(v==='hub'){rsView.value='cards';mpView.value='cards';}});
const changelogAll=CHANGELOG_ALL;const moduleLabels=MODULE_LABELS;
// Release notifications are per browser and per version, not per download/date.
const CHANGELOG_READ_KEY='mrrobot_changelog_lastRead';
const changelogLastRead=ref('');
const changelogReadReady=ref(false);
const newlyViewedChangelog=ref([]);
const clKey=entry=>entry.date+' '+entry.version;
function clVersion(value){
 const match=String(value||'').trim().match(/^(?:\d{4}-\d{2}-\d{2}\s+)?v?(\d+(?:\.\d+){1,5})$/);
 if(!match)return null;
 const parts=match[1].split('.').map(Number);
 while(parts.length>2&&parts[parts.length-1]===0)parts.pop();
 return parts;
}
function clCompare(a,b){
 const aa=clVersion(a),bb=clVersion(b);
 if(!aa||!bb)return aa?1:bb?-1:0;
 for(let i=0;i<Math.max(aa.length,bb.length);i++){
  const diff=(aa[i]||0)-(bb[i]||0);if(diff)return Math.sign(diff);
 }
 return 0;
}
const latestChangelog=changelogAll.reduce((a,b)=>!a||clCompare(b.version,a.version)>0?b:a,null);
let changelogDb=null,changelogDbRead=false,changelogViewed=false,storedChangelogRead='';
function clStored(storage){
 try{const value=storage().getItem(CHANGELOG_READ_KEY);return clVersion(value)?value:'';}catch(e){return '';}
}
for(const storage of [()=>window.localStorage,()=>window.sessionStorage]){
 const value=clStored(storage);
 if(value&&(!storedChangelogRead||clCompare(value,storedChangelogRead)>0))storedChangelogRead=value;
}
function saveChangelogRead(){
 let value=changelogLastRead.value;if(!clVersion(value))return;
 for(const storage of [()=>window.localStorage,()=>window.sessionStorage]){
  const saved=clStored(storage);if(saved&&clCompare(saved,value)>0)value=saved;
 }
 if(clCompare(value,changelogLastRead.value)>0){changelogLastRead.value=value;storedChangelogRead=value;}
 for(const storage of [()=>window.localStorage,()=>window.sessionStorage]){
  try{storage().setItem(CHANGELOG_READ_KEY,value);}catch(e){}
 }
 if(changelogDb&&changelogDbRead){
  try{
   const store=changelogDb.transaction('settings','readwrite').objectStore('settings');
   const read=store.get('changelog-last-read');
   read.onsuccess=()=>{
    const newest=clCompare(read.result,value)>0?read.result:value;
    store.put(newest,'changelog-last-read');
    if(clCompare(newest,changelogLastRead.value)>0){
     changelogLastRead.value=newest;storedChangelogRead=newest;
     for(const storage of [()=>window.localStorage,()=>window.sessionStorage]){
      try{storage().setItem(CHANGELOG_READ_KEY,newest);}catch(e){}
     }
    }
   };
  }catch(e){}
 }
}
function finishChangelogRead(value,persist=true){
 if(clVersion(value)&&(!storedChangelogRead||clCompare(value,storedChangelogRead)>0))storedChangelogRead=value;
 if(!changelogViewed){
  // A genuinely first visit starts quietly; old releases are not notifications.
  changelogLastRead.value=storedChangelogRead||(latestChangelog?clKey(latestChangelog):'');
 }else if(clCompare(storedChangelogRead,changelogLastRead.value)>0)changelogLastRead.value=storedChangelogRead;
 changelogReadReady.value=true;
 if(persist)saveChangelogRead();
}
// Prevent blocked storage from leaving the notification in a loading state.
const changelogLoadTimer=setTimeout(()=>finishChangelogRead('',false),1200);
try{
 const request=indexedDB.open('mrrobot-preferences',1);
 request.onupgradeneeded=()=>{
  if(!request.result.objectStoreNames.contains('settings'))request.result.createObjectStore('settings');
 };
 request.onsuccess=()=>{
  changelogDb=request.result;
  changelogDb.onversionchange=()=>{changelogDb.close();changelogDb=null;};
  try{
   const read=changelogDb.transaction('settings').objectStore('settings').get('changelog-last-read');
   read.onsuccess=()=>{clearTimeout(changelogLoadTimer);changelogDbRead=true;finishChangelogRead(read.result);};
   read.onerror=()=>{clearTimeout(changelogLoadTimer);changelogDbRead=true;finishChangelogRead('');};
  }catch(e){clearTimeout(changelogLoadTimer);finishChangelogRead('');}
 };
 request.onerror=request.onblocked=()=>{clearTimeout(changelogLoadTimer);finishChangelogRead('');};
}catch(e){clearTimeout(changelogLoadTimer);finishChangelogRead('');}
function isUnreadChangelog(entry){
 return changelogReadReady.value&&!!clVersion(changelogLastRead.value)&&clCompare(entry.version,changelogLastRead.value)>0;
}
const unreadChangelogCount=computed(()=>changelogAll.filter(isUnreadChangelog).length);
const hasUnreadChangelog=computed(()=>unreadChangelogCount.value>0);
function isChangelogEntryNew(entry){
 const version=clVersion(entry.version);
 return !!version&&newlyViewedChangelog.value.includes(version.join('.'));
}
function markChangelogRead(){
 newlyViewedChangelog.value=changelogAll.filter(isUnreadChangelog).map(entry=>clVersion(entry.version).join('.'));
 if(!latestChangelog)return;
 changelogViewed=true;
 if(clCompare(latestChangelog.version,changelogLastRead.value)>=0)changelogLastRead.value=clKey(latestChangelog);
 storedChangelogRead=changelogLastRead.value;
 changelogReadReady.value=true;
 saveChangelogRead();
}
watch(view,(value)=>{
 if(value==='changelog')markChangelogRead();
 else newlyViewedChangelog.value=[];
});
window.addEventListener('storage',event=>{
 if(event.key!==CHANGELOG_READ_KEY||!clVersion(event.newValue))return;
 if(clCompare(event.newValue,changelogLastRead.value)>0){
  changelogLastRead.value=event.newValue;storedChangelogRead=event.newValue;changelogReadReady.value=true;
 }
});

const DEFAULT_NORM_AUDYT=360,DEFAULT_NORM_SCALANIE=130,DEFAULT_NORM_ROZK=90,DEFAULT_NORM_NV=600;
const SHIFT_DEFS=[{key:'AB',label:'A/B'},{key:'CD',label:'C/D'}];const allShiftKeys=SHIFT_DEFS.map(s=>s.key);
const GROUP_DEFS=[{key:'mohito',label:'MOHITO',shortLabel:'MOHITO',badgeClass:'mohito'},{key:'sinsay',label:'SINSAY',shortLabel:'SINSAY',badgeClass:'sinsay'},{key:'spm',label:'SPM',shortLabel:'SPM',badgeClass:'spm'},{key:'spd',label:'SPD',shortLabel:'SPD',badgeClass:'spd'},{key:'lpp',label:'LPP',shortLabel:'LPP',badgeClass:'lpp'},{key:'inne',label:'Inne',shortLabel:'INNE',badgeClass:'inne'}];
const allGroupKeys=GROUP_DEFS.map(g=>g.key);
function kpiGroupByKey(k){return GROUP_DEFS.find(g=>g.key===k)||GROUP_DEFS[GROUP_DEFS.length-1];}
const kpiStatusFilters=[{value:'all',label:'Wszyscy'},{value:'above',label:'✓ W normie'},{value:'below',label:'▼ Poniżej'}];
const kpiSortOptions=[{value:'perHour',label:'Szt./h'},{value:'items',label:'Sztuki'},{value:'time',label:'Czas'},{value:'login',label:'Login'}];
const STAGE_LABELS={read:'Czytanie pliku…',excel:'Parsowanie Excel…',parse:'Przetwarzanie wierszy…'};
const kpiTab=ref('audit'),kpiStatsTab=ref('audit'),kpiTopCountNorm=ref(3),kpiTopCountItems=ref(3);
const kpiAudit=reactive({records:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',statusFilter:'all',sortBy:'perHour',sortDir:'desc',selectedGroups:[],selectedFirmy:[],selectedProcesy:[],selectedShifts:[...allShiftKeys]});
Object.defineProperty(kpiAudit,'loaded',{get(){return this.records.length>0;}});
const kpiScalanie=reactive({records:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',statusFilter:'all',sortBy:'perHour',sortDir:'desc',selectedGroups:[],selectedFirmy:[],selectedProcesy:[],selectedShifts:[...allShiftKeys]});
Object.defineProperty(kpiScalanie,'loaded',{get(){return this.records.length>0;}});
const kpiRozk=reactive({records:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',statusFilter:'all',sortBy:'perHour',sortDir:'desc',selectedGroups:[],selectedFirmy:[],selectedProcesy:[],selectedShifts:[...allShiftKeys],selectedRodzaje:['SCAL','RSORT','Zwroty']});
Object.defineProperty(kpiRozk,'loaded',{get(){return this.records.length>0;}});
const kpiNv=reactive({records:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',statusFilter:'all',sortBy:'perHour',sortDir:'desc',selectedGroups:[],selectedFirmy:[],selectedProcesy:[],selectedShifts:[...allShiftKeys]});
Object.defineProperty(kpiNv,'loaded',{get(){return this.records.length>0;}});
const kpiNormThreshold=ref(DEFAULT_NORM_AUDYT),kpiScalanieNormThreshold=ref(DEFAULT_NORM_SCALANIE),kpiRozkNormThreshold=ref(DEFAULT_NORM_ROZK),kpiNvNormThreshold=ref(DEFAULT_NORM_NV);
const kpiHasSelection=computed(()=>true);const kpiAuditFilterActive=computed(()=>kpiAudit.selectedFirmy.length>0||kpiAudit.selectedProcesy.length>0||kpiAudit.selectedShifts.length!==allShiftKeys.length);
const kpiHasScalanieSelection=computed(()=>true);const kpiScalanieFilterActive=computed(()=>kpiScalanie.selectedFirmy.length>0||kpiScalanie.selectedProcesy.length>0||kpiScalanie.selectedShifts.length!==allShiftKeys.length);
const kpiHasRozkSelection=computed(()=>true);const kpiRozkFilterActive=computed(()=>kpiRozk.selectedFirmy.length>0||kpiRozk.selectedProcesy.length>0||kpiRozk.selectedShifts.length!==allShiftKeys.length||!ROZK_RODZAJE.every(k=>kpiRozk.selectedRodzaje.includes(k)));
const kpiHasNvSelection=computed(()=>true);const kpiNvFilterActive=computed(()=>kpiNv.selectedFirmy.length>0||kpiNv.selectedProcesy.length>0||kpiNv.selectedShifts.length!==allShiftKeys.length);
const kpiIsAllGroupsActive=computed(()=>kpiAudit.selectedGroups.length===allGroupKeys.length);
const kpiIsAllScalanieGroupsActive=computed(()=>kpiScalanie.selectedGroups.length===allGroupKeys.length);
const kpiIsAllRozkGroupsActive=computed(()=>kpiRozk.selectedGroups.length===allGroupKeys.length);
const kpiIsAllNvGroupsActive=computed(()=>kpiNv.selectedGroups.length===allGroupKeys.length);
const kpiIsAllShiftsActive=computed(()=>kpiAudit.selectedShifts.length===allShiftKeys.length);
const kpiIsAllScalanieShiftsActive=computed(()=>kpiScalanie.selectedShifts.length===allShiftKeys.length);
const kpiIsAllRozkShiftsActive=computed(()=>kpiRozk.selectedShifts.length===allShiftKeys.length);
const kpiIsAllNvShiftsActive=computed(()=>kpiNv.selectedShifts.length===allShiftKeys.length);
function toggleInArray(arr,key){if(arr.includes(key))return arr.filter(k=>k!==key);return [...arr,key];}
function toggleAllInArray(arr,allKeys){if(arr.length===allKeys.length)return [];return [...allKeys];}
function kpiToggleGroup(k){kpiAudit.selectedGroups=toggleInArray(kpiAudit.selectedGroups,k);}
function kpiSelectAllGroups(){kpiAudit.selectedGroups=toggleAllInArray(kpiAudit.selectedGroups,allGroupKeys);}
function kpiToggleShift(k){kpiAudit.selectedShifts=toggleInArray(kpiAudit.selectedShifts,k);}
function kpiSelectAllShifts(){kpiAudit.selectedShifts=toggleAllInArray(kpiAudit.selectedShifts,allShiftKeys);}
function kpiClearSelection(){kpiAudit.selectedGroups=[];kpiAudit.selectedShifts=[...allShiftKeys];kpiAudit.selectedFirmy=[];kpiAudit.selectedProcesy=[];}
function kpiToggleScalanieGroup(k){kpiScalanie.selectedGroups=toggleInArray(kpiScalanie.selectedGroups,k);}
function kpiSelectAllScalanieGroups(){kpiScalanie.selectedGroups=toggleAllInArray(kpiScalanie.selectedGroups,allGroupKeys);}
function kpiToggleScalanieShift(k){kpiScalanie.selectedShifts=toggleInArray(kpiScalanie.selectedShifts,k);}
function kpiSelectAllScalanieShifts(){kpiScalanie.selectedShifts=toggleAllInArray(kpiScalanie.selectedShifts,allShiftKeys);}
function kpiClearScalanieSelection(){kpiScalanie.selectedGroups=[];kpiScalanie.selectedShifts=[...allShiftKeys];kpiScalanie.selectedFirmy=[];kpiScalanie.selectedProcesy=[];}
function kpiToggleRozkGroup(k){kpiRozk.selectedGroups=toggleInArray(kpiRozk.selectedGroups,k);}
const ROZK_RODZAJE=['SCAL','RSORT','Zwroty'];const kpiRozkRodzajKeys=ROZK_RODZAJE;const rozkKey=r=>r.rodzaj==null?'SCAL':r.rodzaj;function kpiToggleRozkRodzaj(k){const cur=kpiRozk.selectedRodzaje;if(cur.length===ROZK_RODZAJE.length){kpiRozk.selectedRodzaje=[k];return;}let next=cur.includes(k)?cur.filter(x=>x!==k):[...cur,k];if(!next.length)next=[...ROZK_RODZAJE];kpiRozk.selectedRodzaje=ROZK_RODZAJE.filter(x=>next.includes(x));}function kpiSelectAllRozkRodzaje(){kpiRozk.selectedRodzaje=[...ROZK_RODZAJE];}
function kpiSelectAllRozkGroups(){kpiRozk.selectedGroups=toggleAllInArray(kpiRozk.selectedGroups,allGroupKeys);}
function kpiToggleRozkShift(k){kpiRozk.selectedShifts=toggleInArray(kpiRozk.selectedShifts,k);}
function kpiSelectAllRozkShifts(){kpiRozk.selectedShifts=toggleAllInArray(kpiRozk.selectedShifts,allShiftKeys);}
function kpiClearRozkSelection(){kpiRozk.selectedGroups=[];kpiRozk.selectedShifts=[...allShiftKeys];kpiRozk.selectedFirmy=[];kpiRozk.selectedProcesy=[];kpiRozk.selectedRodzaje=[...ROZK_RODZAJE];}
function kpiToggleNvGroup(k){kpiNv.selectedGroups=toggleInArray(kpiNv.selectedGroups,k);}
function kpiSelectAllNvGroups(){kpiNv.selectedGroups=toggleAllInArray(kpiNv.selectedGroups,allGroupKeys);}
function kpiToggleNvShift(k){kpiNv.selectedShifts=toggleInArray(kpiNv.selectedShifts,k);}
function kpiSelectAllNvShifts(){kpiNv.selectedShifts=toggleAllInArray(kpiNv.selectedShifts,allShiftKeys);}
function kpiClearNvSelection(){kpiNv.selectedGroups=[];kpiNv.selectedShifts=[...allShiftKeys];kpiNv.selectedFirmy=[];kpiNv.selectedProcesy=[];}
function availableGroupsFor(records){const c={};for(const r of records)c[r.group]=(c[r.group]||0)+1;return GROUP_DEFS.filter(g=>(c[g.key]||0)>0).map(g=>({...g,count:c[g.key]||0}));}
function availableShiftsFor(records){const c={};for(const r of records)c[r.shift]=(c[r.shift]||0)+1;return SHIFT_DEFS.filter(s=>(c[s.key]||0)>0).map(s=>({...s,count:c[s.key]||0}));}
const kpiAvailableGroups=computed(()=>availableGroupsFor(kpiAudit.records));
const kpiAvailableScalanieGroups=computed(()=>availableGroupsFor(kpiScalanie.records));
const kpiAvailableRozkGroups=computed(()=>availableGroupsFor(kpiRozk.records));
const kpiAvailableNvGroups=computed(()=>availableGroupsFor(kpiNv.records));
const kpiAvailableShifts=computed(()=>availableShiftsFor(kpiAudit.records));
const kpiAvailableScalanieShifts=computed(()=>availableShiftsFor(kpiScalanie.records));
const kpiAvailableRozkShifts=computed(()=>availableShiftsFor(kpiRozk.records));
const kpiAvailableNvShifts=computed(()=>availableShiftsFor(kpiNv.records));
const ATTR_NONE='__brak__';
function attrOptions(records,field,keep){const c={};for(const r of records){const k=r[field]||ATTR_NONE;c[k]=(c[k]||0)+1;}for(const k of (keep||[]))if(!(k in c))c[k]=0;return Object.keys(c).sort((a,b)=>a===ATTR_NONE?1:b===ATTR_NONE?-1:a.localeCompare(b,'pl')).map(k=>({key:k,label:k===ATTR_NONE?'Brak w grafiku':k,count:c[k]}));}
function filterByAttr(records,firmy,procesy){if(!firmy.length&&!procesy.length)return records;const F=new Set(firmy),P=new Set(procesy);return records.filter(r=>(!F.size||F.has(r.firma||ATTR_NONE))&&(!P.size||P.has(r.proces||ATTR_NONE)));}
function attrLabel(k){return k===ATTR_NONE?'Brak w grafiku':k;}
function attrSummary(mod){let t='';if(mod.selectedFirmy.length)t+=' · Agencja: '+mod.selectedFirmy.map(attrLabel).join(', ');if(mod.selectedProcesy.length)t+=' · Proces: '+mod.selectedProcesy.map(attrLabel).join(', ');return t;}
function kpiToggleAttr(mod,field,k){const p=field==='firma'?'selectedFirmy':'selectedProcesy';mod[p]=toggleInArray(mod[p],k);}
function kpiClearAttr(mod,field){mod[field==='firma'?'selectedFirmy':'selectedProcesy']=[];}
function makeAttrOpts(mod){return {firma:computed(()=>attrOptions(filterByGroup(mod.records,mod.selectedGroups,mod.selectedShifts),'firma',mod.selectedFirmy)),proces:computed(()=>attrOptions(filterByAttr(filterByGroup(mod.records,mod.selectedGroups,mod.selectedShifts),mod.selectedFirmy,[]),'proces',mod.selectedProcesy))};}
const kpiAttrOpts=reactive({audit:makeAttrOpts(kpiAudit),scalanie:makeAttrOpts(kpiScalanie),rozk:makeAttrOpts(kpiRozk),nv:makeAttrOpts(kpiNv)});
const KPI_SHIFT_AB_SET=new Set(SHIFT_AB),KPI_SHIFT_CD_SET=new Set(SHIFT_CD);
function kpiEnrichRecords(records){const m=pracownicy.byLogin;return records.map(r=>{const p=m.get(r.login);const fb=KPI_SHIFT_AB_SET.has(r.login)?'AB':(KPI_SHIFT_CD_SET.has(r.login)?'CD':null);return {...r,firma:(p&&p.firma)||null,proces:(p&&p.proces)||null,shift:(p&&p.shift)||fb};});}
function kpiReapplyPracownicy(){for(const mod of [kpiAudit,kpiScalanie,kpiRozk,kpiNv]){if(!mod.records.length)continue;mod.records=markRaw(kpiEnrichRecords(mod.records));mod.selectedFirmy=[];mod.selectedProcesy=[];}}
function filterByGroup(records,groups,shifts){if(shifts.length===allShiftKeys.length)return records;const selS=new Set(shifts);return records.filter(r=>r.shift&&selS.has(r.shift));}
const kpiAuditFilteredByGroup=computed(()=>filterByAttr(filterByGroup(kpiAudit.records,kpiAudit.selectedGroups,kpiAudit.selectedShifts),kpiAudit.selectedFirmy,kpiAudit.selectedProcesy));
const kpiScalanieFilteredByGroup=computed(()=>filterByAttr(filterByGroup(kpiScalanie.records,kpiScalanie.selectedGroups,kpiScalanie.selectedShifts),kpiScalanie.selectedFirmy,kpiScalanie.selectedProcesy));
const kpiRozkBaseFiltered=computed(()=>filterByAttr(filterByGroup(kpiRozk.records,kpiRozk.selectedGroups,kpiRozk.selectedShifts),kpiRozk.selectedFirmy,kpiRozk.selectedProcesy));const kpiRozkRodzajCounts=computed(()=>{const c={all:0,SCAL:0,RSORT:0,Zwroty:0};for(const r of kpiRozkBaseFiltered.value){const k=rozkKey(r);if(k in c){c[k]++;c.all++;}}return c;});const kpiIsAllRozkRodzajeActive=computed(()=>ROZK_RODZAJE.every(k=>kpiRozk.selectedRodzaje.includes(k)));const kpiRozkFilteredByGroup=computed(()=>{const base=kpiRozkBaseFiltered.value;if(kpiIsAllRozkRodzajeActive.value)return base;const sel=new Set(kpiRozk.selectedRodzaje);return base.filter(r=>sel.has(rozkKey(r)));});const kpiNvFilteredByGroup=computed(()=>filterByAttr(filterByGroup(kpiNv.records,kpiNv.selectedGroups,kpiNv.selectedShifts),kpiNv.selectedFirmy,kpiNv.selectedProcesy));
const kpiAuditActiveGroupSummary=computed(()=>attrSummary(kpiAudit).replace(/^ · /,'')||'wszyscy pracownicy');
const kpiScalanieActiveGroupSummary=computed(()=>attrSummary(kpiScalanie).replace(/^ · /,'')||'wszyscy pracownicy');
const kpiRozkActiveGroupSummary=computed(()=>attrSummary(kpiRozk).replace(/^ · /,'')||'wszyscy pracownicy');
const kpiNvActiveGroupSummary=computed(()=>attrSummary(kpiNv).replace(/^ · /,'')||'wszyscy pracownicy');
function calcStats(records,normThreshold){if(!records.length)return {above:0,below:0,efficiency:0,avg:0,median:0,totalItems:0,totalTime:0};const ph=records.map(r=>r.perHour);const ti=records.reduce((s,r)=>s+r.items,0);const tt=records.reduce((s,r)=>s+r.time,0);const above=records.filter(r=>r.perHour>=normThreshold).length;return {above,below:records.length-above,efficiency:records.length?(above/records.length)*100:0,avg:ph.reduce((a,b)=>a+b,0)/ph.length,median:median(ph),totalItems:ti,totalTime:tt};}
const kpiStatsAudit=computed(()=>calcStats(kpiAuditFilteredByGroup.value,kpiNormThreshold.value));
const kpiStatsScalanie=computed(()=>calcStats(kpiScalanieFilteredByGroup.value,kpiScalanieNormThreshold.value));
const kpiStatsRozk=computed(()=>calcStats(kpiRozkFilteredByGroup.value,kpiRozkNormThreshold.value));
const kpiStatsNv=computed(()=>calcStats(kpiNvFilteredByGroup.value,kpiNvNormThreshold.value));
const kpiNvFilteredNadwe=computed(()=>kpiNvFilteredByGroup.value.filter(r=>r.rodzaj==='NADWE'));
const kpiNvFilteredVas=computed(()=>kpiNvFilteredByGroup.value.filter(r=>r.rodzaj==='VAS'));
const kpiStatsNadwe=computed(()=>calcStats(kpiNvFilteredNadwe.value,kpiNvNormThreshold.value));
const kpiStatsVas=computed(()=>calcStats(kpiNvFilteredVas.value,kpiNvNormThreshold.value));
function calcTopByNorm(records,count){if(!records.length)return {best:[],worst:[],bestAvg:0,worstAvg:0};const n=Math.min(count,records.length);const sorted=[...records].sort((a,b)=>b.perHour-a.perHour);const best=sorted.slice(0,n);const worst=[...sorted].reverse().slice(0,n);return {best,worst,bestAvg:(best.reduce((s,r)=>s+r.perHour,0)/best.length).toFixed(0),worstAvg:(worst.reduce((s,r)=>s+r.perHour,0)/worst.length).toFixed(0)};}
function calcTopByItems(records,count){if(!records.length)return {best:[],worst:[],bestAvg:0,worstAvg:0};const n=Math.min(count,records.length);const sorted=[...records].sort((a,b)=>b.items-a.items);const best=sorted.slice(0,n);const worst=[...sorted].reverse().slice(0,n);return {best,worst,bestAvg:Math.round(best.reduce((s,r)=>s+r.items,0)/best.length).toLocaleString('pl-PL'),worstAvg:Math.round(worst.reduce((s,r)=>s+r.items,0)/worst.length).toLocaleString('pl-PL')};}
const kpiTopByNorm=computed(()=>calcTopByNorm(kpiAuditFilteredByGroup.value,kpiTopCountNorm.value));
const kpiTopByItems=computed(()=>calcTopByItems(kpiAuditFilteredByGroup.value,kpiTopCountItems.value));
const kpiScalanieTopByNorm=computed(()=>calcTopByNorm(kpiScalanieFilteredByGroup.value,kpiTopCountNorm.value));
const kpiScalanieTopByItems=computed(()=>calcTopByItems(kpiScalanieFilteredByGroup.value,kpiTopCountItems.value));
const kpiRozkTopByNorm=computed(()=>calcTopByNorm(kpiRozkFilteredByGroup.value,kpiTopCountNorm.value));
const kpiRozkTopByItems=computed(()=>calcTopByItems(kpiRozkFilteredByGroup.value,kpiTopCountItems.value));
const kpiNadweTopByNorm=computed(()=>calcTopByNorm(kpiNvFilteredNadwe.value,kpiTopCountNorm.value));
const kpiNadweTopByItems=computed(()=>calcTopByItems(kpiNvFilteredNadwe.value,kpiTopCountItems.value));
const kpiVasTopByNorm=computed(()=>calcTopByNorm(kpiNvFilteredVas.value,kpiTopCountNorm.value));
const kpiVasTopByItems=computed(()=>calcTopByItems(kpiNvFilteredVas.value,kpiTopCountItems.value));
function filterAndSort(records,statusFilter,normThreshold,sortBy,sortDir){let arr=records;if(statusFilter==='above')arr=arr.filter(r=>r.perHour>=normThreshold);else if(statusFilter==='below')arr=arr.filter(r=>r.perHour<normThreshold);const dir=sortDir==='asc'?1:-1;return [...arr].sort((a,b)=>{if(sortBy==='login')return a.login.localeCompare(b.login)*dir;return (a[sortBy]-b[sortBy])*dir;});}
const kpiAuditFiltered=computed(()=>filterAndSort(kpiAuditFilteredByGroup.value,kpiAudit.statusFilter,kpiNormThreshold.value,kpiAudit.sortBy,kpiAudit.sortDir));
const kpiScalanieFiltered=computed(()=>filterAndSort(kpiScalanieFilteredByGroup.value,kpiScalanie.statusFilter,kpiScalanieNormThreshold.value,kpiScalanie.sortBy,kpiScalanie.sortDir));
const kpiRozkFiltered=computed(()=>filterAndSort(kpiRozkFilteredByGroup.value,kpiRozk.statusFilter,kpiRozkNormThreshold.value,kpiRozk.sortBy,kpiRozk.sortDir));
const kpiNvFiltered=computed(()=>filterAndSort(kpiNvFilteredByGroup.value,kpiNv.statusFilter,kpiNvNormThreshold.value,kpiNv.sortBy,kpiNv.sortDir));
const kpiIsBelow=r=>r.perHour<kpiNormThreshold.value;
const kpiIsScalanieBelow=r=>r.perHour<kpiScalanieNormThreshold.value;
const kpiIsRozkBelow=r=>r.perHour<kpiRozkNormThreshold.value;
const kpiIsNvBelow=r=>r.perHour<kpiNvNormThreshold.value;
function kpiProcessFile(file,kind,mod,onDone){if(!file)return;mod.progress.percent=0;mod.progress.label=STAGE_LABELS.read;const reader=new FileReader();reader.onload=e=>{const buffer=e.target.result;const worker=createKpiWorker();worker.onmessage=msg=>{const d=msg.data;if(d.type==='progress'){let pct=d.percent;if(d.stage==='read')pct=5;else if(d.stage==='excel')pct=d.percent;else if(d.stage==='parse')pct=60+Math.floor(d.percent*0.35);mod.progress.percent=Math.min(pct,99);mod.progress.label=STAGE_LABELS[d.stage]||'Przetwarzanie…';}else if(d.type==='done'){mod.progress.percent=100;mod.progress.label='Gotowe';setTimeout(()=>{onDone(d.records);mrRobotDisposeWorker(worker);},200);}else if(d.type==='error'){mrRobotDisposeWorker(worker);mod.loading=false;mod.progress.percent=0;mod.progress.label='';showToast('Błąd: '+d.message);}};worker.onerror=err=>{console.error('Mr. Robot Worker error',err);mrRobotDisposeWorker(worker);mod.loading=false;mod.progress.percent=0;mod.progress.label='';showToast('Błąd modułu Excel. Spróbuj ponownie.');};const pracownicyMap={};for(const[login,p]of pracownicy.byLogin){pracownicyMap[login]={firma:p.firma,proces:p.proces,shift:p.shift};}worker.postMessage({buffer,kind,pracownicyMap});};reader.onerror=()=>showToast('Błąd czytania pliku');reader.readAsArrayBuffer(file);}
function kpiOnAuditFile(e){const f=e.target.files[0];if(!f)return;kpiAudit.loading=true;kpiProcessFile(f,'AUDYT',kpiAudit,records=>{kpiAudit.records=markRaw(records);kpiAudit.fileName=f.name;kpiAudit.loading=false;kpiNormThreshold.value=DEFAULT_NORM_AUDYT;kpiAudit.selectedGroups=[];kpiAudit.selectedShifts=[...allShiftKeys];kpiAudit.selectedFirmy=[];kpiAudit.selectedProcesy=[];showToast(`Audyt: ${records.length} pracowników`);});}
function kpiOnAuditDrop(e){kpiAudit.drag=false;const f=e.dataTransfer.files[0];if(f)kpiOnAuditFile({target:{files:[f]}});}
function kpiResetAudit(){kpiAudit.records=[];kpiAudit.fileName='';kpiAudit.savedAt='';kpiNormThreshold.value=DEFAULT_NORM_AUDYT;kpiAudit.statusFilter='all';kpiAudit.selectedGroups=[];kpiAudit.selectedShifts=[...allShiftKeys];kpiAudit.selectedFirmy=[];kpiAudit.selectedProcesy=[];}
function kpiOnScalanieFile(e){const f=e.target.files[0];if(!f)return;kpiScalanie.loading=true;kpiProcessFile(f,'SCALANIE',kpiScalanie,records=>{kpiScalanie.records=markRaw(records);kpiScalanie.fileName=f.name;kpiScalanie.loading=false;kpiScalanieNormThreshold.value=DEFAULT_NORM_SCALANIE;kpiScalanie.selectedGroups=[];kpiScalanie.selectedShifts=[...allShiftKeys];kpiScalanie.selectedFirmy=[];kpiScalanie.selectedProcesy=[];showToast(`Scalanie: ${records.length}`);});}
function kpiOnScalanieDrop(e){kpiScalanie.drag=false;const f=e.dataTransfer.files[0];if(f)kpiOnScalanieFile({target:{files:[f]}});}
function kpiResetScalanie(){kpiScalanie.records=[];kpiScalanie.fileName='';kpiScalanie.savedAt='';kpiScalanieNormThreshold.value=DEFAULT_NORM_SCALANIE;kpiScalanie.statusFilter='all';kpiScalanie.selectedGroups=[];kpiScalanie.selectedShifts=[...allShiftKeys];kpiScalanie.selectedFirmy=[];kpiScalanie.selectedProcesy=[];}
function kpiOnRozkFile(e){const f=e.target.files[0];if(!f)return;kpiRozk.loading=true;kpiProcessFile(f,'ROZKŁADANIE',kpiRozk,records=>{kpiRozk.records=markRaw(records);kpiRozk.fileName=f.name;kpiRozk.loading=false;kpiRozkNormThreshold.value=DEFAULT_NORM_ROZK;kpiRozk.selectedGroups=[];kpiRozk.selectedShifts=[...allShiftKeys];kpiRozk.selectedFirmy=[];kpiRozk.selectedProcesy=[];kpiRozk.selectedRodzaje=[...ROZK_RODZAJE];showToast(`Rozkładanie: ${records.length}`);});}
function kpiOnRozkDrop(e){kpiRozk.drag=false;const f=e.dataTransfer.files[0];if(f)kpiOnRozkFile({target:{files:[f]}});}
function kpiResetRozk(){kpiRozk.records=[];kpiRozk.fileName='';kpiRozk.savedAt='';kpiRozkNormThreshold.value=DEFAULT_NORM_ROZK;kpiRozk.statusFilter='all';kpiRozk.selectedGroups=[];kpiRozk.selectedShifts=[...allShiftKeys];kpiRozk.selectedFirmy=[];kpiRozk.selectedProcesy=[];kpiRozk.selectedRodzaje=[...ROZK_RODZAJE];}
function kpiOnNvFile(e){const f=e.target.files[0];if(!f)return;kpiNv.loading=true;kpiProcessFile(f,'NADWE_VAS',kpiNv,records=>{kpiNv.records=markRaw(records);kpiNv.fileName=f.name;kpiNv.loading=false;kpiNvNormThreshold.value=DEFAULT_NORM_NV;kpiNv.selectedGroups=[];kpiNv.selectedShifts=[...allShiftKeys];kpiNv.selectedFirmy=[];kpiNv.selectedProcesy=[];showToast(`NADWE/VAS: ${records.length}`);});}
function kpiOnNvDrop(e){kpiNv.drag=false;const f=e.dataTransfer.files[0];if(f)kpiOnNvFile({target:{files:[f]}});}
function kpiResetNv(){kpiNv.records=[];kpiNv.fileName='';kpiNv.savedAt='';kpiNvNormThreshold.value=DEFAULT_NORM_NV;kpiNv.statusFilter='all';kpiNv.selectedGroups=[];kpiNv.selectedShifts=[...allShiftKeys];kpiNv.selectedFirmy=[];kpiNv.selectedProcesy=[];}
function kpiExportAudit(){if(!kpiAuditFiltered.value.length)return;const data=[['USER LOGIN','GRUPA','ZMIANA','AGENCJA','PROCES','NUMBER OF ITEMS','TOTAL TIME (H)','NUMBER OF ITEMS PER HOUR','INFO TIME','AUDIT PROCESS TIME','STATUS','NORMA']];for(const r of kpiAuditFiltered.value)data.push([r.login,kpiGroupByKey(r.group).label,r.shift,r.firma||'',r.proces||'',r.items,r.time,r.perHour,r.infoTime,r.auditTime,kpiIsBelow(r)?'PONIŻEJ NORMY':'OK',kpiNormThreshold.value]);const ws=XLSX.utils.aoa_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Audit Norms');XLSX.writeFile(wb,'MrRobot_Audit_Norms.xlsx');showToast('Wygenerowano plik');}
function kpiExportScalanie(){if(!kpiScalanieFiltered.value.length)return;const data=[['USER LOGIN','GRUPA','ZMIANA','AGENCJA','PROCES','NUMBER OF ITEMS','TOTAL TIME IN PROCESS (H)','NUMBER OF ITEMS PER HOUR','STATUS','NORMA']];for(const r of kpiScalanieFiltered.value)data.push([r.login,kpiGroupByKey(r.group).label,r.shift,r.firma||'',r.proces||'',r.items,r.time,r.perHour,kpiIsScalanieBelow(r)?'PONIŻEJ NORMY':'OK',kpiScalanieNormThreshold.value]);const ws=XLSX.utils.aoa_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Scalanie Norms');XLSX.writeFile(wb,'MrRobot_Scalanie_Norms.xlsx');showToast('Wygenerowano plik');}
function kpiExportRozk(){if(!kpiRozkFiltered.value.length)return;const data=[['USER LOGIN','GRUPA','ZMIANA','AGENCJA','PROCES','RODZAJ','NUMBER OF ITEMS','TOTAL TIME IN PROCESS (H)','NUMBER OF ITEMS PER HOUR','STATUS','NORMA']];for(const r of kpiRozkFiltered.value)data.push([r.login,kpiGroupByKey(r.group).label,r.shift,r.firma||'',r.proces||'',r.rodzaj||'SCAL',r.items,r.time,r.perHour,kpiIsRozkBelow(r)?'PONIŻEJ NORMY':'OK',kpiRozkNormThreshold.value]);const ws=XLSX.utils.aoa_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Rozkładanie Norms');XLSX.writeFile(wb,'MrRobot_Rozkladanie_Norms.xlsx');showToast('Wygenerowano plik');}
function kpiNvColorFor(perHour,norm){const v=Number(perHour);const lo=Number(norm)||DEFAULT_NORM_NV,hi=lo+50;if(perHour===''||perHour===null||perHour===undefined)return null;if(isNaN(v)||v===0)return null;if(v>=lo&&v<=hi)return 'C6EFCE';const dist=v<lo?(lo-v):(v-hi);if(dist<=50)return 'D9EAD3';if(dist<=150)return 'FFF2CC';if(dist<=300)return 'FCE4D6';if(dist<=450)return 'F4CCCC';return 'E6B8B7';}
function kpiNvCellStyle(perHour,norm){const colorKey=kpiNvColorFor(perHour,norm);if(!colorKey)return {};const theme=currentTheme.value||'light';const palettes={light:{C6EFCE:{backgroundColor:'#d8f3df',color:'#15603a'},D9EAD3:{backgroundColor:'#e2f2e6',color:'#1f6b44'},FFF2CC:{backgroundColor:'#fff2cf',color:'#8a5a00'},FCE4D6:{backgroundColor:'#fde6dc',color:'#9a4d24'},F4CCCC:{backgroundColor:'#f8d3d3',color:'#a23333'},E6B8B7:{backgroundColor:'#efc5ca',color:'#8f2333'}},ivory:{C6EFCE:{backgroundColor:'#d7eadc',color:'#23573d'},D9EAD3:{backgroundColor:'#dfede1',color:'#2b6346'},FFF2CC:{backgroundColor:'#f7ebc8',color:'#87630b'},FCE4D6:{backgroundColor:'#f5ddd1',color:'#8b5331'},F4CCCC:{backgroundColor:'#f1d1d0',color:'#8f3341'},E6B8B7:{backgroundColor:'#e7c3c7',color:'#7f2f3b'}},dark:{C6EFCE:{backgroundColor:'rgba(35,96,62,.92)',color:'#eafff1'},D9EAD3:{backgroundColor:'rgba(52,110,76,.9)',color:'#f2fff6'},FFF2CC:{backgroundColor:'rgba(113,90,31,.9)',color:'#fff6da'},FCE4D6:{backgroundColor:'rgba(117,73,45,.9)',color:'#fff0e5'},F4CCCC:{backgroundColor:'rgba(123,54,58,.9)',color:'#ffe7e8'},E6B8B7:{backgroundColor:'rgba(106,40,51,.92)',color:'#ffe6eb'}},graphite:{C6EFCE:{backgroundColor:'rgba(36,84,60,.94)',color:'#ecfff3'},D9EAD3:{backgroundColor:'rgba(47,96,70,.92)',color:'#effff4'},FFF2CC:{backgroundColor:'rgba(106,88,38,.92)',color:'#fff7dc'},FCE4D6:{backgroundColor:'rgba(108,71,49,.92)',color:'#fff0e8'},F4CCCC:{backgroundColor:'rgba(116,58,62,.94)',color:'#ffe8ea'},E6B8B7:{backgroundColor:'rgba(102,46,56,.96)',color:'#ffe5e9'}}};const tone=(palettes[theme]||palettes.light)[colorKey]||{};return {...tone,borderColor:'rgba(255,255,255,.08)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.04)',fontWeight:'800'};}
const kpiNvReportRows=computed(()=>{const byLogin=new Map();for(const r of kpiNvFiltered.value){if(!byLogin.has(r.login))byLogin.set(r.login,{login:r.login,NADWE:null,VAS:null});byLogin.get(r.login)[r.rodzaj]=r;}return Array.from(byLogin.values());});
function kpiExportNv(){const reportRows=kpiNvReportRows.value;const now=new Date();const dd=String(now.getDate()).padStart(2,'0'),mm=String(now.getMonth()+1).padStart(2,'0'),yyyy=now.getFullYear(),hh=String(now.getHours()).padStart(2,'0'),mi=String(now.getMinutes()).padStart(2,'0'),ss=String(now.getSeconds()).padStart(2,'0');const dateStr=`${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`;const wsData=[];wsData.push(['NADWE / VAS','','','','','','']);wsData.push(['Report wygenerowano:\n'+dateStr,'NUMBER OF ITEMS','','TOTAL TIME IN THE MASK [H]','','ITEMS PER HOUR','']);wsData.push(['USER LOGIN','NADWE','VAS','NADWE','VAS','NADWE','VAS']);for(const entry of reportRows){const n=entry.NADWE,v=entry.VAS;wsData.push([entry.login,n?n.items:'',v?v.items:'',n?n.time:'',v?v.time:'',n?n.perHour:'',v?v.perHour:'']);}const ws=XLSX.utils.aoa_to_sheet(wsData);ws['!cols']=[{wch:14},{wch:12},{wch:12},{wch:22},{wch:22},{wch:14},{wch:14}];ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:6}},{s:{r:1,c:1},e:{r:1,c:2}},{s:{r:1,c:3},e:{r:1,c:4}},{s:{r:1,c:5},e:{r:1,c:6}}];const nvBorder={style:'thin',color:{rgb:'BFBFBF'}};const nvBorderAll={top:nvBorder,bottom:nvBorder,left:nvBorder,right:nvBorder};for(let r=0;r<=2;r++)for(let c=0;c<=6;c++){const ref=XLSX.utils.encode_cell({r,c});if(!ws[ref])ws[ref]={t:'s',v:''};ws[ref].s={font:{name:'Calibri',sz:r===0?13:11,bold:true},fill:{fgColor:{rgb:'E6E6E6'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:nvBorderAll};}for(let r=3;r<wsData.length;r++){for(let c=0;c<=6;c++){const ref=XLSX.utils.encode_cell({r,c});if(!ws[ref])continue;const st={font:{name:'Calibri',sz:11},alignment:{horizontal:c===0?'left':'center',vertical:'center'},border:nvBorderAll};if(c>=5){const col=kpiNvColorFor(ws[ref].v,kpiNvNormThreshold.value);if(col)st.fill={fgColor:{rgb:col}};}ws[ref].s=st;}}const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'NADWE_VAS');XLSX.writeFile(wb,'NADWE_VAS_ECM_KPI_report.xlsx');showToast('Wygenerowano plik');}
const kpiAnyLoaded=computed(()=>kpiAudit.records.length>0||kpiScalanie.records.length>0||kpiRozk.records.length>0||kpiNv.records.length>0);
const kpiCanGlobalExport=kpiAnyLoaded;
function kpiExportGlobalXlsx(){const sections=[];const add=(title,recs,norm,color)=>{if(recs.length)sections.push({title,records:recs,norm:Number(norm)||0,color});};add('AUDYT',kpiAuditFilteredByGroup.value,kpiNormThreshold.value,'475569');add('SCALANIE',kpiScalanieFilteredByGroup.value,kpiScalanieNormThreshold.value,'475569');add('ROZKŁADANIE',kpiRozkFilteredByGroup.value.filter(r=>r.rodzaj===null),kpiRozkNormThreshold.value,'475569');add('NADWE',kpiNvFilteredByGroup.value.filter(r=>r.rodzaj==='NADWE'),kpiNvNormThreshold.value,'475569');add('VAS',kpiNvFilteredByGroup.value.filter(r=>r.rodzaj==='VAS'),kpiNvNormThreshold.value,'475569');if(!sections.length){showToast('Brak danych');return;}
const COLS=4;const now=new Date();const p2=n=>String(n).padStart(2,'0');const dateStr=`${p2(now.getDate())}.${p2(now.getMonth()+1)}.${now.getFullYear()} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
const rows=[],styles=[],merges=[],heights=[];const blank=()=>Array(COLS).fill('');
const thin={style:'thin',color:{rgb:'BFBFBF'}};const borderAll={top:thin,bottom:thin,left:thin,right:thin};const font=(o={})=>({name:'Calibri',sz:11,...o});
const push=(row,rowStyles,h)=>{rows.push(row);styles.push(rowStyles);heights.push(h?{hpt:h}:{});};
push(['MR. ROBOT · KPI NORMS — RAPORT ZBIORCZY','','',''],Array(COLS).fill({font:font({sz:14,bold:true,color:{rgb:'FFFFFF'}}),fill:{fgColor:{rgb:'1E293B'}},alignment:{horizontal:'left',vertical:'center',indent:1}}),28);merges.push({s:{r:0,c:0},e:{r:0,c:COLS-1}});
push([`Wygenerowano: ${dateStr}   ·   Sekcje: ${sections.map(s=>s.title).join(', ')}`,'','',''],Array(COLS).fill({font:font({sz:10,italic:true,color:{rgb:'475569'}}),fill:{fgColor:{rgb:'F1F5F9'}},alignment:{horizontal:'left',vertical:'center',indent:1}}),20);merges.push({s:{r:1,c:0},e:{r:1,c:COLS-1}});
for(const sec of sections){push(blank(),Array(COLS).fill({}),10);
const tr=rows.length;const below=sec.records.filter(r=>r.perHour<sec.norm).length;
push([`${sec.title}`,'',`NORMA: ${sec.norm} szt./h`,`Poniżej normy: ${below} / ${sec.records.length}`],[{font:font({sz:12,bold:true,color:{rgb:'FFFFFF'}}),fill:{fgColor:{rgb:sec.color}},alignment:{horizontal:'left',vertical:'center',indent:1},border:borderAll},{fill:{fgColor:{rgb:sec.color}},border:borderAll},{font:font({bold:true,color:{rgb:'FFFFFF'}}),fill:{fgColor:{rgb:sec.color}},alignment:{horizontal:'center',vertical:'center'},border:borderAll},{font:font({bold:true,color:{rgb:'FFFFFF'}}),fill:{fgColor:{rgb:sec.color}},alignment:{horizontal:'center',vertical:'center'},border:borderAll}],22);merges.push({s:{r:tr,c:0},e:{r:tr,c:1}});
push(['USER LOGIN','NUMBER OF ITEMS','TOTAL TIME IN THE PROCESS (A+I) (H)','NUMBER OF ITEMS PER HOUR'],Array(COLS).fill({font:font({bold:true,color:{rgb:'1E293B'}}),fill:{fgColor:{rgb:'E2E8F0'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:borderAll}),30);
const sorted=[...sec.records].sort((a,b)=>b.perHour-a.perHour);
sorted.forEach((r,i)=>{const zebra=i%2?'F8FAFC':'FFFFFF';const isBelow=r.perHour<sec.norm;const base=(o={})=>({font:font(),fill:{fgColor:{rgb:zebra}},alignment:{horizontal:'center',vertical:'center'},border:borderAll,...o});
push([r.login,r.items,r.time,r.perHour],[base({font:font({bold:true}),alignment:{horizontal:'left',vertical:'center',indent:1}}),base({numFmt:'#,##0'}),base({numFmt:'0.00'}),base({numFmt:'0.00',font:font({bold:true,color:{rgb:isBelow?'9C0006':'006100'}}),fill:{fgColor:{rgb:isBelow?'FFC7CE':'C6EFCE'}}})]);});}
const ws=XLSX.utils.aoa_to_sheet(rows);
for(let r=0;r<rows.length;r++)for(let c=0;c<COLS;c++){const ref=XLSX.utils.encode_cell({r,c});if(!ws[ref])ws[ref]={t:'s',v:''};const st=styles[r][c];if(st&&Object.keys(st).length){const{numFmt,...rest}=st;ws[ref].s=rest;if(numFmt&&ws[ref].t==='n'){ws[ref].z=numFmt;ws[ref].s.numFmt=numFmt;}}}
ws['!cols']=[{wch:18},{wch:18},{wch:34},{wch:28}];ws['!rows']=heights;ws['!merges']=merges;
const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'RAPORT');XLSX.writeFile(wb,'MrRobot_Norms_Wszystko.xlsx');showToast('Wygenerowano plik');}

// ==================== PRACOWNICY (Grafik.xlsx) ====================
const BUS_TO_SHIFT = { 'A':'AB', 'B':'AB', 'C':'CD', 'D':'CD', '1':'AB', '2':'CD' };

const pracownicy = reactive({
  records: [],
  resignations: [],
  byLogin: new Map(),
  fileName: '',
  savedAt: '',
  saveFailed: false,
  drag: false,
  loading: false,
  progress: { percent: 0, label: '' },
  stats: {
    total: 0,          // unikalnych loginów
    rows: 0,           // wszystkich wierszy
    byFirma: {},       // { SYNAGO: 200, BISAR: 350, ... }
    byProces: {},      // { PICK: 100, KMW: 50, ... }
    byShift: {},       // { AB: 400, CD: 300 }
    bySheet: {}        // { 'UKR procesy': 430, ... }
  }
});
Object.defineProperty(pracownicy, 'loaded', { get() { return this.records.length > 0; } });

function pracownicyRebuild() {
  // 1. Indeks: login → pracownik (priorytet wg sourceSheet)
  const SHEET_PRIORITY = {
    'BRYGADZISTA': 1,
    'DODATKOWE': 2,
    'SPM': 3,
    'PL': 4,
    'UKR procesy': 5
  };
  const map = new Map();
  for (const r of pracownicy.records) {
    const existing = map.get(r.login);
    if (!existing) {
      map.set(r.login, r);
    } else {
      const a = SHEET_PRIORITY[r.sourceSheet] ?? 99;
      const b = SHEET_PRIORITY[existing.sourceSheet] ?? 99;
      if (a < b) map.set(r.login, r);
    }
  }
  pracownicy.byLogin = map;
  
  // 2. Statystyki
  const byFirma = {}, byProces = {}, byShift = {}, bySheet = {};
  for (const r of pracownicy.records) {
    if (r.firma)  byFirma[r.firma]   = (byFirma[r.firma]   || 0) + 1;
    if (r.proces) byProces[r.proces] = (byProces[r.proces] || 0) + 1;
    if (r.shift)  byShift[r.shift]   = (byShift[r.shift]   || 0) + 1;
    if (r.sourceSheet) bySheet[r.sourceSheet] = (bySheet[r.sourceSheet] || 0) + 1;
  }
  pracownicy.stats = {
    total: map.size,
    rows: pracownicy.records.length,
    byFirma, byProces, byShift, bySheet
  };
}

function pracownicyProcessFile(file) {
  if (!file) return;
  pracownicy.loading = true;
  pracownicy.progress.percent = 0;
  pracownicy.progress.label = 'Czytanie pliku…';
  
  const reader = new FileReader();
  reader.onload = e => {
    const buffer = e.target.result;
    const worker = mrRobotMakeWorker(PRACOWNICY_WORKER_CODE);
    
    worker.onmessage = msg => {
      const d = msg.data;
      if (d.type === 'progress') {
        let pct = d.percent;
        if (d.stage === 'read') pct = 5;
        else if (d.stage === 'excel') pct = d.percent;
        else if (d.stage === 'parse') pct = 50 + Math.floor(d.percent * 0.45);
        pracownicy.progress.percent = Math.min(pct, 99);
        pracownicy.progress.label = d.stage === 'read' ? 'Czytanie pliku…'
          : d.stage === 'excel' ? 'Parsowanie Excel…'
          : 'Przetwarzanie arkuszy…';
      } else if (d.type === 'done') {
        pracownicy.progress.percent = 100;
        pracownicy.progress.label = 'Gotowe';
        setTimeout(() => {
          pracownicy.records = markRaw(d.records);
          pracownicy.resignations = markRaw(d.resignations||[]);
          pracownicy.fileName = file.name;
          pracownicyRebuild();
          kpiReapplyPracownicy();
          pracownicySave();
          pracownicy.loading = false;
          mrRobotDisposeWorker(worker);
          showToast(`Pracownicy: ${pracownicy.stats.total} osób (${d.records.length} wierszy)`);
        }, 200);
      } else if (d.type === 'error') {
        mrRobotDisposeWorker(worker);
        pracownicy.loading = false;
        pracownicy.progress.percent = 0;
        pracownicy.progress.label = '';
        showToast('Błąd: ' + d.message);
      }
    };
    
    worker.onerror = err => {
      console.error('Mr. Robot Pracownicy Worker error', err);
      mrRobotDisposeWorker(worker);
      pracownicy.loading = false;
      pracownicy.progress.percent = 0;
      pracownicy.progress.label = '';
      showToast('Błąd modułu Excel.');
    };
    
    worker.postMessage({ buffer });
  };
  
  reader.onerror = () => { pracownicy.loading = false; showToast('Błąd czytania pliku'); };
  reader.readAsArrayBuffer(file);
}

function pracownicyOnFile(e) {
  const f = e.target.files[0];
  if (f) pracownicyProcessFile(f);
}

function pracownicyOnDrop(e) {
  pracownicy.drag = false;
  const f = e.dataTransfer.files[0];
  if (f) pracownicyProcessFile(f);
}

function pracownicyReset() {
  pracownicy.records = [];
  pracownicy.resignations = [];
  pracownicy.byLogin = new Map();
  pracownicy.fileName = '';
  pracownicy.progress.percent = 0;
  pracownicy.progress.label = '';
  pracownicy.stats = { total: 0, rows: 0, byFirma: {}, byProces: {}, byShift: {}, bySheet: {} };
  pracownicy.savedAt = '';
  pracownicy.saveFailed = false;
  try { localStorage.removeItem(PRACOWNICY_STORE_KEY); } catch (e) {}
  kpiReapplyPracownicy();
}
// 💾 Zapamiętanie grafiku w przeglądarce (localStorage)
const PRACOWNICY_STORE_KEY = 'mrrobot_pracownicy_v1';
const PRACOWNICY_FIELDS = ['login','firma','grupa','bus','shift','proces','sourceSheet','name','sex','country','start'];
function pracownicyFmtDate(iso) {
  try { const d = new Date(iso); const p = n => String(n).padStart(2,'0');
    return `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; } catch (e) { return ''; }
}
function pracownicySave() {
  const savedAt = new Date().toISOString();
  try {
    const rows = pracownicy.records.map(r => PRACOWNICY_FIELDS.map(f => r[f] ?? null));
    localStorage.setItem(PRACOWNICY_STORE_KEY, JSON.stringify({ v: 1, fileName: pracownicy.fileName, savedAt, fields: PRACOWNICY_FIELDS, rows, resignations:pracownicy.resignations }));
    pracownicy.savedAt = savedAt;
    pracownicy.saveFailed = false;
  } catch (e) {
    console.warn('Mr. Robot: nie udało się zapisać grafiku', e);
    pracownicy.savedAt = '';
    pracownicy.saveFailed = true;
  }
}
function pracownicyRestore() {
  try {
    const raw = localStorage.getItem(PRACOWNICY_STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.rows) || !Array.isArray(data.fields)) return;
    const records = data.rows.map(row => { const o = {}; data.fields.forEach((f, i) => { o[f] = row[i]; }); return o; });
    if (!records.length) return;
    pracownicy.records = markRaw(records);
    pracownicy.resignations = markRaw(data.resignations||[]);
    pracownicy.fileName = data.fileName || 'Grafik.xlsx';
    pracownicy.savedAt = data.savedAt || '';
    pracownicyRebuild();
  } catch (e) {
    console.warn('Mr. Robot: nie udało się odczytać zapisanego grafiku', e);
  }
}
pracownicyRestore();

// Baza szkoleń integrated with the existing Grafik loader. All records remain local.
const employeeSearch=ref(''),employeeFilter=ref(''),employeeProfile=ref(''),employeeProfileTab=ref('overview');
const employeeTraining=reactive({rows:[],fileName:'',savedAt:'',loading:false,error:''});
const eKey=v=>String(v??'').replace(/\s+/g,'').toUpperCase();
const eNorm=v=>String(v??'').trim().toLocaleLowerCase('pl');
const eText=v=>v==null||v===''?'—':String(v);
const eDate=v=>{if(v==null||v==='')return '—';if(typeof v==='number'){const d=new Date(Math.round((v-25569)*86400000));return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('pl-PL',{timeZone:'UTC'}).format(d);}return String(v);};
const eTime=v=>{if(v==null||v==='')return '—';if(typeof v!=='number')return String(v);const m=Math.round(((v%1)+1)%1*1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
const eDuration=v=>{if(v==null||v==='')return '—';if(typeof v!=='number')return String(v);const m=Math.round(v*1440);return `${Math.floor(m/60)?Math.floor(m/60)+' godz. ':''}${m%60?m%60+' min':m===0?'0 min':''}`;};
const eMsg=(pl,ru,en,uk)=>({pl,ru,en,uk})[uiLanguage.value]||pl;
const employeeResignations=computed(()=>pracownicy.resignations||[]);
const employeeCurrent=computed(()=>employeeTraining.rows.filter(r=>r.current));
const employeeRoster=computed(()=>{
  const people=[...pracownicy.byLogin.values()].map(r=>({id:eKey(r.login),name:r.name||'',source:'grafik'}));
  const ids=new Set(people.map(r=>r.id));
  for(const r of employeeResignations.value){if(!ids.has(r.id)){ids.add(r.id);people.push({id:r.id,name:r.name||'',source:'rezygnacje'});}}
  return people;
});
const employeeMatches=computed(()=>{const q=eNorm(employeeSearch.value);return employeeRoster.value.filter(p=>!q||eNorm(p.id+' '+p.name).includes(q)).slice(0,120);});
const employeeSelected=computed(()=>{
  const id=eKey(employeeProfile.value);const p=pracownicy.byLogin.get(id);
  const resignations=employeeResignations.value.filter(r=>r.id===id);
  const training=employeeTraining.rows.filter(r=>r.id===id);
  const trainer=employeeTraining.rows.find(r=>eKey(r.trainer)===id);
  if(!p&&!resignations.length&&!training.length&&!trainer)return null;
  return {id,p:p||resignations[0]||null,name:p?.name||resignations[0]?.name||training[0]?.name||trainer?.trainerName||id,active:!!p,resignations,training};
});
const employeeFilteredTraining=computed(()=>{const q=eNorm(employeeFilter.value);return (employeeSelected.value?.training||[]).filter(r=>!q||eNorm([r.process,r.trainer,r.trainerName,r.note,r.pke].join(' ')).includes(q));});
const employeeTrainingMinutes=computed(()=>employeeSelected.value?.training.reduce((s,r)=>s+(typeof r.duration==='number'?Math.round(r.duration*1440):0),0)||0);
const employeeProfileFields=computed(()=>{const s=employeeSelected.value;if(!s)return [];const p=s.p||{};return [
[eMsg('Płeć','Пол','Sex','Стать'),p.sex],[eMsg('Kraj','Страна','Country','Країна'),p.country],
[eMsg('Agencja','Агентство','Agency','Агенція'),p.firma],[eMsg('Dział','Отдел','Department','Відділ'),p.proces||p.grupa],
...(s.active?[[eMsg('Zmiana','Смена','Shift','Зміна'),p.shift]]:[]),
[eMsg('Pierwszy dzień','Первый день','First day','Перший день'),eDate(p.start)],
['PD',s.id],[eMsg('Status','Статус','Status','Статус'),s.active?eMsg('W grafiku','В графике','Active roster','У графіку'):eMsg('Poza grafikiem','Не в графике','Not on roster','Поза графіком')]
];});
function employeeOpen(id){employeeProfile.value=eKey(id);employeeProfileTab.value='overview';employeeFilter.value='';if(!employeeSelected.value)showToast(eMsg('Brak danych dla '+id,'Нет данных для '+id,'No data for '+id,'Немає даних для '+id));}
function employeeClose(){employeeProfile.value='';}
function employeeParseTraining(data){
 const wb=XLSX.read(new Uint8Array(data),{type:'array',dense:true,cellFormula:false});const all=[],seen=new Map(),archived=new Set(),current=[];
 const date1904=!!wb.Workbook?.WBProps?.date1904;
 const hn=v=>eNorm(v).replace(/\s+/g,'');
 for(const name of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});
 const hi=rows.findIndex(r=>r.some(c=>hn(c)==='pdszkolącego')&&r.some(c=>hn(c)==='proces'));if(hi<0)continue;
 const headers=rows[hi].map(hn);const col=(...names)=>{for(const n of names){const j=headers.indexOf(hn(n));if(j>=0)return j;}return -1;};
 const get=(r,...names)=>{const j=col(...names);return j>=0?r[j]:'';};const isCurrent=hn(name)==='arkusz1';
 for(const row of rows.slice(hi+1)){
 const id=eKey(get(row,'PD szkolącego')),process=get(row,'Proces');if(!/^(PD\d+|\d+)$/.test(id)||!eNorm(process))continue;
 const r={id,name:get(row,'Imię Nazwisko'),agency:get(row,'Agencja'),date:(v=>typeof v==='number'&&date1904?v+1462:v)(get(row,'Data szkolenia','DATA')),process,trainer:get(row,'PD trenera'),trainerName:get(row,'Imię Nazwisko trenera'),from:get(row,'OD'),to:get(row,'DO'),duration:get(row,'Czas szkolenia'),note:get(row,'Uwagi'),pke:get(row,headers.find(h=>h.startsWith('pkecom'))||'Pkecom'),current:isCurrent,source:name};
 const sig=JSON.stringify([id,eDate(r.date),hn(process),eKey(r.trainer),eTime(r.from),eTime(r.to),hn(r.pke)]);
 if(isCurrent)current.push({...r,signature:sig});else archived.add(sig);
 const previous=seen.get(sig);if(previous){if(previous.current&&!isCurrent)Object.assign(previous,r);else if(!previous.note)previous.note=r.note;continue;}
 all.push(r);seen.set(sig,r);
 }
 }
 if(!all.length)throw Error('Nie znaleziono szkoleń. Wymagane kolumny: PD szkolącego, Proces.');
 return {rows:all,current:current.map(r=>({...r,inHistory:archived.has(r.signature)}))};
}
const EMPLOYEE_DB='mrrobot-training-files';
function employeeDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(EMPLOYEE_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function employeeStorage(action,value){const db=await employeeDb();return new Promise((resolve,reject)=>{const tx=db.transaction('files',action==='get'?'readonly':'readwrite');const st=tx.objectStore('files');const r=action==='get'?st.get('training'):action==='set'?st.put(value,'training'):st.delete('training');tx.oncomplete=()=>{db.close();resolve(r.result);};tx.onerror=()=>{db.close();reject(tx.error);};});}
const employeeCurrentRows=ref([]);
async function employeeLoadTraining(file,restored=null){if(!file&&!restored)return;employeeTraining.loading=true;employeeTraining.error='';try{
 const bytes=restored?restored.bytes:await file.arrayBuffer();const parsed=employeeParseTraining(bytes);
 employeeTraining.rows=markRaw(parsed.rows);employeeCurrentRows.value=markRaw(parsed.current);
 employeeTraining.fileName=restored?restored.name:file.name;employeeTraining.savedAt=restored?restored.savedAt:new Date().toISOString();
 if(!restored){try{await employeeStorage('set',{bytes,name:file.name,savedAt:employeeTraining.savedAt});}catch(e){employeeTraining.error=eMsg('Nie można zapisać pliku lokalnie','Файл не удалось сохранить','Could not save locally','Не вдалося зберегти локально');}}
 }catch(e){employeeTraining.error=e.message||String(e);showToast(employeeTraining.error);}finally{employeeTraining.loading=false;}}
async function employeeOnTrainingFile(e){const f=e.target.files?.[0];if(f)await employeeLoadTraining(f);e.target.value='';}
async function employeeClearTraining(){employeeTraining.rows=[];employeeCurrentRows.value=[];employeeTraining.fileName='';employeeTraining.savedAt='';employeeTraining.error='';try{await employeeStorage('delete');}catch(e){console.warn(e);}}
(async()=>{try{const saved=await employeeStorage('get');if(saved)await employeeLoadTraining(null,saved);}catch(e){console.warn('Training restore unavailable',e);}})();

// ==================== RS (Tote + Manual) ====================
const toteMp=reactive({records:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:''});
const toteRs=reactive({records:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:''});
const toteStatsOpen=ref(false);
const toteOptions=reactive({locationType:[],abc:[],lockDesc:[]});
const toteFilters=reactive({qtyFrom:0,qtyTo:999999,locationType:[],abc:[],lockDesc:[],multiTote:'all',toteType:'all'});
const toteResults=ref([]);
const toteStats=reactive({mpUnique:0,found:0,missing:0,rejected:0,foundPlain:0,foundX2x2:0,foundMulti:0});
const toteSearched=ref(false);
const toteStatsMp=ref({rows:0,uniqueEan:0,singleBinEan:0,reservedEan:0,totalQty:0,locationTypeBreakdown:[],abcBreakdown:[]});
const toteStatsRs=ref({rows:0,uniqueEan:0,plainToteRows:0,x2x2ToteRows:0,plainToteBins:0,x2x2ToteBins:0,multiToteEan:0,multiToteBins:0,totalQty:0});
const toteMpLoaded=computed(()=>toteMp.records.length>0);
const toteRsLoaded=computed(()=>toteRs.records.length>0);
const toteRsPopToteByEan=computed(()=>{const map=new Map();for(const r of toteRs.records){if(!isPopTote(r.shelfType))continue;if(!r.shelfBin)continue;if(!map.has(r.ean))map.set(r.ean,[]);map.get(r.ean).push(r);}return map;});
const toteRsMultiToteShelfBins=computed(()=>{const toteToEans=new Map();for(const r of toteRs.records){if(!isPopTote(r.shelfType))continue;if(!r.shelfBin)continue;if(!toteToEans.has(r.shelfBin))toteToEans.set(r.shelfBin,new Set());toteToEans.get(r.shelfBin).add(r.ean);}const set=new Set();for(const[bin,eans]of toteToEans)if(eans.size>1)set.add(bin);return set;});
const toteRsMultiToteEanSet=computed(()=>{const set=new Set();const multiBins=toteRsMultiToteShelfBins.value;for(const r of toteRs.records){if(!isPopTote(r.shelfType))continue;if(!r.shelfBin)continue;if(multiBins.has(r.shelfBin))set.add(r.ean);}return set;});
const toteCanSearch=computed(()=>toteMp.records.length>0&&toteRs.records.length>0&&!toteMp.loading&&!toteRs.loading);
const toteManualText=ref(''),toteManualResults=ref([]),toteManualMissing=ref([]),toteManualFiltered=ref([]),toteManualSearched=ref(false);
const totePickStrategy=ref('median');
const toteManualToteType=ref('all');
const toteManualMultiTote=ref('all');
const toteManualStats=reactive({input:0,found:0,missing:0,filtered:0});
function parseEanList(text){if(!text)return [];return text.split(/[\s,;]+/).map(s=>s.trim()).filter(s=>s.length>0);}
const toteManualEanCount=computed(()=>parseEanList(toteManualText.value).length);
const toteCanManualSearch=computed(()=>toteRs.records.length>0&&toteManualEanCount.value>0);
function toteBuildOptions(){const uniq=arr=>[...new Set(arr)].sort();toteOptions.locationType=uniq(toteMp.records.map(r=>r.locationType).filter(Boolean));toteOptions.abc=uniq(toteMp.records.map(r=>r.abc).filter(Boolean));toteOptions.lockDesc=uniq(toteMp.records.map(r=>r.lockDesc));toteFilters.locationType=[...toteOptions.locationType];toteFilters.abc=[...toteOptions.abc];toteFilters.lockDesc=[...toteOptions.lockDesc];}
function toteToggleAll(key){if(toteAllChecked(key))toteFilters[key]=[];else toteFilters[key]=[...toteOptions[key]];}
function toteAllChecked(key){return toteOptions[key].length>0&&toteFilters[key].length===toteOptions[key].length;}
function toteProcessFile(file,kind,mod,onDone){if(!file)return;mod.progress.percent=0;mod.progress.label=STAGE_LABELS.read;const reader=new FileReader();reader.onload=e=>{const buffer=e.target.result;const worker=createToteWorker();worker.onmessage=msg=>{const d=msg.data;if(d.type==='progress'){let pct=d.percent;if(d.stage==='read')pct=5;else if(d.stage==='excel')pct=d.percent;else if(d.stage==='parse')pct=60+Math.floor(d.percent*0.35);mod.progress.percent=Math.min(pct,99);mod.progress.label=STAGE_LABELS[d.stage]||'Przetwarzanie…';}else if(d.type==='done'){mod.progress.percent=100;mod.progress.label='Gotowe';setTimeout(()=>{onDone(d.records);mrRobotDisposeWorker(worker);},200);}else if(d.type==='error'){mrRobotDisposeWorker(worker);mod.loading=false;mod.progress.percent=0;mod.progress.label='';showToast('Błąd: '+d.message);}};worker.onerror=err=>{console.error('Mr. Robot Worker error',err);mrRobotDisposeWorker(worker);mod.loading=false;mod.progress.percent=0;mod.progress.label='';showToast('Błąd modułu Excel. Spróbuj ponownie.');};worker.postMessage({buffer,kind});};reader.onerror=()=>showToast('Błąd czytania pliku');reader.readAsArrayBuffer(file);}
function toteComputeStatsMp(records){if(!records.length)return {rows:0,uniqueEan:0,singleBinEan:0,reservedEan:0,totalQty:0,locationTypeBreakdown:[],abcBreakdown:[]};const eanMap=new Map();const reservedEanSet=new Set();let totalQty=0;const ltCount={},abcCount={};for(const r of records){if(!eanMap.has(r.ean))eanMap.set(r.ean,0);eanMap.set(r.ean,eanMap.get(r.ean)+1);totalQty+=r.qty||0;if(r.locationType)ltCount[r.locationType]=(ltCount[r.locationType]||0)+1;if(r.abc)abcCount[r.abc]=(abcCount[r.abc]||0)+1;if(hasReservation(r))reservedEanSet.add(r.ean);}let singleBinEan=0;for(const[,count]of eanMap)if(count===1)singleBinEan++;const locationTypeBreakdown=Object.entries(ltCount).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count:count.toLocaleString('pl-PL')}));const abcBreakdown=Object.entries(abcCount).sort((a,b)=>a[0].localeCompare(b[0])).map(([name,count])=>({name,count:count.toLocaleString('pl-PL')}));return {rows:records.length,uniqueEan:eanMap.size,singleBinEan,reservedEan:reservedEanSet.size,totalQty,locationTypeBreakdown,abcBreakdown};}
function toteComputeStatsRs(records,multiToteEanSet,multiToteShelfBins){if(!records.length)return {rows:0,uniqueEan:0,plainToteRows:0,x2x2ToteRows:0,plainToteBins:0,x2x2ToteBins:0,multiToteEan:0,multiToteBins:0,totalQty:0};const eanSet=new Set();const plainBins=new Set();const x2x2Bins=new Set();let plainRows=0,x2x2Rows=0,totalQty=0;for(const r of records){eanSet.add(r.ean);totalQty+=r.qty||0;if(isPopTote(r.shelfType)&&r.shelfBin){if(is2x2(r.shelfType)){x2x2Rows++;x2x2Bins.add(r.shelfBin);}else{plainRows++;plainBins.add(r.shelfBin);}}}return {rows:records.length,uniqueEan:eanSet.size,plainToteRows:plainRows,x2x2ToteRows:x2x2Rows,plainToteBins:plainBins.size,x2x2ToteBins:x2x2Bins.size,multiToteEan:multiToteEanSet.size,multiToteBins:multiToteShelfBins.size,totalQty};}
function toteOnMpFile(e){const f=e.target.files[0];if(!f)return;toteMp.loading=true;toteProcessFile(f,'MP',toteMp,records=>{toteMp.records=markRaw(records);toteMp.fileName=f.name;toteBuildOptions();toteStatsMp.value=toteComputeStatsMp(records);toteSearched.value=false;toteResults.value=[];scalanieState.results=[];scalanieState.selectedLocations={};scalanieState.result=null;scalanieState.searched=false;konsolidacjaInvalidate();toteMp.loading=false;showToast(`MP załadowane: ${records.length} wierszy`);});}
function toteOnRsFile(e){const f=e.target.files[0];if(!f)return;toteRs.loading=true;toteProcessFile(f,'RS',toteRs,records=>{toteRs.records=markRaw(records);toteRs.fileName=f.name;setTimeout(()=>{toteStatsRs.value=toteComputeStatsRs(records,toteRsMultiToteEanSet.value,toteRsMultiToteShelfBins.value);},0);toteSearched.value=false;toteResults.value=[];toteRs.loading=false;showToast(`RS załadowane: ${records.length} wierszy`);});}
function toteOnMpDrop(e){toteMp.drag=false;const f=e.dataTransfer.files[0];if(f)toteOnMpFile({target:{files:[f]}});}
function toteOnRsDrop(e){toteRs.drag=false;const f=e.dataTransfer.files[0];if(f)toteOnRsFile({target:{files:[f]}});}
function toteResetMp(){toteMp.records=[];toteMp.fileName='';toteMp.drag=false;toteMp.loading=false;toteMp.progress.percent=0;toteMp.progress.label='';toteMp.savedAt='';toteSearched.value=false;toteResults.value=[];scalanieState.results=[];scalanieState.selectedLocations={};scalanieState.result=null;scalanieState.searched=false;konsolidacjaInvalidate();Object.assign(toteStats,{mpUnique:0,found:0,missing:0,rejected:0,foundPlain:0,foundX2x2:0,foundMulti:0});toteStatsMp.value=toteComputeStatsMp([]);toteBuildOptions();}
function toteResetRs(){toteRs.records=[];toteRs.fileName='';toteRs.drag=false;toteRs.loading=false;toteRs.progress.percent=0;toteRs.progress.label='';toteRs.savedAt='';toteSearched.value=false;toteResults.value=[];Object.assign(toteStats,{mpUnique:0,found:0,missing:0,rejected:0,foundPlain:0,foundX2x2:0,foundMulti:0});toteStatsRs.value=toteComputeStatsRs([],new Set(),new Set());toteManualResults.value=[];toteManualMissing.value=[];toteManualFiltered.value=[];toteManualSearched.value=false;Object.assign(toteManualStats,{input:0,found:0,missing:0,filtered:0});}
function toteRunSearch(){if(!toteCanSearch.value)return;const mpByEan=new Map();for(const r of toteMp.records){if(!mpByEan.has(r.ean))mpByEan.set(r.ean,[]);mpByEan.get(r.ean).push(r);}const eligible=[];let rejected=0;for(const[ean,rows]of mpByEan){if(rows.length!==1)continue;const r=rows[0];if(hasReservation(r)){rejected++;continue;}if(r.qty<toteFilters.qtyFrom||r.qty>toteFilters.qtyTo)continue;if(toteFilters.locationType.length&&!toteFilters.locationType.includes(r.locationType))continue;if(toteFilters.abc.length&&!toteFilters.abc.includes(r.abc))continue;if(toteFilters.lockDesc.length&&!toteFilters.lockDesc.includes(r.lockDesc))continue;eligible.push(r);}const out=[];let found=0,missing=0,foundPlain=0,foundX2x2=0,foundMulti=0;const multiBins=toteRsMultiToteShelfBins.value;for(const mp of eligible){let rsRows=toteRsPopToteByEan.value.get(mp.ean);if(!rsRows||rsRows.length===0){missing++;continue;}if(toteFilters.toteType==='plain')rsRows=rsRows.filter(r=>!is2x2(r.shelfType));else if(toteFilters.toteType==='2x2')rsRows=rsRows.filter(r=>is2x2(r.shelfType));if(toteFilters.multiTote==='yes')rsRows=rsRows.filter(r=>multiBins.has(r.shelfBin));else if(toteFilters.multiTote==='no')rsRows=rsRows.filter(r=>!multiBins.has(r.shelfBin));if(!rsRows.length){missing++;continue;}const best=pickMedianByQty(rsRows);if(!best){missing++;continue;}out.push({ean:mp.ean,mpLocation:mp.location,mpQty:mp.qty,tote:best.shelfBin,rsQty:best.qty});found++;if(is2x2(best.shelfType))foundX2x2++;else foundPlain++;if(multiBins.has(best.shelfBin))foundMulti++;}toteResults.value=out;toteStats.mpUnique=eligible.length;toteStats.found=found;toteStats.missing=missing;toteStats.rejected=rejected;toteStats.foundPlain=foundPlain;toteStats.foundX2x2=foundX2x2;toteStats.foundMulti=foundMulti;toteSearched.value=true;showToast(`Znaleziono ${found} / ${eligible.length}`);}function toteExportExcel(){if(!toteResults.value.length)return;const wb=XLSX.utils.book_new();const data=[['EAN (SKU)','Polka (MP)','Qty (MP)','TOTE (RS)','Inventory Qty (RS)']];for(const r of toteResults.value)data.push([r.ean,r.mpLocation,r.mpQty,r.tote+',',r.rsQty]);const ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:18},{wch:18},{wch:12},{wch:20},{wch:20}];XLSX.utils.book_append_sheet(wb,ws,'Wyniki');XLSX.writeFile(wb,'MP_RS_Tote_Result.xlsx');showToast('Wygenerowano plik');}
function toteRunManualSearch(){if(!toteCanManualSearch.value)return;const eans=parseEanList(toteManualText.value);const uniqueEans=[...new Set(eans)];const found=[],missing=[],filtered=[];const multiBins=toteRsMultiToteShelfBins.value;for(const ean of uniqueEans){let rsRows=toteRsPopToteByEan.value.get(ean);if(!rsRows||rsRows.length===0){missing.push(ean);continue;}if(toteManualToteType.value==='plain')rsRows=rsRows.filter(r=>!is2x2(r.shelfType));else if(toteManualToteType.value==='2x2')rsRows=rsRows.filter(r=>is2x2(r.shelfType));if(toteManualMultiTote.value==='yes')rsRows=rsRows.filter(r=>multiBins.has(r.shelfBin));else if(toteManualMultiTote.value==='no')rsRows=rsRows.filter(r=>!multiBins.has(r.shelfBin));if(!rsRows.length){filtered.push(ean);continue;}const best=pickToteByStrategy(rsRows,totePickStrategy.value);if(!best){missing.push(ean);continue;}found.push({ean,tote:best.shelfBin,rsQty:best.qty});}toteManualResults.value=found;toteManualMissing.value=missing;toteManualFiltered.value=filtered;toteManualStats.input=uniqueEans.length;toteManualStats.found=found.length;toteManualStats.missing=missing.length;toteManualStats.filtered=filtered.length;toteManualSearched.value=true;showToast(`Znaleziono ${found.length} / ${uniqueEans.length}`);}function toteExportManualExcel(){if(!toteManualResults.value.length)return;const wb=XLSX.utils.book_new();const data=[['EAN (SKU)','TOTE (RS)','Inventory Qty (RS)']];for(const r of toteManualResults.value)data.push([r.ean,r.tote+',',r.rsQty]);const ws=XLSX.utils.aoa_to_sheet(data);XLSX.utils.book_append_sheet(wb,ws,'Wyniki');XLSX.writeFile(wb,'Manual_SKU_Tote_Result.xlsx');showToast('Wygenerowano plik');}
async function toteCopyManualToClipboard(){if(!toteManualResults.value.length)return;const lines=['EAN (SKU)\tTOTE (RS)\tInventory Qty (RS)'];for(const r of toteManualResults.value){const toteWithComma=r.tote?r.tote+',':'';lines.push([r.ean,toteWithComma,r.rsQty].join('\t'));}const text=lines.join('\n');try{await navigator.clipboard.writeText(text);showToast('Skopiowano do schowka');}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast('Skopiowano');}catch(e){showToast('Nie udało się skopiować');}document.body.removeChild(ta);}}

// ==================== MP (Audyt) ====================
// ==================== MP Scalanie ====================
const scalanieState=reactive({shelfChoice:'',eanChoice:'',abcChoice:'',skuMin:1,skuMax:3,exportQty:300,results:[],selectedLocations:{},result:null,searched:false});
const SCALANIE_SHELF_OPTIONS=[
  {key:'1',label:'SHELF_S',desc:'Standardowe lokalizacje S',file:'SINSAY.csv'},
  {key:'2',label:'SHELF_L',desc:'Tylko SHELF_L',file:'SIAcc.csv'},
  {key:'3',label:'SHELF_L_PLUS',desc:'Tylko SHELF_L_PLUS',file:'SIAcc.csv'},
  {key:'4',label:'SHELF_L + SHELF_L_PLUS',desc:'Wszystkie lokalizacje L',file:'SIAcc.csv'},
  {key:'5',label:'SHELF_2L',desc:'Tylko SHELF_2L',file:'SILad.csv'},
  {key:'6',label:'SHELF_XXL',desc:'Tylko SHELF_XXL',file:'SILad.csv'},
  {key:'7',label:'SHELF_2L + SHELF_XXL',desc:'Wszystkie lokalizacje duzego gabarytu',file:'SILad.csv'}
];
const SCALANIE_ABC_OPTIONS=[{key:'1',label:'A'},{key:'2',label:'B'},{key:'3',label:'C'},{key:'4',label:'D'},{key:'5',label:'A + B'},{key:'6',label:'C + D'},{key:'7',label:'A + B + C + D'}];
const SCALANIE_NEED_EAN=['1','5','6','7'];
const scalanieNeedEan=computed(()=>SCALANIE_NEED_EAN.includes(scalanieState.shelfChoice));
const scalanieCanRun=computed(()=>toteMp.records.length>0&&scalanieState.shelfChoice!==''&&scalanieState.abcChoice!=='');
function scalanieMatchShelf(locType,mode){if(mode==='')return false;switch(mode){case '1':return locType==='SHELF_S';case '2':return locType==='SHELF_L';case '3':return locType==='SHELF_L_PLUS';case '4':return locType==='SHELF_L'||locType==='SHELF_L_PLUS';case '5':return locType==='SHELF_2L';case '6':return locType==='SHELF_XXL';case '7':return locType==='SHELF_2L'||locType==='SHELF_XXL';default:return false;}}
function scalanieMatchABC(abc,mode){const v=String(abc).trim().toUpperCase();switch(mode){case '1':return v==='A';case '2':return v==='B';case '3':return v==='C';case '4':return v==='D';case '5':return v==='A'||v==='B';case '6':return v==='C'||v==='D';case '7':return v==='A'||v==='B'||v==='C'||v==='D';default:return false;}}
function scalanieMatchEAN(count,mode){if(mode==='1')return count===1;return count>1;}
function scalanieBlank(v){if(v===undefined||v===null)return true;return String(v).trim()==='';}
function scalanieRun(){if(!scalanieCanRun.value)return;const recs=toteMp.records;const dict=new Map();for(const r of recs){if(r.ean){dict.set(r.ean,(dict.get(r.ean)||0)+1);}}const min=scalanieState.skuMin,max=scalanieState.skuMax,exportQty=scalanieState.exportQty;const shelfMode=scalanieState.shelfChoice;const eanMode=scalanieNeedEan.value?scalanieState.eanChoice||'2':'2';const abcMode=scalanieState.abcChoice;const out=[];for(const r of recs){const eanCount=dict.get(r.ean)||0;if(scalanieMatchShelf(r.locationType,shelfMode)&&scalanieMatchABC(r.abc,abcMode)&&r.qty>=min&&r.qty<=max&&scalanieBlank(r.raw4)&&scalanieBlank(r.raw5)&&scalanieBlank(r.raw15)&&scalanieBlank(r.raw16)&&scalanieMatchEAN(eanCount,eanMode)){out.push(r);}}const sorted=[...out].sort((a,b)=>a.location.localeCompare(b.location));const exported=sorted.slice(0,exportQty);scalanieState.results=exported;scalanieState.selectedLocations=Object.fromEntries(exported.map(r=>[r.location,true]));scalanieState.result={totalFound:out.length,exported:exported.length,shelfMode,eanMode,abcMode,eanCount:dict.size};scalanieState.searched=true;showToast(`Scalanie: ${out.length} rekordow, wyeksportowano ${exported.length}`);}
function scalanieExportCSV(){if(!scalanieState.results.length)return;const shelfOpt=SCALANIE_SHELF_OPTIONS.find(o=>o.key===scalanieState.shelfChoice);const fileName=shelfOpt?shelfOpt.file:'Scalanie.csv';const lines=scalanieState.results.filter(r=>scalanieState.selectedLocations[r.location]!==false).map(r=>r.location);if(!lines.length){showToast(tr('Nie zaznaczono żadnych lokalizacji'));return;}const csv=lines.join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);showToast(`Wyeksportowano: ${fileName}`);}
async function scalanieCopyClipboard(){if(!scalanieState.results.length)return;const selected=scalanieState.results.filter(r=>scalanieState.selectedLocations[r.location]!==false);if(!selected.length){showToast(tr('Nie zaznaczono żadnych lokalizacji'));return;}const text=selected.map(r=>r.location).join('\n');try{await navigator.clipboard.writeText(text);showToast(tr('Skopiowano {count} lokalizacji').replace('{count}',selected.length));}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(tr('Skopiowano {count} lokalizacji').replace('{count}',selected.length));}catch(e){showToast('Nie udało się skopiować');}document.body.removeChild(ta);}}
function scalanieReset(){scalanieState.shelfChoice='';scalanieState.eanChoice='';scalanieState.abcChoice='';scalanieState.skuMin=1;scalanieState.skuMax=3;scalanieState.exportQty=300;scalanieState.results=[];scalanieState.selectedLocations={};scalanieState.result=null;scalanieState.searched=false;}

const scalanieTab=ref('scalanie');
const konsolidacja=reactive({percent:20,minLocations:5,result:null,top:[],report:[],open:{},sel:{}});
function konsolidacjaRoundHalfEven(v){const n=Number(v)||0;const f=Math.floor(n),d=n-f;if(d<0.5)return f;if(d>0.5)return f+1;return f%2===0?f:f+1;}
function konsolidacjaInvalidate(){konsolidacja.result=null;konsolidacja.top=[];konsolidacja.report=[];konsolidacja.open={};konsolidacja.sel={};}
function konsolidacjaClearResult(){konsolidacjaInvalidate();}
function konsolidacjaReset(){konsolidacja.percent=20;konsolidacja.minLocations=5;konsolidacjaInvalidate();}
function konsolidacjaRun(){
if(!toteMpLoaded.value||toteMp.loading)return;
const pct=Number(konsolidacja.percent);
if(!isFinite(pct)||pct<1||pct>50){showToast('Próg analizy: podaj wartość od 1 do 50%');return;}
const minLoc=Number(konsolidacja.minLocations);
if(!Number.isInteger(minLoc)||minLoc<1){showToast('Minimalna liczba lokalizacji: podaj liczbę całkowitą co najmniej 1');return;}
const dict=new Map();
for(const r of toteMp.records){
const ean=String(r.ean||'').trim();if(!ean)continue;
const loc=String(r.location||'').trim();
const qty=Number(r.qty)||0;
let d=dict.get(ean);
if(!d){d={mainLoc:loc,mainType:String(r.locationType||'').trim(),maxItems:qty,rows:[]};dict.set(ean,d);}
else if(qty>d.maxItems){d.mainLoc=loc;d.mainType=String(r.locationType||'').trim();d.maxItems=qty;}
d.rows.push({loc,qty,type:String(r.locationType||'').trim()});
}
const arr=[];
for(const [ean,d] of dict){
const smallLimit=d.maxItems*(pct/100);
let smallCount=0;const small=[];
for(const e of d.rows){
if(e.loc!==d.mainLoc&&e.qty>0&&e.qty<=smallLimit){smallCount++;small.push(e);}
}
arr.push({ean,mainLoc:d.mainLoc,mainType:d.mainType,maxItems:d.maxItems,allCount:d.rows.length,smallLimit,smallCount,small});
}
for(let i=0;i<arr.length-1;i++){for(let j=i+1;j<arr.length;j++){if(arr[j].smallCount>arr[i].smallCount){const t=arr[i];arr[i]=arr[j];arr[j]=t;}}}
konsolidacja.top=arr.slice(0,10);
konsolidacja.report=arr.filter(e=>e.smallCount>0&&e.smallCount>=minLoc).map(e=>({...e,limitRounded:konsolidacjaRoundHalfEven(e.smallLimit)}));
konsolidacja.open={};konsolidacja.sel={};
for(const e of konsolidacja.report){konsolidacja.open[e.ean]=false;konsolidacja.sel[e.ean]=e.small.map(()=>true);}
const totalSmall=konsolidacja.report.reduce((s,e)=>s+e.smallCount,0);
const totalSmallQty=konsolidacja.report.reduce((s,e)=>s+e.small.reduce((x,y)=>x+y.qty,0),0);
konsolidacja.result={percent:pct,minLocations:minLoc,liczbaEAN:konsolidacja.report.length,totalEAN:arr.length,totalSmall,totalSmallQty};
showToast(`Analiza konsolidacji zakończona — EAN w raporcie: ${konsolidacja.report.length}`);
}
async function konsolidacjaCopyText(text,okMsg){try{await navigator.clipboard.writeText(text);showToast(okMsg);}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(e2){ok=false;}document.body.removeChild(ta);showToast(ok?okMsg:'Nie udało się skopiować');}}
async function konsolidacjaCopyEan(){if(!konsolidacja.report.length)return;const text=konsolidacja.report.map(e=>e.ean).join('\n');await konsolidacjaCopyText(text,`Skopiowano ${konsolidacja.report.length} EAN`);}
function konsolidacjaToggle(ean){konsolidacja.open[ean]=!konsolidacja.open[ean];}
function konsolidacjaSelCount(e){const arr=konsolidacja.sel[e.ean];if(!arr)return 0;return arr.filter(Boolean).length;}
function konsolidacjaIsAllSel(e){const arr=konsolidacja.sel[e.ean];if(!arr||!e.small.length)return false;return arr.every(Boolean);}
function konsolidacjaSelAll(e){const arr=konsolidacja.sel[e.ean];if(!arr)return;const all=konsolidacjaIsAllSel(e);for(let i=0;i<arr.length;i++)arr[i]=!all;}
async function konsolidacjaCopyCard(e){const arr=konsolidacja.sel[e.ean];if(!arr)return;const lines=[];for(let i=0;i<e.small.length;i++){if(arr[i])lines.push(e.small[i].loc);}if(!lines.length){showToast('Zaznacz przynajmniej jedną lokalizację');return;}await konsolidacjaCopyText(lines.join('\n'),`Skopiowano ${lines.length} lokalizacji (${e.ean})`);}

const audytTab=ref('al_audyt');
const audyt=reactive({rows:[],formatkaRows:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',result:null});
const formatka59=reactive({result:null});
Object.defineProperty(audyt,'loaded',{get(){return this.rows.length>0;}});
function audytOnFile(e){const f=e.target.files[0];if(!f)return;audyt.loading=true;audyt.progress.percent=0;audyt.progress.label=STAGE_LABELS.read;audyt.result=null;formatka59.result=null;const reader=new FileReader();reader.onload=ev=>{const buffer=ev.target.result;const worker=createAudytWorker();worker.onmessage=msg=>{const d=msg.data;if(d.type==='progress'){let pct=d.percent;if(d.stage==='read')pct=5;else if(d.stage==='excel')pct=d.percent;else if(d.stage==='parse')pct=60+Math.floor(d.percent*0.35);audyt.progress.percent=Math.min(pct,99);audyt.progress.label=STAGE_LABELS[d.stage]||'Przetwarzanie…';}else if(d.type==='done'){audyt.progress.percent=100;audyt.progress.label='Gotowe';setTimeout(()=>{audyt.rows=markRaw(d.records);if(d.formatkaRecords)audyt.formatkaRows=markRaw(d.formatkaRecords);audyt.fileName=f.name;audyt.loading=false;mrRobotDisposeWorker(worker);showToast(`Audyt: ${d.records.length} wierszy (arkusz: ${d.sheetName})`);},200);}else if(d.type==='error'){mrRobotDisposeWorker(worker);audyt.loading=false;audyt.progress.percent=0;audyt.progress.label='';showToast('Błąd: '+d.message);}};worker.onerror=err=>{console.error('Mr. Robot Audit Worker error',err);mrRobotDisposeWorker(worker);audyt.loading=false;audyt.progress.percent=0;audyt.progress.label='';showToast('Błąd modułu Excel. Spróbuj ponownie.');};worker.postMessage({buffer,kind:'AUDYT'});};reader.onerror=()=>{audyt.loading=false;showToast('Błąd czytania pliku');};reader.readAsArrayBuffer(f);}
function audytOnDrop(e){audyt.drag=false;const f=e.dataTransfer.files[0];if(f)audytOnFile({target:{files:[f]}});}
function audytReset(){audyt.rows=[];audyt.formatkaRows=[];audyt.fileName='';audyt.savedAt='';audyt.result=null;formatka59.result=null;audyt.progress.percent=0;audyt.progress.label='';}
function audytRunAnalysis(){
if(!audyt.rows.length){showToast('Brak danych');return;}
let correctLoc=0,shortage=0,surplus=0;
const dict=new Map();
for(const r of audyt.rows){
const inc=String(r.incident||'').toLowerCase().trim();
if(inc==='-'||inc===''){correctLoc++;}
else if(inc.indexOf('shortage')>=0){shortage++;}
else if(inc.indexOf('surplus')>=0){surplus++;}
const info=String(r.info||'').trim();
if(info!==''&&info!=='INFO'){
if(!dict.has(info))dict.set(info,[0,0,0]);
const arr=dict.get(info);
if(inc.indexOf('shortage')>=0){arr[0]=arr[0]+1;}
else if(inc.indexOf('surplus')>=0){arr[1]=arr[1]+1;}
arr[2]=arr[2]+1;
dict.set(info,arr);
}
}
const totalLoc=correctLoc+shortage+surplus;
const errorLoc=shortage+surplus;
const odsetek=totalLoc>0?errorLoc/totalLoc:0;
const infoRows=[];
let totalShort=0,totalSurp=0,totalAll=0;
for(const [name,arr] of dict.entries()){
const sh=arr[0],su=arr[1],tt=arr[2];
const od=tt>0?(sh+su)/tt:0;
infoRows.push({name,shortage:sh,surplus:su,total:tt,odsetek:od});
totalShort+=sh;totalSurp+=su;totalAll+=tt;
}
audyt.result={correctLoc,shortage,surplus,totalLoc,errorLoc,odsetek,infoRows,totalShort,totalSurp,totalAll};
showToast(`Gotowe! Poprawne: ${correctLoc}, Braki: ${shortage}, Nadwyżki: ${surplus}`);
}
function audytExportExcel(){
if(!audyt.result)return;
const wb=XLSX.utils.book_new();
const wsData=[];
wsData.push([]);wsData.push([]);wsData.push([]);wsData.push([]);wsData.push([]);
wsData.push(['','','','','Lokacje poprawne:',audyt.result.correctLoc]);
wsData.push(['','','','','Lokacje z brakami:',audyt.result.shortage]);
wsData.push(['','','','','Lokacje z nadwyzkami:',audyt.result.surplus]);
wsData.push(['','','','','Total lokacje:',audyt.result.totalLoc]);
wsData.push(['','','','','Bledne:',audyt.result.errorLoc]);
wsData.push(['','','','','odsetek:',audyt.result.odsetek]);
wsData.push([]);
wsData.push(['','','','','','','','','','INFO','Shortage','Surplus','Total','odsetek']);
for(const r of audyt.result.infoRows){
wsData.push(['','','','','','','','','',r.name,r.shortage,r.surplus,r.total,r.odsetek]);
}
const totalOd=audyt.result.totalAll>0?(audyt.result.totalShort+audyt.result.totalSurp)/audyt.result.totalAll:0;
wsData.push(['','','','','','','','','','TOTAL',audyt.result.totalShort,audyt.result.totalSurp,audyt.result.totalAll,totalOd]);
const ws=XLSX.utils.aoa_to_sheet(wsData);
ws['!cols']=[{wch:10},{wch:10},{wch:10},{wch:10},{wch:22},{wch:12},{wch:10},{wch:10},{wch:3},{wch:28},{wch:12},{wch:12},{wch:12},{wch:12}];
const thinBorder={style:'thin',color:{rgb:'BFBFBF'}};
const borderAll={top:thinBorder,bottom:thinBorder,left:thinBorder,right:thinBorder};
for(let r=5;r<=10;r++){
for(let c=4;c<=5;c++){
const ref=XLSX.utils.encode_cell({r,c});
if(!ws[ref])ws[ref]={t:'s',v:''};
ws[ref].s={font:{name:'Calibri',sz:11,bold:c===4,color:{rgb:'000000'}},fill:{fgColor:{rgb:'F5F5F5'}},alignment:{horizontal:c===5?'right':'left',vertical:'center'},border:borderAll};
}
}
const f11=XLSX.utils.encode_cell({r:10,c:5});
if(ws[f11]){ws[f11].z='0.0%';}
for(let c=9;c<=13;c++){
const ref=XLSX.utils.encode_cell({r:12,c});
if(!ws[ref])ws[ref]={t:'s',v:''};
ws[ref].s={font:{name:'Calibri',sz:11,bold:true,color:{rgb:'000000'}},fill:{fgColor:{rgb:'E6E6E6'}},alignment:{horizontal:c===9?'left':'center',vertical:'center'},border:borderAll};
}
const totalRowIdx=13+audyt.result.infoRows.length;
for(let c=9;c<=13;c++){
const ref=XLSX.utils.encode_cell({r:totalRowIdx,c});
if(!ws[ref])ws[ref]={t:'s',v:''};
ws[ref].s={font:{name:'Calibri',sz:11,bold:true,color:{rgb:'000000'}},fill:{fgColor:{rgb:'E6E6E6'}},alignment:{horizontal:c===9?'left':'center',vertical:'center'},border:borderAll};
}
const odsetekCol=13;
for(let i=0;i<audyt.result.infoRows.length;i++){
const rowIdx=13+i;
const r=audyt.result.infoRows[i];
const ref=XLSX.utils.encode_cell({r:rowIdx,c:odsetekCol});
if(ws[ref]){
ws[ref].z='0.0%';
let fillColor='C8F0C8';
if(r.odsetek>0.1)fillColor='FFC8C8';
else if(r.odsetek>=0.05)fillColor='FFEBB4';
ws[ref].s={font:{name:'Calibri',sz:11,color:{rgb:'000000'}},fill:{fgColor:{rgb:fillColor}},alignment:{horizontal:'center',vertical:'center'},border:borderAll};
}
for(let c=9;c<=12;c++){
const rr=XLSX.utils.encode_cell({r:rowIdx,c});
if(ws[rr]){ws[rr].s={font:{name:'Calibri',sz:11,color:{rgb:'000000'}},alignment:{horizontal:c===9?'left':'center',vertical:'center'},border:borderAll};}
}
}
const totalOdRef=XLSX.utils.encode_cell({r:totalRowIdx,c:odsetekCol});
if(ws[totalOdRef]){
ws[totalOdRef].z='0.0%';
let fillColor='C8F0C8';
if(totalOd>0.1)fillColor='FFC8C8';
else if(totalOd>=0.05)fillColor='FFEBB4';
ws[totalOdRef].s={font:{name:'Calibri',sz:11,bold:true,color:{rgb:'000000'}},fill:{fgColor:{rgb:fillColor}},alignment:{horizontal:'center',vertical:'center'},border:borderAll};
}
XLSX.utils.book_append_sheet(wb,ws,'RAPORT');
XLSX.writeFile(wb,'AL_AUDYT_Report.xlsx');
showToast('Wygenerowano AL_AUDYT_Report.xlsx');
}
async function audytCopyKpiValues(){
if(!audyt.result)return;
const vals=[
audyt.result.correctLoc,
audyt.result.shortage,
audyt.result.surplus,
audyt.result.totalLoc,
audyt.result.errorLoc,
(audyt.result.odsetek*100).toFixed(1).replace('.',',')+'%'
];
const text=vals.join('\n');
await konsolidacjaCopyText(text,'Skopiowano 6 wartości KPI (kolumna)');
}
async function audytCopyToClipboard(){
if(!audyt.result)return;
const lines=['INFO\tShortage\tSurplus\tTotal\tOdsetek'];
for(const r of audyt.result.infoRows){
lines.push([r.name,r.shortage,r.surplus,r.total,(r.odsetek*100).toFixed(1).replace('.',',')+'%'].join('\t'));
}
const totalOd=audyt.result.totalAll>0?(audyt.result.totalShort+audyt.result.totalSurp)/audyt.result.totalAll:0;
lines.push(['TOTAL',audyt.result.totalShort,audyt.result.totalSurp,audyt.result.totalAll,(totalOd*100).toFixed(1).replace('.',',')+'%'].join('\t'));
const text=lines.join('\n');
try{await navigator.clipboard.writeText(text);showToast('Skopiowano do schowka');}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast('Skopiowano');}catch(e){showToast('Nie udało się skopiować');}document.body.removeChild(ta);}
}

// ==================== AUDYT GEEK (RS) — Stocktake order ====================
const GEEK_REASON_MAP=[
['Shortage',['shortage','brak','нестач']],
['surplus',['surplus','nadwy','надлиш']],
['Extra sku',['extra sku','dodatkowe sku','зайвий sku']],
['Major damage',['major damage','powazne uszkodzenie','poważne uszkodzenie','значні']]
];
const GEEK_CATS=[
{key:'Shortage',label:'Shortage',cls:'red',ico:'🔻'},
{key:'surplus',label:'Surplus',cls:'orange',ico:'🔺'},
{key:'Extra sku',label:'Extra sku',cls:'purple',ico:'📦'},
{key:'Major damage',label:'Major damage',cls:'gray',ico:'🛠️'}
];
const geek=reactive({drag:false,loading:false,progress:{percent:0,label:''},fileName:'',sheetName:'',result:null,filter:'',sel:{},opSel:{},savedAt:''});
function geekKeyOf(rec){return rec.key2;}
const geekListOptions=computed(()=>{if(!geek.result||!geek.result.recs)return[];const m=new Map();for(const r of geek.result.recs){const k=geekKeyOf(r);m.set(k,(m.get(k)||0)+1);}return [...m.entries()].map(([key,count])=>({key,count,label:key===''?'(bez nazwy)':key})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));});
const geekOpLabel=v=>v===''?'(brak operatora)':v;
const geekOpOptions=computed(()=>{if(!geek.result||!geek.result.recs||!geek.result.hasOp)return[];const all=new Map(),inSel=new Map();for(const r of geek.result.recs){all.set(r.op,(all.get(r.op)||0)+1);if(geek.sel[r.key2])inSel.set(r.op,(inSel.get(r.op)||0)+1);}return [...all.keys()].map(key=>({key,count:inSel.get(key)||0,label:geekOpLabel(key)})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));});
const geekOpSelCount=computed(()=>geekOpOptions.value.filter(o=>geek.opSel[o.key]).length);
const geekSelCount=computed(()=>geekListOptions.value.filter(o=>geek.sel[o.key]).length);
const GEEK_RET_KEY='AUDYT RET';
const geekRetMode=computed(()=>{const keys=geekListOptions.value.filter(o=>geek.sel[o.key]).map(o=>o.key);return keys.length>0&&keys.every(k=>String(k).toUpperCase()===GEEK_RET_KEY);});
const geekT1=computed(()=>{if(!geek.result||!geek.result.recs||geek.result.missing1.length)return null;
if(geekRetMode.value){const toty=new Set(),przeg=new Set(),totyBad=new Set(),przegBad=new Set();let sztuk=0,rows=0;
for(const r of geek.result.recs){if(!geek.sel[r.key2])continue;if(geek.result.hasOp&&!geek.opSel[r.op])continue;rows++;sztuk+=r.qty;const pref=r.shelf.length>=10?r.shelf.slice(0,10):r.shelf;toty.add(pref);przeg.add(r.shelf);if(r.exc==='YES'){totyBad.add(pref);przegBad.add(r.shelf);}}
return {ret:true,przeliczone:rows,totPrzel:toty.size,przegPrzel:przeg.size,sztuk,totPopr:toty.size-totyBad.size,przegBad:przegBad.size,sumaBad:totyBad.size};}
let poprawne=0,braki=0,nadwyzki=0,przepelnione=0,wada=0,przeliczone=0,bledne=0,sztuk=0;for(const r of geek.result.recs){if(!geek.sel[geekKeyOf(r)])continue;if(geek.result.hasOp&&!geek.opSel[r.op])continue;przeliczone++;sztuk+=r.qty;if(r.exc==='YES')bledne++;if(r.exc==='NO')poprawne++;if(r.cat==='Shortage')braki++;else if(r.cat==='surplus')nadwyzki++;else if(r.cat==='Extra sku')przepelnione++;else if(r.cat==='Major damage')wada++;}return {poprawne,braki,nadwyzki,przepelnione,wada,przeliczone,bledne,odsetek:przeliczone>0?bledne/przeliczone:0,sztuk};});
function geekSelectAll(v){const o={};for(const x of geekListOptions.value)o[x.key]=!!v;geek.sel=o;}
function geekOpSelectAll(v){const o={};for(const x of geekOpOptions.value)o[x.key]=!!v;geek.opSel=o;}
function geekResetFilters(){geekSelectAll(true);geekOpSelectAll(true);}

function geekRetCalc(list){const toty=new Set(),przeg=new Set(),totyBad=new Set(),przegBad=new Set();let sztuk=0;for(const r of list){sztuk+=r.qty;const pref=r.shelf.length>=10?r.shelf.slice(0,10):r.shelf;toty.add(pref);przeg.add(r.shelf);if(r.exc==='YES'){totyBad.add(pref);przegBad.add(r.shelf);}}return {totPrzel:toty.size,przegPrzel:przeg.size,sztuk,totPopr:toty.size-totyBad.size,przegBad:przegBad.size,sumaBad:totyBad.size};}
// AUDYT RET: grupowanie kategorii bledow po lokalizacji; liczba sztuk mieszanych jest sumowana osobno z Stocktake qty.
// Lokalizacje powtarzające się należą tylko do kategorii pomieszanych artykułów.
function geekRetDetails(list){
 // AUDYT RET: licz tylko wiersze z uzupelnionym Exception reason (AG).
 const errorRows=list.filter(r=>String(r.reason||'').trim()!=='');
 const mixedPieces=errorRows.reduce((sum,r)=>sum+(r.qty>0?r.qty:0),0);
 // Shelf bin wskazuje przegrodke (np. ...F1A, ...F2A).
 // Dla pomieszanych artykulow porownujemy wspolna lokalizacje
 // bez dwoch koncowych znakow (numer przegrodki + jej oznaczenie).
 const byLocation=new Map();
 for(const r of errorRows){
  const shelf=String(r.shelf||'').trim();
  if(!shelf)continue;
  const location=shelf.length>2?shelf.slice(0,-2):shelf;
  if(!byLocation.has(location))byLocation.set(location,[]);
  byLocation.get(location).push(r);
 }
 const out={mixedTots:0,mixedPieces:0,nadwyTots:0,nadwyPieces:0,brakTots:0,brakPieces:0,extraTots:0,extraPieces:0,damageTots:0,damagePieces:0,unlabelledTots:0,unlabelledPieces:0};
 for(const locationRows of byLocation.values()){
  if(locationRows.length>=2){
   out.mixedTots++;
   // POMIESZANYCH SZT. is summed once across all errorRows below.
   continue; // wszystkie wiersze tej lokalizacji wykluczone z innych bledow
  }
  const r=locationRows[0];
  const n=Math.max(0,r.n||0);
  if(r.cat==='surplus'){out.nadwyTots++;out.nadwyPieces+=n;}
  else if(r.cat==='Shortage'){out.brakTots++;out.brakPieces+=n;}
  else if(r.cat==='Extra sku'){out.extraTots++;out.extraPieces+=n;}
  else if(r.cat==='Major damage'){out.damageTots++;out.damagePieces+=n;}
 }
 out.mixedPieces=mixedPieces;
 return out;
}

const geekGroups=computed(()=>{if(!geek.result||!geek.result.recs||geek.result.missing2.length)return null;
const map=new Map();const retRecs=[];
for(const r of geek.result.recs){if(!r.key2)continue;if(!geek.sel[r.key2])continue;if(geek.result.hasOp&&!geek.opSel[r.op])continue;
if(r.key2.toUpperCase()===GEEK_RET_KEY){retRecs.push(r);continue;}
if(!map.has(r.key2)){const cats={};for(const c of GEEK_CATS)cats[c.key]={count:0,szt:0,skus:[]};map.set(r.key2,{name:r.key2,total:0,bledne:0,c:cats});}
const g=map.get(r.key2);g.total++;
if(r.exc==='YES'){g.bledne++;if(r.cat){const o=g.c[r.cat];o.count++;o.szt+=r.n;if(r.sku)o.skus.push(r.sku);}}}
const groups=[];
for(const g of map.values()){const cats=[];for(const c of GEEK_CATS){const o=g.c[c.key];if(o.count>0)cats.push({key:c.key,label:c.label,cls:c.cls,ico:c.ico,count:o.count,szt:o.szt,skus:o.skus,skuText:o.skus.join(', ')});}
const out={name:g.name,total:g.total,bledne:g.bledne,odsetek:g.total>0?g.bledne/g.total:0,cats};out.text=geekGroupText(out);groups.push(out);}
if(retRecs.length){const t=geekRetCalc(retRecs);const lines=[['TOTY PRZELICZONE',t.totPrzel,'blue'],['PRZEGRÓDKI PRZELICZONE',t.przegPrzel,'purple'],['SZTUKI PRZELICZONE',t.sztuk.toLocaleString('pl-PL'),'blue'],['TOTY POPRAWNE',t.totPopr,'green'],['PRZEGRÓDKI NIE POPRAWNE',t.przegBad,'red'],['SUMA NIEPOPRAWNYCH TOTÓW',t.sumaBad,'red']];
const d=geekRetDetails(retRecs);
lines.push(['ODSETEK BŁĘDÓW',geekPct(t.totPrzel?t.sumaBad/t.totPrzel:0,2),'red'],
 ['TOTY Z POMESZANYMI ART. W PRZEGRÓDKACH',d.mixedTots,'orange'],
 ['POMIESZANYCH SZT.',d.mixedPieces,'orange'],
 ['TOTY Z NADWE',d.nadwyTots,'orange'],['NADWE SZT.',d.nadwyPieces,'orange'],
 ['TOTY Z BRAKIEM',d.brakTots,'red'],['BRAK SZT.',d.brakPieces,'red'],
 ['TOTY PRZEPEŁNIONE',d.extraTots,'purple'],['PRZEPEŁNIONE SZT.',d.extraPieces,'purple'],
 ['TOTY Z WADĄ',d.damageTots,'red'],['WADA SZT.',d.damagePieces,'red'],
 ['TOTY Z ART. BEZ METKI',0,'gray'],['BRAK METKI SZT.',0,'gray']);
groups.push({name:'AUDYT RET',ret:true,lines,text:['AUDYT RET'].concat(lines.map(l=>'     '+l[0]+': '+l[1])).join('\n')});}
return groups;});
const geekFilterNote=computed(()=>{if(!geek.result||!geek.result.recs)return '';const parts=[];if(geekSelCount.value<geekListOptions.value.length)parts.push('grupy '+geekSelCount.value+'/'+geekListOptions.value.length);if(geek.result.hasOp&&geekOpSelCount.value<geekOpOptions.value.length)parts.push('operatorzy '+geekOpSelCount.value+'/'+geekOpOptions.value.length);return parts.join(' · ');});
const geekGroupsFiltered=computed(()=>{const gr=geekGroups.value;if(!gr)return[];const q=String(geek.filter||'').trim().toLowerCase();if(!q)return gr;return gr.filter(g=>g.name.toLowerCase().indexOf(q)>=0);});
function geekPct(x,d){return ((Number(x)||0)*100).toFixed(d).replace('.',',')+'%';}
function geekStr(v){return v==null?'':String(v).trim();}
function geekNum(v){if(typeof v==='number')return isFinite(v)?v:0;const s=geekStr(v).replace(',','.');const m=s.match(/^[-+]?\d*\.?\d+/);return m?parseFloat(m[0]):0;}
function geekCategory(reason){const r=geekStr(reason).replace(/\u00a0/g,' ').trim().toLowerCase();for(const [k,list] of GEEK_REASON_MAP){for(const p of list){if(r.startsWith(p))return k;}}return '';}
function geekReasonQty(reason){const s=geekStr(reason);const d=s.lastIndexOf('-');if(d<0)return 0;const part=s.slice(d+1).trim();if(/^[-+]?\d+([.,]\d+)?$/.test(part))return Math.round(parseFloat(part.replace(',','.')));return 0;}
function geekPrefix(name){const s=geekStr(name).replace(/\u00a0/g,' ').replace(/ +/g,' ').trim();if(!s)return '';const p=s.split(' ');return p.length>1?(p[0]+' '+p[1]).trim():p[0];}
function geekGroupText(g){const L=[g.name,'     Total przeliczone: '+g.total,'     Total błędne: '+g.bledne];for(const c of g.cats){L.push('     '+c.label+': '+c.count+' totów ( '+c.szt+' szt.)');if(c.skus.length)L.push('       EAN: '+c.skuText);}return L.join('\n');}
function geekCompute(rows){
const hdr=(rows[0]||[]).map(c=>geekStr(c));
const col=n=>hdr.indexOf(n);
const cOp=(()=>{const i=hdr.findIndex(h=>h.toLowerCase()==='operator');return i>=0?i:(hdr.length>15?15:-1);})();
const cShelf=col('Shelf bin'),cQty=col('Stocktake qty'),cExc=col('Exception'),cReason=col('Exception reason'),cName=col('Stocktake name'),cSku=col('SKU code');
let lastIdx=0;for(let i=rows.length-1;i>=1;i--){const a=rows[i]&&rows[i][0];if(geekStr(a)!==''){lastIdx=i;break;}}
const miss=(pairs)=>pairs.filter(p=>p[1]<0).map(p=>p[0]);
const missing1=miss([['Shelf bin',cShelf],['Stocktake qty',cQty],['Exception',cExc],['Exception reason',cReason]]);
const missing2=miss([['Shelf bin',cShelf],['Exception',cExc],['Exception reason',cReason],['Stocktake name',cName],['SKU code',cSku]]);
let recs=null;
if(cShelf>=0&&cExc>=0&&cReason>=0){recs=[];
for(let i=1;i<=lastIdx;i++){const r=rows[i]||[];if(geekStr(r[cShelf])==='')continue;
const nm=cName>=0?geekStr(r[cName]).replace(/\u00a0/g,' ').replace(/ +/g,' ').trim():'';
recs.push({excelRow:i+1,shelf:geekStr(r[cShelf]),op:cOp>=0?geekStr(r[cOp]):'',key1:nm?nm.split(' ')[0]:'',key2:nm?geekPrefix(nm):'',qty:cQty>=0?geekNum(r[cQty]):0,exc:geekStr(r[cExc]).toUpperCase(),reason:geekStr(r[cReason]),cat:geekCategory(r[cReason]),n:geekReasonQty(r[cReason]),sku:cSku>=0?geekStr(r[cSku]):''});}}
let rowCount=0;for(let i=1;i<=lastIdx;i++){const r=rows[i]||[];if(geekStr(r[cShelf])!=='')rowCount++;}
return {hasOp:cOp>=0,recs,missing1,missing2,rowCount};
}
function geekT1Rows(){const t=geekT1.value;if(!t)return[];if(t.ret)return [['TOTY PRZELICZONE',t.totPrzel],['PRZEGRÓDKI PRZELICZONE',t.przegPrzel],['SZTUKI PRZELICZONE',t.sztuk.toLocaleString('pl-PL')],['TOTY POPRAWNE',t.totPopr],['PRZEGRÓDKI NIE POPRAWNE',t.przegBad],['SUMA NIEPOPRAWNYCH TOTÓW',t.sumaBad]];return [['Toty poprawne',t.poprawne],['Toty z brakami',t.braki],['Toty z nadwyżkami',t.nadwyzki],['Toty przepełnione',t.przepelnione],['Toty z wadą',t.wada],['Total toty przeliczone',t.przeliczone],['Total toty błędne',t.bledne],['Odsetek błędnych',geekPct(t.odsetek,2)],['Sztuk przeliczone',t.sztuk]];}
async function geekCopy(text,okMsg){try{await navigator.clipboard.writeText(text);showToast(okMsg);}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(okMsg);}catch(e){showToast('Nie udało się skopiować');}document.body.removeChild(ta);}}
function geekCopyT1(){const rows=geekT1Rows();if(!rows.length)return;geekCopy(['Metryka\tWartość'].concat(rows.map(r=>r[0]+'\t'+r[1])).join('\n'),'Skopiowano Tabelę 1');}
function geekCopyT1Values(){const rows=geekT1Rows();if(!rows.length)return;const ret=!!(geekT1.value&&geekT1.value.ret);geekCopy(rows.map(r=>String(r[1])).join(ret?'\t':'\n'),ret?'Skopiowano wartości Tabeli 1 (wiersz)':'Skopiowano wartości Tabeli 1 (kolumna)');}
function geekCopyT2(){const gr=geekGroups.value;if(!gr||!gr.length)return;geekCopy(gr.map(g=>g.text).join('\n\n'),'Skopiowano Tabelę 2 ('+gr.length+' grup)');}
function geekCopyGroup(g){geekCopy(g.ret&&geekRetMode.value?g.lines.map(l=>String(l[1])).join('\t'):g.text,'Skopiowano grupę '+g.name);}
function geekCopyList(g,c){geekCopy(c.skus.join('\n'),'Skopiowano EAN-y: '+c.label+' ('+c.skus.length+')');}
function geekReset(){geek.result=null;geek.sel={};geek.opSel={};geek.fileName='';geek.sheetName='';geek.filter='';geek.progress.percent=0;geek.progress.label='';geek.loading=false;}
function geekOnFile(e){const f=e.target.files&&e.target.files[0];try{e.target.value='';}catch(x){}if(!f)return;
if(!/\.(xlsx|xls|xlsm)$/i.test(f.name)){showToast('Wybierz plik Excel (.xlsx / .xls)');return;}
geek.loading=true;geek.progress.percent=0;geek.progress.label=STAGE_LABELS.read;
const reader=new FileReader();
reader.onload=ev=>{const buffer=ev.target.result;const worker=mrRobotMakeWorker(GEEK_WORKER_CODE);
worker.onmessage=msg=>{const d=msg.data;
if(d.type==='progress'){geek.progress.percent=Math.min(d.stage==='read'?5:d.percent,99);geek.progress.label=STAGE_LABELS[d.stage]||'Przetwarzanie…';}
else if(d.type==='done'){geek.progress.percent=100;geek.progress.label='Gotowe';
setTimeout(()=>{try{const res=geekCompute(d.rows);geek.result=markRaw(res);geek.fileName=f.name;geek.sheetName=d.sheetName;geek.filter='';geekResetFilters();geek.loading=false;
const t1=geekT1.value;if(t1&&t1.ret)showToast('AUDYT RET: toty '+t1.totPrzel+', przegródki '+t1.przegPrzel+', niepoprawne toty: '+t1.sumaBad);else if(t1)showToast('AUDYT GEEK: '+t1.przeliczone+' totów, błędne: '+t1.bledne+' ('+geekPct(t1.odsetek,2)+')');else showToast('AUDYT GEEK: brak wymaganych kolumn');}catch(err){geek.loading=false;console.error(err);showToast('Błąd analizy: '+err.message);}mrRobotDisposeWorker(worker);},200);}
else if(d.type==='error'){mrRobotDisposeWorker(worker);geek.loading=false;geek.progress.percent=0;geek.progress.label='';showToast('Błąd: '+d.message);}};
worker.onerror=err=>{console.error('Mr. Robot Geek Worker error',err);mrRobotDisposeWorker(worker);geek.loading=false;geek.progress.percent=0;geek.progress.label='';showToast('Błąd modułu Excel. Spróbuj ponownie.');};
worker.postMessage({buffer,kind:'GEEK'});};
reader.onerror=()=>{geek.loading=false;showToast('Błąd czytania pliku');};
reader.readAsArrayBuffer(f);}
function geekOnDrop(e){geek.drag=false;const f=e.dataTransfer.files[0];if(f)geekOnFile({target:{files:[f]}});}

// ==================== FORMATKA_59 ====================
function formatka59RunAnalysis(){
if(!audyt.formatkaRows||!audyt.formatkaRows.length){showToast('Najpierw wczytaj plik ECM_AI_Audit.xlsx w zakładce AL_AUDYT');return;}
const allRows=audyt.formatkaRows;
const rows=allRows.filter(r=>String(r.location||'').trim().substring(0,3)==='MP2');
if(!rows.length){showToast('Brak wierszy MP2 w pliku');return;}
const uniqueLocations=new Set();
let sumaZliczonychSztuk=0,sztukiBezPowtorzen=0;
let qtyMinus=0,qtyIncident=0,qtyShortage=0,qtySurplus=0;
let locShortage=0,locSurplus=0;
for(const r of rows){
const loc=String(r.location||'').trim();if(loc)uniqueLocations.add(loc);
const inc=String(r.incident||'').trim();
const uq=r.uniqueQty||0;const cq=r.countedQty||0;const dq=r.diffQty||0;
sumaZliczonychSztuk+=cq;
sztukiBezPowtorzen+=uq;
if(inc==='-')qtyMinus+=uq;
else if(inc==='Incident')qtyIncident+=uq;
else if(inc==='Shortage'){qtyShortage+=dq;locShortage++;}
else if(inc==='Surplus'){qtySurplus+=dq;locSurplus++;}
}
const zliczoneLokalizacje=rows.length;
const lokalizacjeUnikatowe=uniqueLocations.size;
const brak=Math.abs(qtyShortage);
const razem=brak+qtySurplus;
formatka59.result={
sumaZliczonychSztuk,sztukiBezPowtorzen,qtyMinus,qtyIncident,brak,nadwyzka:qtySurplus,
zliczoneLokalizacje,lokalizacjeUnikatowe,locShortage,locSurplus,
niezgodnosc:locShortage+locSurplus,razem
};
showToast(`FORMATKA_59: ${lokalizacjeUnikatowe} pulki, ${locShortage+locSurplus} niezgodności`);
}
async function formatka59CopyToClipboard(){
if(!formatka59.result)return;
const r=formatka59.result;
const text=[r.lokalizacjeUnikatowe,r.niezgodnosc,r.sztukiBezPowtorzen,r.brak,r.nadwyzka,r.razem].join('\t');
try{await navigator.clipboard.writeText(text);showToast('Skopiowano formatkę do schowka');}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast('Skopiowano formatkę');}catch(e){showToast('Nie udało się skopiować');}document.body.removeChild(ta);}
}

// ==================== GODZINY_MDT ====================
const mdt=reactive({rows:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',result:null,etap2:null,copyQty:10,randomMode:false,selectedLoc:new Set(),locSearch:'',showPolki11:false});
Object.defineProperty(mdt,'loaded',{get(){return this.rows.length>0;}});
function mdtOnFile(e){const f=e.target.files[0];if(!f)return;mdt.loading=true;mdt.progress.percent=0;mdt.progress.label=STAGE_LABELS.read;mdt.result=null;mdt.etap2=null;mdt.selectedLoc=new Set();mdt.locSearch='';const reader=new FileReader();reader.onload=ev=>{const buffer=ev.target.result;const worker=createMdtWorker();worker.onmessage=msg=>{const d=msg.data;if(d.type==='progress'){let pct=d.percent;if(d.stage==='read')pct=5;else if(d.stage==='excel')pct=d.percent;else if(d.stage==='parse')pct=95;mdt.progress.percent=Math.min(pct,99);mdt.progress.label=STAGE_LABELS[d.stage]||'Przetwarzanie…';}else if(d.type==='done'){mdt.progress.percent=100;mdt.progress.label='Gotowe';setTimeout(()=>{mdt.rows=markRaw(d.records);mdt.fileName=f.name;mdt.loading=false;mrRobotDisposeWorker(worker);showToast(`MDT: ${d.records.length} wierszy (arkusz: ${d.sheetName})`);},200);}else if(d.type==='error'){mrRobotDisposeWorker(worker);mdt.loading=false;mdt.progress.percent=0;mdt.progress.label='';showToast('Błąd: '+d.message);}};worker.onerror=err=>{console.error('Mr. Robot MDT Worker error',err);mrRobotDisposeWorker(worker);mdt.loading=false;mdt.progress.percent=0;mdt.progress.label='';showToast('Błąd modułu Excel. Spróbuj ponownie.');};worker.postMessage({buffer});};reader.onerror=()=>{mdt.loading=false;showToast('Błąd czytania pliku');};reader.readAsArrayBuffer(f);}
function mdtOnDrop(e){mdt.drag=false;const f=e.dataTransfer.files[0];if(f)mdtOnFile({target:{files:[f]}});}
function mdtReset(){mdt.rows=[];mdt.fileName='';mdt.savedAt='';mdt.result=null;mdt.etap2=null;mdt.progress.percent=0;mdt.progress.label='';mdt.selectedLoc=new Set();mdt.locSearch='';mdt.showPolki11=false;}
function mdtNum(v){const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?0:n;}
function mdtRunAnalysis(){
if(!mdt.rows.length){showToast('Brak danych');return;}
const rows=mdt.rows;
// ETAP 1: filter rows (skip header row at index 0 and 1)
// VBA: rows 3+ = index 2+; row 1 = headers, row 2 = header row
// Actually VBA uses row 2 as header, data starts at row 3 (index 2)
// Columns (0-based): A=0, B=1, D=3, E=4, K=10
const filtered=[];let sumaMDT=0;
for(let i=2;i<rows.length;i++){const r=rows[i];if(!r||r.every(c=>c===''||c===null))continue;const bVal=String(r[1]||'').trim();const dVal=String(r[3]||'').trim();if(bVal.substring(0,3)==='MP1'||dVal.substring(0,1)==='1'){continue;}const eVal=mdtNum(r[4]);sumaMDT+=eVal;filtered.push(r);}
// Remove duplicates by column B (index 1)
const seen=new Set();const deduped=[];for(const r of filtered){const bVal=String(r[1]||'').trim();if(!seen.has(bVal)){seen.add(bVal);deduped.push(r);}}
const sumaPolek=deduped.length;
let sumaStock=0;for(const r of deduped){sumaStock+=mdtNum(r[10]);}
// Filter 1/1: keep only rows where E == K (col 4 == col 10)
const oneToOne=[];for(const r of deduped){const eVal=mdtNum(r[4]);const kVal=mdtNum(r[10]);if(eVal===kVal){oneToOne.push(r);}}
const polki11=oneToOne.length;let szt11=0;for(const r of oneToOne){szt11+=mdtNum(r[4]);}
mdt.result={sumaPolek,sumaMDT,sumaStock,polki11,szt11,dedupedRows:deduped,oneToOneRows:oneToOne};
// ETAP 2: remove SPD/PKecom from deduped, sort by K desc
const etap2Rows=deduped.filter(r=>{const aVal=String(r[0]||'').trim();return aVal.substring(0,3)!=='SPD'&&aVal.substring(0,6)!=='PKecom';});
const sorted=[...etap2Rows].sort((a,b)=>mdtNum(b[10])-mdtNum(a[10]));
const polki11Rows=[...oneToOne].sort((a,b)=>mdtNum(b[10])-mdtNum(a[10]));
mdt.etap2={rows:sorted,totalLocations:sorted.length,polki11Rows,totalPolki11:polki11Rows.length};
showToast(`MDT: Półki: ${sumaPolek}, MDT: ${sumaMDT}, 1/1: ${polki11}`);
}
function mdtExportCSV(){
if(!mdt.etap2)return;
const pool=mdt.etap2.polki11Rows;
if(!pool||!pool.length)return;
const qty=Math.min(mdt.copyQty||1,pool.length);
let selected;
if(mdt.randomMode){const shuffled=[...pool];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}selected=shuffled.slice(0,qty);}else{selected=pool.slice(0,qty);}
// Column B (index 1) values, sorted ascending
const locations=selected.map(r=>String(r[1]||'').trim()).sort();
const csv=locations.join('\n');
const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='SPR MDT.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);showToast(`Wyeksportowano SPR MDT.csv (${locations.length})`);
}
const mdtFilteredPolki11=computed(()=>{
if(!mdt.etap2||!mdt.etap2.polki11Rows)return[];
const q=mdt.locSearch.trim().toLowerCase();if(!q)return mdt.etap2.polki11Rows;
return mdt.etap2.polki11Rows.filter(r=>String(r[1]||'').toLowerCase().includes(q));
});
const mdtFilteredAllSelected=computed(()=>mdtFilteredPolki11.value.length>0&&mdtFilteredPolki11.value.every(r=>mdt.selectedLoc.has(String(r[1]||'').trim())));
function mdtToggleLoc(loc){if(mdt.selectedLoc.has(loc)){mdt.selectedLoc=new Set([...mdt.selectedLoc].filter(x=>x!==loc));}else{mdt.selectedLoc=new Set([...mdt.selectedLoc,loc]);}}
function mdtSelectAll11(){const rows=mdtFilteredPolki11.value;const allSel=rows.length>0&&rows.every(r=>mdt.selectedLoc.has(String(r[1]||'').trim()));if(allSel){const s=new Set(mdt.selectedLoc);for(const r of rows)s.delete(String(r[1]||'').trim());mdt.selectedLoc=s;}else{const s=new Set(mdt.selectedLoc);for(const r of rows)s.add(String(r[1]||'').trim());mdt.selectedLoc=s;}}
function mdtClearSelected11(){mdt.selectedLoc=new Set();}
async function mdtCopyKpiValues(){
if(!mdt.result)return;
const vals=[mdt.result.sumaPolek,mdt.result.sumaMDT,mdt.result.sumaStock,mdt.result.polki11,mdt.result.szt11];
const text=vals.join('\t');
await konsolidacjaCopyText(text,'Skopiowano 5 wartości KPI (rząd)');
}
async function mdtCopySelectedLoc(){if(mdt.selectedLoc.size===0){showToast('Brak wybranych lokalizacji');return;}const text=[...mdt.selectedLoc].sort().join('\n');try{await navigator.clipboard.writeText(text);showToast(`Skopiowano ${mdt.selectedLoc.size} lokalizacji`);}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(`Skopiowano ${mdt.selectedLoc.size} lokalizacji`);}catch(e){showToast('Nie udało się skopiować');}document.body.removeChild(ta);}}

// ==================== STOCK ====================
const stock=reactive({rows:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',result:null,selectedPeriods:new Set(),selectedLoc:new Set(),locSearch:''});
Object.defineProperty(stock,'loaded',{get(){return this.rows.length>0;}});
function stockOnFile(e){const f=e.target.files[0];if(!f)return;stock.loading=true;stock.progress.percent=0;stock.progress.label=STAGE_LABELS.read;stock.result=null;stock.selectedPeriods=new Set();stock.selectedLoc=new Set();const reader=new FileReader();reader.onload=ev=>{const buffer=ev.target.result;const worker=createStockWorker();worker.onmessage=msg=>{const d=msg.data;if(d.type==='progress'){let pct=d.percent;if(d.stage==='read')pct=5;else if(d.stage==='excel')pct=d.percent;else if(d.stage==='parse')pct=95;stock.progress.percent=Math.min(pct,99);stock.progress.label=STAGE_LABELS[d.stage]||'Przetwarzanie…';}else if(d.type==='done'){stock.progress.percent=100;stock.progress.label='Gotowe';setTimeout(()=>{stock.rows=markRaw(d.records);stock.fileName=f.name;stock.loading=false;mrRobotDisposeWorker(worker);showToast(`STOCK: ${d.records.length} wierszy (arkusz: ${d.sheetName})`);},200);}else if(d.type==='error'){mrRobotDisposeWorker(worker);stock.loading=false;stock.progress.percent=0;stock.progress.label='';showToast('Błąd: '+d.message);}};worker.onerror=err=>{console.error('Mr. Robot STOCK Worker error',err);mrRobotDisposeWorker(worker);stock.loading=false;stock.progress.percent=0;stock.progress.label='';showToast('Błąd modułu Excel. Spróbuj ponownie.');};worker.postMessage({buffer});};reader.onerror=()=>{stock.loading=false;showToast('Błąd czytania pliku');};reader.readAsArrayBuffer(f);}
function stockOnDrop(e){stock.drag=false;const f=e.dataTransfer.files[0];if(f)stockOnFile({target:{files:[f]}});}
function stockReset(){stock.rows=[];stock.fileName='';stock.savedAt='';stock.result=null;stock.selectedPeriods=new Set();stock.selectedLoc=new Set();stock.locSearch='';stock.progress.percent=0;stock.progress.label='';}
const stockFilteredRows=computed(()=>{return stock.rows.filter(r=>{const a=String(r.loc||'').trim().toUpperCase();const f=String(r.who||'').trim().toUpperCase();if(a.substring(0,3)==='MP1')return false;if(f.substring(0,6)==='PKECOM')return false;if(f.substring(0,1)==='S')return false;return true;});});
const stockStats=computed(()=>({total:stock.rows.length,filtered:stockFilteredRows.value.length}));
const stockPeriods=computed(()=>{const list=[];const seen=new Set();for(const r of stockFilteredRows.value){if(!r.date||!r.hour)continue;const key=r.date+' '+r.hour;if(!seen.has(key)){seen.add(key);list.push({key,date:r.date,hour:r.hour});}}return list;});
const stockPeriodsGrouped=computed(()=>{const groups=[];const gmap=new Map();for(const p of stockPeriods.value){if(!gmap.has(p.date)){const g={date:p.date,periods:[]};gmap.set(p.date,g);groups.push(g);}gmap.get(p.date).periods.push(p);}return groups;});
function stockTogglePeriod(key){const s=new Set(stock.selectedPeriods);if(s.has(key))s.delete(key);else s.add(key);stock.selectedPeriods=s;}
function stockClearPeriods(){stock.selectedPeriods=new Set();}
function stockGenerate(){if(stock.selectedPeriods.size===0){showToast('Wybierz najpierw okres (godziny)');return;}const rows=stockFilteredRows.value.filter(r=>stock.selectedPeriods.has(r.date+' '+r.hour));if(!rows.length){showToast('Nie znaleziono lokalizacji dla wybranych okresów');return;}const sorted=[...rows].sort((x,y)=>x.loc<y.loc?-1:x.loc>y.loc?1:0);const uniqueLoc=new Set(sorted.map(r=>r.loc)).size;const keys=[...stock.selectedPeriods].sort();stock.result={rows:sorted,totalRows:sorted.length,uniqueLoc,from:keys[0],to:keys[keys.length-1]};stock.selectedLoc=new Set();stock.locSearch='';showToast(`STOCK: ${sorted.length} wierszy (${uniqueLoc} lokalizacji)`);}
const stockFilteredLoc=computed(()=>{if(!stock.result)return[];const q=stock.locSearch.trim().toLowerCase();if(!q)return stock.result.rows;return stock.result.rows.filter(r=>r.loc.toLowerCase().includes(q));});
const stockAllLocSelected=computed(()=>{const rows=stockFilteredLoc.value;if(!rows.length)return false;const uniq=new Set(rows.map(r=>r.loc));for(const l of uniq){if(!stock.selectedLoc.has(l))return false;}return true;});
function stockToggleLoc(loc){const s=new Set(stock.selectedLoc);if(s.has(loc))s.delete(loc);else s.add(loc);stock.selectedLoc=s;}
function stockSelectAllLoc(){const rows=stockFilteredLoc.value;const uniq=new Set(rows.map(r=>r.loc));const allSel=uniq.size>0&&[...uniq].every(l=>stock.selectedLoc.has(l));const s=new Set(stock.selectedLoc);if(allSel){for(const l of uniq)s.delete(l);}else{for(const l of uniq)s.add(l);}stock.selectedLoc=s;}
async function stockCopySelectedLoc(){if(stock.selectedLoc.size===0){showToast('Brak wybranych lokalizacji');return;}const text=[...stock.selectedLoc].sort().join('\n');try{await navigator.clipboard.writeText(text);showToast(`Skopiowano ${stock.selectedLoc.size} lokalizacji`);}catch(err){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(`Skopiowano ${stock.selectedLoc.size} lokalizacji`);}catch(e){showToast('Nie udało się skopiować');}document.body.removeChild(ta);}}

// ==================== PRZESTOJE (Analiza_Przestojów) ====================
function mrPad2(n){return n<10?'0'+n:''+n;}
function fmtPrzestoj(min){const h=Math.floor(min/60);const m=Math.round(min%60);return h+'h '+mrPad2(m)+'m';}
function fmtDateTime(ts){const d=new Date(ts);return d.getFullYear()+'-'+mrPad2(d.getMonth()+1)+'-'+mrPad2(d.getDate())+' '+mrPad2(d.getHours())+':'+mrPad2(d.getMinutes())+':'+mrPad2(d.getSeconds());}
function przestojColor(min){if(min>=30)return{background:'#ff0000',color:'#fff'};if(min>=20)return{background:'#ff6666',color:'#fff'};if(min>=10)return{background:'#ffa500',color:'#1e293b'};if(min>=8)return{background:'#ffff00',color:'#1e293b'};return{};}
const przestoje=reactive({rows:[],fileName:'',drag:false,loading:false,progress:{percent:0,label:''},savedAt:'',minMin:8});

const ARTLTT_LOCATION_TYPES=['KONT_AMR','SHELF_2L','SHELF_L','SHELF_L_PLUS','SHELF_M','SHELF_S','SHELF_XL','SHELF_XS','SHELF_XXL','SHELF_XXL_PLUS'];
const ARTLTT_VALUE_KEYS={KONT_AMR:'vA',SHELF_2L:'v2L',SHELF_L:'vL',SHELF_L_PLUS:'vLP',SHELF_S:'vS',SHELF_XXL:'vXXL'};
const ARTLTT_PER_FILE=1000;

// Inne / Kreseczki: local Code 128 barcode generation.
const kreseczki=reactive({input:'',value:'',svg:'',width:0,height:0,error:''});
function kreseczkiGenerate(){
 kreseczki.error='';
 try{const v=String(kreseczki.input);const result=window.MRCode128.render(v);
  kreseczki.value=v;kreseczki.svg=result.svg;kreseczki.width=result.width;kreseczki.height=result.height;
 }catch(e){kreseczki.svg='';kreseczki.value='';kreseczki.error=e.message==='ascii'?'Dozwolone są tylko znaki ASCII (bez polskich liter).':'Wprowadź od 1 do 180 znaków.';}
}
function kreseczkiClear(){kreseczki.input='';kreseczki.value='';kreseczki.svg='';kreseczki.error='';}
function kreseczkiDownload(blob,extension){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Code128_'+Date.now()+'.'+extension;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function kreseczkiSaveSvg(){if(kreseczki.svg)kreseczkiDownload(new Blob([kreseczki.svg],{type:'image/svg+xml;charset=utf-8'}),'svg');}
function kreseczkiSavePng(){if(!kreseczki.svg)return;const img=new Image();const source=URL.createObjectURL(new Blob([kreseczki.svg],{type:'image/svg+xml;charset=utf-8'}));
 img.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=kreseczki.width*2;canvas.height=kreseczki.height*2;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(blob)kreseczkiDownload(blob,'png');else showToast(tr('Nie udało się zapisać PNG.'));},'image/png');}catch(e){showToast(tr('Nie udało się zapisać PNG.'));}finally{URL.revokeObjectURL(source);}};
 img.onerror=()=>{URL.revokeObjectURL(source);showToast(tr('Nie udało się zapisać PNG.'));};img.src=source;
}
function kreseczkiPrint(){if(!kreseczki.svg)return;const w=window.open('','_blank','width=800,height=600');if(!w){showToast(tr('Zezwól na wyskakujące okna, aby drukować.'));return;}
 w.document.open();w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Code 128</title><style>body{margin:30px;text-align:center;font-family:Arial,sans-serif}svg{max-width:100%;height:auto}@page{margin:14mm}</style></head><body>'+kreseczki.svg+'</body></html>');w.document.close();w.focus();w.addEventListener('load',()=>w.print(),{once:true});}

const artltt=reactive({text:'',vA:0,v2L:0,vL:0,vLP:0,vS:0,vXXL:0,sep:';',result:null});
const artlttPreview=computed(()=>{if(!artltt.result||!artltt.result.rows.length)return[];return artltt.result.rows.slice(0,20).map(r=>[r[0],r[1],r[2],r[3],String(r[4])]);});
function artlttCsvField(v){const s=String(v==null?'':v);return /[";,\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function artlttClear(){artltt.result=null;}
function artlttRun(){
const seen=new Set();const models=[];const lines=String(artltt.text||'').split('\n');let nonEmpty=0;
for(const line of lines){const full=line.trim();if(!full)continue;nonEmpty++;const model=(full.indexOf('-')>=0?full.split('-')[0]:full);if(!seen.has(model)){seen.add(model);models.push(model);}}
if(!models.length){showToast('Wklej przynajmniej jedną nazwę produktu');return;}
const values={};for(const t of ARTLTT_LOCATION_TYPES){const k=ARTLTT_VALUE_KEYS[t];values[t]=k?(Number(artltt[k])||0):0;}
const rows=[];for(const name of models){for(const t of ARTLTT_LOCATION_TYPES){rows.push([name,'*','*',t,values[t]]);}}
const files=[];for(let s=0;s<rows.length;s+=ARTLTT_PER_FILE){const chunk=rows.slice(s,s+ARTLTT_PER_FILE);const fileNr=files.length+1;const csvName='LTT_'+String(fileNr).padStart(3,'0')+'.csv';const csv=[['ArtModel','ArtFarb','ArtGrs','LttNam','ArtLttMgMax'].map(c=>artlttCsvField(c)).join(artltt.sep)];for(const r of chunk){csv.push(r.map(c=>artlttCsvField(c)).join(artltt.sep));}const csvText=csv.join('\r\n');files.push({name:csvName,text:csvText,articles:chunk.length/10,rows:chunk.length});}
const types=ARTLTT_LOCATION_TYPES.map(t=>({name:t,value:values[t]}));
artltt.result={uniqueCount:models.length,dupCount:nonEmpty-models.length,rowCount:rows.length,files,rows,types};
showToast(`ARTLTT: ${models.length} nazw → ${files.length} plik(ów) CSV`);
}
function artlttDownloadFile(f){const blob=new Blob([f.text],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=f.name;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);}
function artlttDownload(name){if(!artltt.result)return;const f=artltt.result.files.find(x=>x.name===name);if(f)artlttDownloadFile(f);}
function artlttDownloadAll(){if(!artltt.result||!artltt.result.files.length)return;const header=[['ArtModel','ArtFarb','ArtGrs','LttNam','ArtLttMgMax'].map(c=>artlttCsvField(c)).join(artltt.sep)];const lines=artltt.result.rows.map(r=>r.map(c=>artlttCsvField(c)).join(artltt.sep));const csvText=header.concat(lines).join('\r\n');const f={name:'LTT_ALL.csv',text:csvText};artlttDownloadFile(f);showToast(`Pobrano LTT_ALL.csv (${lines.length} wierszy)`);}
Object.defineProperty(przestoje,'loaded',{get(){return this.rows.length>0;}});
function przestojeOnFile(e){const f=e.target.files[0];if(!f)return;przestoje.loading=true;przestoje.progress.percent=0;przestoje.progress.label=STAGE_LABELS.read;const reader=new FileReader();reader.onload=ev=>{const buffer=ev.target.result;const worker=createPrzestojeWorker();worker.onmessage=msg=>{const d=msg.data;if(d.type==='progress'){let pct=d.percent;if(d.stage==='read')pct=5;else if(d.stage==='excel')pct=d.percent;else if(d.stage==='parse')pct=95;przestoje.progress.percent=Math.min(pct,99);przestoje.progress.label=STAGE_LABELS[d.stage]||'Przetwarzanie…';}else if(d.type==='done'){przestoje.progress.percent=100;przestoje.progress.label='Gotowe';setTimeout(()=>{przestoje.rows=markRaw(d.records);przestoje.fileName=f.name;przestoje.loading=false;mrRobotDisposeWorker(worker);showToast(`Analiza_Przestojów: ${d.records.length} wierszy (arkusz: ${d.sheetName})`);},200);}else if(d.type==='error'){mrRobotDisposeWorker(worker);przestoje.loading=false;przestoje.progress.percent=0;przestoje.progress.label='';showToast('Błąd: '+d.message);}};worker.onerror=err=>{console.error('Mr. Robot PRZESTOJE Worker error',err);mrRobotDisposeWorker(worker);przestoje.loading=false;przestoje.progress.percent=0;przestoje.progress.label='';showToast('Błąd modułu Excel. Spróbuj ponownie.');};worker.postMessage({buffer});};reader.onerror=()=>{przestoje.loading=false;showToast('Błąd czytania pliku');};reader.readAsArrayBuffer(f);}
function przestojeOnDrop(e){przestoje.drag=false;const f=e.dataTransfer.files[0];if(f)przestojeOnFile({target:{files:[f]}});}
function przestojeReset(){przestoje.rows=[];przestoje.fileName='';przestoje.savedAt='';przestoje.progress.percent=0;przestoje.progress.label='';}
const przestojeReport=computed(()=>{if(!przestoje.rows.length)return null;const rows=przestoje.rows;const minMin=przestoje.minMin||8;const pairs=[];for(let i=2;i<rows.length-1;i++){const a=rows[i],b=rows[i+1];if(a.userId&&a.userId===b.userId&&a.ts!=null&&b.ts!=null){const diffMin=(a.ts-b.ts)/60000;if(diffMin>0)pairs.push({userId:b.userId,od:b.ts,do:a.ts,diffMin,process:b.process});}}const incidents=pairs.filter(p=>p.diffMin>=minMin&&p.diffMin<=300);const groups=[];const gmap=new Map();for(const p of incidents){const d=new Date(p.od);const key=d.getFullYear()+'-'+mrPad2(d.getMonth()+1)+'-'+mrPad2(d.getDate());if(!gmap.has(key)){const g={date:key,items:[],total:0};gmap.set(key,g);groups.push(g);}const g=gmap.get(key);g.items.push(p);g.total+=p.diffMin;}const totalMin=incidents.reduce((s,p)=>s+p.diffMin,0);const maxMin=incidents.length?Math.max(...incidents.map(p=>p.diffMin)):0;const avg=incidents.length?totalMin/incidents.length:0;return{pairs,incidents,groups,totalRows:rows.length,pairsCount:pairs.length,totalMin,maxMin,avg};});

// ==================== 💾 PAMIĘĆ PLIKÓW (IndexedDB) ====================
const MR_FILES_DB='mrrobot_files',MR_FILES_STORE='files',MR_META_STORE='fileMeta';
const MR_SLOT_LABELS={kpiAudit:'KPI · Audyt',kpiScalanie:'KPI · Scalanie',kpiRozk:'KPI · Rozkładanie',kpiNv:'KPI · NADWE/VAS',audyt:'MP · Audyt',mdt:'MP · GODZINY_MDT',stock:'MP · STOCK',przestoje:'Inne · Analiza_Przestojów',toteMp:'RS · Baza MP',toteRs:'RS · Baza RS',geek:'Audyt Geek · Stocktake order'};
const MR_SLOT_STATE={kpiAudit,kpiScalanie,kpiRozk,kpiNv,audyt,mdt,stock,przestoje,toteMp,toteRs,geek};
const mrSaved=reactive({});
const mrPending={};
// Small, reactive status of the startup restore queue. Only file keys are read
// up front; the actual XLSX Blob is fetched when its turn comes.
const mrRestore=reactive({phase:'checking',expanded:false,items:[],runId:0});
const MR_RESTORE_TEXT={
 pl:{manager:'Menedżer zapisanych plików',added:'Dodano',unknown:'Data niedostępna',size:'Rozmiar',remove:'Usuń',removing:'Usuwanie…',confirmRemove:'Usunąć zapisany plik oraz jego wczytane dane?',cannotRemove:'Nie można usunąć pliku w trakcie przetwarzania.',deleteFailed:'Nie udało się usunąć pliku.',removed:'Plik usunięty',totalSize:'Łączny rozmiar',unknownSize:'Nieznany',note:'Pliki są przechowywane tylko w tej przeglądarce. Usunięcie powoduje też wyczyszczenie danych danego modułu.',total:'Zapisane',ready:'Gotowe',waiting:'W kolejce',active:'Wczytywanie',failed:'Błąd',skipped:'Na komputerze',paused:'Wstrzymane',details:'Szczegóły',hide:'Ukryj',reading:'Sprawdzanie zapisanych plików…',allDone:'Wszystkie obsłużone',notFound:'Brak pliku',progress:'Postęp przywracania'},
 ru:{manager:'Менеджер сохранённых файлов',added:'Добавлен',unknown:'Дата неизвестна',size:'Размер',remove:'Удалить',removing:'Удаление…',confirmRemove:'Удалить сохранённый файл и загруженные из него данные?',cannotRemove:'Нельзя удалить файл во время обработки.',deleteFailed:'Не удалось удалить файл.',removed:'Файл удалён',totalSize:'Общий размер',unknownSize:'Неизвестно',note:'Файлы хранятся только в этом браузере. Удаление также очищает данные соответствующего модуля.',total:'Сохранено',ready:'Готово',waiting:'В очереди',active:'Загрузка',failed:'Ошибка',skipped:'Только на компьютере',paused:'Остановлено',details:'Подробнее',hide:'Скрыть',reading:'Проверяем сохранённые файлы…',allDone:'Обработка завершена',notFound:'Файл отсутствует',progress:'Восстановление файлов'},
 en:{manager:'Saved files manager',added:'Added',unknown:'Date unavailable',size:'Size',remove:'Remove',removing:'Removing…',confirmRemove:'Delete the saved file and its currently loaded data?',cannotRemove:'Cannot remove a file while processing.',deleteFailed:'Could not delete the file.',removed:'File removed',totalSize:'Total size',unknownSize:'Unknown',note:'Files are stored only in this browser. Removing a file also clears its module data.',total:'Saved',ready:'Ready',waiting:'Queued',active:'Loading',failed:'Error',skipped:'Desktop only',paused:'Paused',details:'Details',hide:'Hide',reading:'Checking saved files…',allDone:'All processed',notFound:'File unavailable',progress:'File restore progress'},
 uk:{manager:'Керування збереженими файлами',added:'Додано',unknown:'Дата невідома',size:'Розмір',remove:'Видалити',removing:'Видалення…',confirmRemove:'Видалити збережений файл і завантажені з нього дані?',cannotRemove:'Не можна видалити файл під час обробки.',deleteFailed:'Не вдалося видалити файл.',removed:'Файл видалено',totalSize:'Загальний розмір',unknownSize:'Невідомо',note:'Файли зберігаються тільки в цьому браузері. Видалення також очищає дані відповідного модуля.',total:'Збережено',ready:'Готово',waiting:'У черзі',active:'Завантаження',failed:'Помилка',skipped:'Лише на комп’ютері',paused:'Зупинено',details:'Докладніше',hide:'Сховати',reading:'Перевіряємо збережені файли…',allDone:'Обробку завершено',notFound:'Файл відсутній',progress:'Відновлення файлів'}
};
function mrRestoreText(key){return (MR_RESTORE_TEXT[uiLanguage.value]||MR_RESTORE_TEXT.pl)[key]||key;}
const mrRestoreStats=computed(()=>{
 const items=mrRestore.items.filter(x=>x.status!=='removed');
 const ready=items.filter(x=>x.status==='done').length;
 const waiting=items.filter(x=>x.status==='queued').length;
 const active=items.filter(x=>x.status==='loading').length;
 const failed=items.filter(x=>x.status==='error'||x.status==='missing'||x.status==='paused').length;
 const skipped=items.filter(x=>x.status==='skipped').length;
 const applicable=items.length-skipped;
 return {total:items.length,ready,waiting,active,failed,skipped,applicable,percent:applicable?Math.round(100*(ready+failed)/applicable):100};
});
const mrMemoryItems=computed(()=>{
 const rows=mrRestore.items.filter(item=>item.status!=='removed');
 if(pracownicy.savedAt) return [{slot:'pracownicy',label:'Grafik pracowników',name:pracownicy.fileName,savedAt:pracownicy.savedAt,size:null,status:'done',local:true},...rows];
 return rows;
});
const mrMemoryBytes=computed(()=>mrMemoryItems.value.reduce((total,item)=>total+(Number(item.size)>0?Number(item.size):0),0));
function mrMemorySize(size){if(size==null||!Number.isFinite(Number(size)))return mrRestoreText('unknownSize');const n=Number(size);if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1).replace('.',',')+' KB';return (n/1048576).toFixed(1).replace('.',',')+' MB';}
function mrMemoryDate(iso){if(!iso)return mrRestoreText('unknown');const d=new Date(iso);return Number.isNaN(d.getTime())?mrRestoreText('unknown'):pracownicyFmtDate(iso);}
const mrRestoreActive=computed(()=>mrRestore.items.find(x=>x.status==='loading')||null);
function mrRestoreStatus(item){return mrRestoreText({queued:'waiting',loading:'active',done:'ready',error:'failed',missing:'notFound',paused:'paused',skipped:'skipped',removing:'removing'}[item.status]||'waiting');}
function mrRestorePercent(slot){const n=Number(MR_SLOT_STATE[slot]?.progress?.percent)||0;return Math.max(0,Math.min(100,Math.round(n)));}

function mrHasIndexedDB(){try{return typeof indexedDB!=='undefined';}catch(e){return false;}}
let mrDbPromise=null;
function mrDb(){if(mrDbPromise)return mrDbPromise;mrDbPromise=new Promise((res,rej)=>{try{const rq=indexedDB.open(MR_FILES_DB,2);rq.onupgradeneeded=()=>{if(!rq.result.objectStoreNames.contains(MR_FILES_STORE))rq.result.createObjectStore(MR_FILES_STORE);if(!rq.result.objectStoreNames.contains(MR_META_STORE))rq.result.createObjectStore(MR_META_STORE);};rq.onsuccess=()=>res(rq.result);rq.onerror=()=>rej(rq.error);}catch(e){rej(e);}});return mrDbPromise;}
function mrTx(mode,fn){return mrDb().then(db=>new Promise((res,rej)=>{const tx=db.transaction(MR_FILES_STORE,mode);const holder=fn(tx.objectStore(MR_FILES_STORE));tx.oncomplete=()=>res(holder&&holder.value);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);}));}
function mrMetaTx(mode,fn){return mrDb().then(db=>new Promise((res,rej)=>{const tx=db.transaction(MR_META_STORE,mode);const holder=fn(tx.objectStore(MR_META_STORE));tx.oncomplete=()=>res(holder&&holder.value);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);}));}
function mrStoredMeta(){return mrMetaTx('readonly',st=>{const holder={value:[]};const q=st.getAll();q.onsuccess=()=>{holder.value=q.result||[];};return holder;});}
function mrMetaFromRecord(slot,v){return {slot,name:String(v.name||''),savedAt:v.savedAt||'',size:v.blob&&typeof v.blob.size==='number'?v.blob.size:null};}
function mrMetaSave(meta){return mrMetaTx('readwrite',st=>{st.put(meta,meta.slot);});}
function mrMemoryUpdate(slot,metadata,status){let item=mrRestore.items.find(x=>x.slot===slot);if(!item){item={slot,label:MR_SLOT_LABELS[slot]||slot,name:'',savedAt:'',size:null,status:'queued'};mrRestore.items.push(item);}
 item.name=metadata.name||item.name;item.savedAt=metadata.savedAt||item.savedAt;item.size=metadata.size==null?item.size:metadata.size;if(status)item.status=status;
}
function mrFilePut(slot,file){
 const savedAt=new Date().toISOString();
 if(!mrHasIndexedDB())return Promise.resolve();
 const meta={slot,name:file.name,savedAt,size:file.size};
 return mrDb().then(db=>new Promise((res,rej)=>{
  const tx=db.transaction([MR_FILES_STORE,MR_META_STORE],'readwrite');
  tx.objectStore(MR_FILES_STORE).put({name:file.name,type:file.type||'',lastModified:file.lastModified||Date.now(),savedAt,blob:file},slot);
  tx.objectStore(MR_META_STORE).put(meta,slot);
  tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);
 })).then(()=>{const ms=MR_SLOT_STATE[slot];if(ms)ms.savedAt=savedAt;mrSaved[slot]={name:file.name,savedAt};mrMemoryUpdate(slot,meta,'done');})
 .catch(e=>{console.warn('Mr. Robot: nie udało się zapamiętać pliku',slot,e);});
}
const mrSkipNextFileDelete=new Set();
function mrFileDel(slot){
 if(mrSkipNextFileDelete.delete(slot)){delete mrSaved[slot];const st=MR_SLOT_STATE[slot];if(st)st.savedAt='';return Promise.resolve();}
 delete mrSaved[slot];const ms=MR_SLOT_STATE[slot];if(ms)ms.savedAt='';
 return mrDb().then(db=>new Promise((res,rej)=>{
  const tx=db.transaction([MR_FILES_STORE,MR_META_STORE],'readwrite');
  tx.objectStore(MR_FILES_STORE).delete(slot);tx.objectStore(MR_META_STORE).delete(slot);
  tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);
 })).catch(e=>{console.warn('Mr. Robot: nie udało się usunąć pliku',slot,e);});
}
function mrFileGetAll(){return mrTx('readonly',st=>{const holder={value:{}};const c=st.openCursor();c.onsuccess=()=>{const cur=c.result;if(cur){holder.value[cur.key]=cur.value;cur.continue();}};return holder;});}
function mrWrapLoad(slot,fn){return function(e){const f=e&&e.target&&e.target.files&&e.target.files[0];if(f&&!e.__mrRestore)mrPending[slot]=f;return fn(e);};}
function mrWrapReset(slot,fn){return function(...a){delete mrPending[slot];mrFileDel(slot);return fn.apply(this,a);};}
for(const slot of Object.keys(MR_SLOT_STATE)){const st=MR_SLOT_STATE[slot];watch(()=>[st.fileName,st.records,st.rows],()=>{const f=mrPending[slot];if(f&&st.fileName===f.name&&(slot!=='geek'||st.result)){delete mrPending[slot];mrFilePut(slot,f);}});}
kpiOnAuditFile=mrWrapLoad('kpiAudit',kpiOnAuditFile);
kpiOnScalanieFile=mrWrapLoad('kpiScalanie',kpiOnScalanieFile);
kpiOnRozkFile=mrWrapLoad('kpiRozk',kpiOnRozkFile);
kpiOnNvFile=mrWrapLoad('kpiNv',kpiOnNvFile);
audytOnFile=mrWrapLoad('audyt',audytOnFile);
mdtOnFile=mrWrapLoad('mdt',mdtOnFile);
stockOnFile=mrWrapLoad('stock',stockOnFile);
przestojeOnFile=mrWrapLoad('przestoje',przestojeOnFile);
toteOnMpFile=mrWrapLoad('toteMp',toteOnMpFile);
toteOnRsFile=mrWrapLoad('toteRs',toteOnRsFile);
geekOnFile=mrWrapLoad('geek',geekOnFile);
kpiResetAudit=mrWrapReset('kpiAudit',kpiResetAudit);
kpiResetScalanie=mrWrapReset('kpiScalanie',kpiResetScalanie);
kpiResetRozk=mrWrapReset('kpiRozk',kpiResetRozk);
kpiResetNv=mrWrapReset('kpiNv',kpiResetNv);
audytReset=mrWrapReset('audyt',audytReset);
mdtReset=mrWrapReset('mdt',mdtReset);
stockReset=mrWrapReset('stock',stockReset);
przestojeReset=mrWrapReset('przestoje',przestojeReset);
toteResetMp=mrWrapReset('toteMp',toteResetMp);
toteResetRs=mrWrapReset('toteRs',toteResetRs);
geekReset=mrWrapReset('geek',geekReset);
const mrSavedList=computed(()=>{const out=[];if(pracownicy.savedAt)out.push({slot:'pracownicy',label:'Grafik pracowników',name:pracownicy.fileName,savedAt:pracownicy.savedAt});for(const slot of Object.keys(MR_SLOT_LABELS)){const st=MR_SLOT_STATE[slot];if(st&&st.savedAt)out.push({slot,label:MR_SLOT_LABELS[slot],name:st.fileName,savedAt:st.savedAt});}return out;});
function mrSavedTitle(slot){const v=mrSaved[slot];return v?`Zapamiętany w przeglądarce · ${pracownicyFmtDate(v.savedAt)}`:'';}
function mrClearAllSaved(){if(!window.confirm(uiLanguage.value==='ru'?'Удалить все сохранённые файлы из браузера?\nЗагруженные данные будут очищены.':uiLanguage.value==='en'?'Delete all saved files from this browser?\nCurrently loaded data will be cleared.':uiLanguage.value==='uk'?'Видалити всі збережені файли з браузера?\nЗавантажені дані буде очищено.':'Usunąć wszystkie zapamiętane pliki z przeglądarki?\nAktualnie wczytane dane zostaną wyczyszczone.'))return;mrRestore.runId++;mrRestore.items=[];mrRestore.phase='complete';for(const slot of Object.keys(MR_SLOT_LABELS))delete mrPending[slot];mrDb().then(db=>new Promise((res,rej)=>{const tx=db.transaction([MR_FILES_STORE,MR_META_STORE],'readwrite');tx.objectStore(MR_FILES_STORE).clear();tx.objectStore(MR_META_STORE).clear();tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);})).catch(e=>console.warn('Mr. Robot: czyszczenie pamięci nieudane',e));for(const k of Object.keys(mrSaved))delete mrSaved[k];kpiResetAudit();kpiResetScalanie();kpiResetRozk();kpiResetNv();audytReset();mdtReset();stockReset();przestojeReset();toteResetMp();toteResetRs();geekReset();if(pracownicy.loaded||pracownicy.savedAt)pracownicyReset();employeeClearTraining();showToast('Pamięć przeglądarki wyczyszczona');}
// Remove one saved file, not the entire browser memory. Never interrupt a running worker.
const MR_MEMORY_RESET={kpiAudit:()=>kpiResetAudit(),kpiScalanie:()=>kpiResetScalanie(),kpiRozk:()=>kpiResetRozk(),kpiNv:()=>kpiResetNv(),audyt:()=>audytReset(),mdt:()=>mdtReset(),stock:()=>stockReset(),przestoje:()=>przestojeReset(),toteMp:()=>toteResetMp(),toteRs:()=>toteResetRs(),geek:()=>geekReset()};
async function mrMemoryRemove(slot){
 const item=mrRestore.items.find(x=>x.slot===slot);
 if(item?.status==='loading'||item?.status==='removing'||MR_SLOT_STATE[slot]?.loading||slot==='pracownicy'&&pracownicy.loading){showToast(mrRestoreText('cannotRemove'));return;}
 const label=slot==='pracownicy'?'Grafik pracowników':MR_SLOT_LABELS[slot]||slot;
 if(!window.confirm(mrRestoreText('confirmRemove')+'\n'+label+' — '+(item?.name||pracownicy.fileName||'')))return;
 if(slot==='pracownicy'){pracownicyReset();showToast(mrRestoreText('removed'));return;}
 if(!item)return;
 const previous=item.status;item.status='removing';
 try{
  await mrDb().then(db=>new Promise((res,rej)=>{
   const tx=db.transaction([MR_FILES_STORE,MR_META_STORE],'readwrite');
   tx.objectStore(MR_FILES_STORE).delete(slot);tx.objectStore(MR_META_STORE).delete(slot);
   tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);
  }));
  item.status='removed';delete mrPending[slot];delete mrSaved[slot];
  // Wrapped reset also clears all results and dependent data (and does an idempotent delete).
  mrSkipNextFileDelete.add(slot);MR_MEMORY_RESET[slot]?.();
  if(mrRestore.phase!=='running')mrRestore.items=mrRestore.items.filter(x=>x.status!=='removed');
  showToast(mrRestoreText('removed'));
 }catch(e){item.status=previous;console.warn('Mr. Robot: nie udało się usunąć zapisanego pliku',slot,e);showToast(mrRestoreText('deleteFailed'));}
}
// Restore only one saved workbook at a time. Avoid cloning every stored Blob and
// starting several XLSX workers simultaneously during application startup.
function mrStoredKeys(){return mrTx('readonly',st=>{const h={value:[]};const q=st.getAllKeys();q.onsuccess=()=>{h.value=q.result||[];};return h;});}
function mrStoredOne(slot){return mrTx('readonly',st=>{const h={value:null};const q=st.get(slot);q.onsuccess=()=>{h.value=q.result||null;};return h;});}
function mrRestoreWait(st,limitMs=180000){return new Promise(resolve=>{
 const started=Date.now();
 function check(){if(!st.loading){resolve(true);return;}if(Date.now()-started>limitMs){resolve(false);return;}setTimeout(check,120);}
 setTimeout(check,120);
});}
async function mrRestoreFiles(){
 if(!mrHasIndexedDB()){mrRestore.phase='unavailable';return;}
 const runId=++mrRestore.runId;
 const handlers={kpiAudit:kpiOnAuditFile,kpiScalanie:kpiOnScalanieFile,kpiRozk:kpiOnRozkFile,kpiNv:kpiOnNvFile,audyt:audytOnFile,mdt:mdtOnFile,stock:stockOnFile,przestoje:przestojeOnFile,toteMp:toteOnMpFile,toteRs:toteOnRsFile,geek:geekOnFile};
 const permittedMobile=new Set(['kpiAudit','kpiScalanie','kpiRozk','kpiNv','przestoje']);
 let n=0;
 try{
  const [keys,metadata]=await Promise.all([mrStoredKeys(),mrStoredMeta()]);
  if(runId!==mrRestore.runId)return;
  const metadataMap=new Map(metadata.map(m=>[m.slot,m]));
  mrRestore.items=keys.filter(slot=>handlers[slot]&&MR_SLOT_STATE[slot]).map(slot=>({
   slot,label:MR_SLOT_LABELS[slot],name:metadataMap.get(slot)?.name||'',
   savedAt:metadataMap.get(slot)?.savedAt||'',size:metadataMap.get(slot)?.size??null,
   status:mobileLite&&!permittedMobile.has(slot)?'skipped':'queued'
  }));
  mrRestore.phase='running';
  for(const item of mrRestore.items){
   if(runId!==mrRestore.runId)return;
   if(item.status!=='queued')continue;
   const slot=item.slot,h=handlers[slot],ms=MR_SLOT_STATE[slot];
   item.status='loading';
   let v;
   try{v=await mrStoredOne(slot);}catch(e){item.status='error';console.warn('Mr. Robot: plik niedostępny',slot,e);continue;}
   if(runId!==mrRestore.runId)return;
   if(!v||!v.blob){item.status='missing';continue;}
   const info=mrMetaFromRecord(slot,v);
   item.name=info.name;item.savedAt=info.savedAt;item.size=info.size;
   if(!item.metadataWritten){item.metadataWritten=true;try{await mrMetaSave(info);}catch(e){console.warn('Mr. Robot: metadata',e);}}
   try{
    const file=new File([v.blob],v.name,{type:v.type||'',lastModified:v.lastModified||Date.now()});
    mrSaved[slot]={name:v.name,savedAt:v.savedAt};ms.savedAt=v.savedAt||'';
    h({target:{files:[file]},__mrRestore:true});
    const completed=await mrRestoreWait(ms);
    if(runId!==mrRestore.runId)return;
    if(!completed){
     item.status='paused';
     for(const pending of mrRestore.items)if(pending.status==='queued')pending.status='paused';
     console.warn('Mr. Robot: przywracanie trwa zbyt długo, przerwano kolejkę',slot);
     break;
    }
    // Do not claim success merely because the worker stopped; verify the
    // existing module has accepted the workbook under its original filename.
    if(ms.fileName===file.name){item.status='done';n++;}
    else item.status='error';
    await new Promise(resolve=>setTimeout(resolve,80));
   }catch(e){item.status='error';console.warn('Mr. Robot: nie udało się przywrócić',slot,e);}
  }
  if(runId!==mrRestore.runId)return;
  mrRestore.phase='complete';
  mrRestore.items=mrRestore.items.filter(x=>x.status!=='removed');
  if(n)setTimeout(()=>showToast(`💾 Przywrócono z przeglądarki: ${n} ${n===1?'plik':(n<5?'pliki':'plików')}`),500);
 }catch(e){if(runId!==mrRestore.runId)return;mrRestore.phase='error';console.warn('Mr. Robot: pamięć plików niedostępna',e);}
}

// MR. BOT Intelligence: provenance is prepared on-demand; existing calculations are untouched.
const intelPanel=ref(null);
const intelRowsMode=ref('all');
const intelPage=ref(0);
const intelPageSize=24;
function intelT(key){uiLanguage.value;return window.MRIntelligence.t(uiLanguage.value,key);}
function intelClose(){intelPanel.value=null;intelRowsMode.value='all';intelPage.value=0;}
function intelOpenRet(metric){
 const report=geekGroups.value?.find(g=>g.ret);
 if(!report||!geek.result?.recs)return;
 const title=metric==='bins'?'PRZEGRÓDKI PRZELICZONE':metric==='mixed'?'POMIESZANYCH SZT.':metric;
 const line=report.lines.find(l=>l[0]===title);
 if(!line)return;
 intelShowGeek(title,line[1],'ret');
}
function intelShowGeek(title,expected,scope){
 if(!geek.result?.recs)return;
 const details=window.MRIntelligence.buildGeek(geek.result.recs,geek.sel,geek.opSel,geek.result.hasOp,title,expected,scope);
 details.fileName=geek.fileName;details.sheetName=geek.sheetName;
 details.operatorFilter=geek.result.hasOp?geekOpOptions.value.filter(x=>geek.opSel[x.key]).map(x=>x.label).join(', '):'';
 details.groupFilter=scope==='ret'?'AUDYT RET':geekListOptions.value.filter(x=>geek.sel[x.key]).map(x=>x.label).join(', ');
 intelPanel.value=details;intelRowsMode.value='all';intelPage.value=0;
 Vue.nextTick(()=>document.querySelector('.mr-intel-dialog .mr-intel-close')?.focus());
}
function intelOpenGeekT1(metric){const t=geekT1.value;if(!t||t.ret)return;const row=geekT1Rows().find(x=>x[0]===metric);if(row)intelShowGeek(metric,row[1],'all');}
function intelOpenNv(record){
 if(!record||!kpiNv.loaded)return;
 const details=window.MRIntelligence.buildNv(record,kpiNvNormThreshold.value);
 details.fileName=kpiNv.fileName;
 details.statusFilter=kpiNv.statusFilter;
 details.shiftFilter=kpiNv.selectedShifts.length===allShiftKeys.length?'':kpiNv.selectedShifts.join(', ');
 details.firmaFilter=kpiNv.selectedFirmy.map(attrLabel).join(', ');
 details.procesFilter=kpiNv.selectedProcesy.map(attrLabel).join(', ');
 intelPanel.value=details;intelPage.value=0;intelRowsMode.value='all';
 Vue.nextTick(()=>document.querySelector('.mr-intel-dialog .mr-intel-close')?.focus());
}
const intelFilteredRows=computed(()=>{
 if(!intelPanel.value||intelPanel.value.type!=='ret')return [];
 const rows=intelPanel.value.rows;
 if(intelRowsMode.value==='included')return rows.filter(r=>r.ok);
 if(intelRowsMode.value==='excluded')return rows.filter(r=>!r.ok);
 return rows;
});
const intelPageCount=computed(()=>Math.max(1,Math.ceil(intelFilteredRows.value.length/intelPageSize)));
const intelVisibleRows=computed(()=>intelFilteredRows.value.slice(intelPage.value*intelPageSize,(intelPage.value+1)*intelPageSize));
function intelSelectRows(filter){intelRowsMode.value=filter;intelPage.value=0;}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&intelPanel.value)intelClose();});
watch([()=>geek.result,()=>kpiNv.records],()=>intelClose());

// MR. BOT visual bridge: reads existing state; never writes report data.
const mrBotEmit=(type,detail)=>{try{window.dispatchEvent(new CustomEvent(type,{detail}));}catch(e){/* visual diagnostics must not interrupt work */}};
const mrBotContext=()=>({view:view.value,rsView:rsView.value,mpView:mpView.value,kpiTab:kpiTab.value,audytTab:audytTab.value,scalanieTab:scalanieTab.value});
watch([view,rsView,mpView,kpiTab,audytTab,scalanieTab],()=>{window.__MRBOT_CONTEXT__=mrBotContext();mrBotEmit('mrbot:context',window.__MRBOT_CONTEXT__);});
window.__MRBOT_CONTEXT__=mrBotContext();
window.__MRBOT_TASKS__={};
for(const [name,st] of Object.entries({kpiAudit,kpiScalanie,kpiRozk,kpiNv,pracownicy,toteMp,toteRs,audyt,geek,mdt,stock,przestoje})){
 let id=null,seq=0,peak=0,priorData=null;
 const send=(phase)=>{const detail={taskId:id,module:name,phase,percent:Number(st.progress?.percent)||0};window.__MRBOT_TASKS__[name]=detail;mrBotEmit('mrbot:task',detail);};
 watch(()=>!!st.loading,(loading,was)=>{
  if(loading){id=name+':'+(++seq);peak=0;priorData=st.records||st.rows||st.result;send('start');}
  else if(was&&id){
   const rows=st.records||st.rows||st.result?.recs;
   // Completion is recognised only from the existing 100% progress marker.
   const changed=(st.records||st.rows||st.result)!==priorData;
   const phase=changed&&Math.max(peak,Number(st.progress?.percent)||0)>=100?(Array.isArray(rows)&&!rows.length?'empty':'done'):'error';
   send(phase);id=null;
  }
 },{flush:'sync'});
 watch(()=>Number(st.progress?.percent)||0,percent=>{peak=Math.max(peak,percent);if(id&&st.loading)send('progress');},{flush:'sync'});
}
// These cues describe a user's operation, not a claim that a download was saved.
const mrBotCue=state=>{try{window.MRBotVisual?.play(state,1800);}catch(e){}};
for(const [getter,setter,state] of [
 [()=>scalanieRun,v=>scalanieRun=v,'work'],[()=>mdtRunAnalysis,v=>mdtRunAnalysis=v,'work'],
 [()=>stockGenerate,v=>stockGenerate=v,'filter'],[()=>toteRunSearch,v=>toteRunSearch=v,'scan'],
 [()=>toteRunManualSearch,v=>toteRunManualSearch=v,'scan'],
 [()=>scalanieExportCSV,v=>scalanieExportCSV=v,'download'],[()=>mdtExportCSV,v=>mdtExportCSV=v,'download'],
 [()=>audytExportExcel,v=>audytExportExcel=v,'download'],
 [()=>kpiExportAudit,v=>kpiExportAudit=v,'download'],[()=>kpiExportScalanie,v=>kpiExportScalanie=v,'download'],
 [()=>kpiExportRozk,v=>kpiExportRozk=v,'download'],[()=>kpiExportNv,v=>kpiExportNv=v,'download'],
 [()=>scalanieCopyClipboard,v=>scalanieCopyClipboard=v,'copy'],[()=>stockCopySelectedLoc,v=>stockCopySelectedLoc=v,'copy']
]){const original=getter();setter(function(...args){const value=original.apply(this,args);mrBotCue(state);return value;});}

// Give the application a chance to paint before restoring large saved workbooks.
// Staggered restoration (above) keeps XLSX parsing off the critical startup path.
requestAnimationFrame(()=>requestAnimationFrame(()=>{void mrRestoreFiles();}));

return{intelPanel,intelT,intelClose,intelOpenRet,intelOpenGeekT1,intelOpenNv,intelRowsMode,intelPage,intelPageCount,intelVisibleRows,intelSelectRows,intelPageSize,mrIntel:window.MRIntelligence,mobileLite,uiLanguage,uiLanguages,currentTheme,tr,setLanguage,setTheme,openSettings,closeSettings,goFromSettings,openSettingsMemory,view,toast,showToast,showWelcome,closeWelcome,kpiMedal:medal,changelogAll,moduleLabels,isChangelogEntryNew,hasUnreadChangelog,unreadChangelogCount,
rsView,mpView,scalanieState,SCALANIE_SHELF_OPTIONS,SCALANIE_ABC_OPTIONS,scalanieNeedEan,scalanieCanRun,scalanieRun,scalanieExportCSV,scalanieCopyClipboard,scalanieReset,
scalanieTab,konsolidacja,konsolidacjaRun,konsolidacjaReset,konsolidacjaClearResult,konsolidacjaCopyEan,konsolidacjaToggle,konsolidacjaSelCount,konsolidacjaIsAllSel,konsolidacjaSelAll,konsolidacjaCopyCard,
kpiTab,kpiStatsTab,kpiTopCountNorm,kpiTopCountItems,kpiAudit,kpiScalanie,kpiRozk,kpiNv,
kpiNormThreshold,kpiScalanieNormThreshold,kpiRozkNormThreshold,kpiNvNormThreshold,
kpiHasSelection,kpiHasScalanieSelection,kpiHasRozkSelection,kpiHasNvSelection,
kpiIsAllGroupsActive,kpiIsAllScalanieGroupsActive,kpiIsAllRozkGroupsActive,kpiIsAllNvGroupsActive,
kpiIsAllShiftsActive,kpiIsAllScalanieShiftsActive,kpiIsAllRozkShiftsActive,kpiIsAllNvShiftsActive,
kpiAvailableGroups,kpiAvailableScalanieGroups,kpiAvailableRozkGroups,kpiAvailableNvGroups,
kpiAvailableShifts,kpiAvailableScalanieShifts,kpiAvailableRozkShifts,kpiAvailableNvShifts,
kpiAuditFilteredByGroup,kpiScalanieFilteredByGroup,kpiRozkFilteredByGroup,kpiNvFilteredByGroup,
kpiAuditActiveGroupSummary,kpiScalanieActiveGroupSummary,kpiRozkActiveGroupSummary,kpiNvActiveGroupSummary,
kpiStatsAudit,kpiStatsScalanie,kpiStatsRozk,kpiStatsNv,kpiStatsNadwe,kpiStatsVas,
kpiTopByNorm,kpiTopByItems,kpiScalanieTopByNorm,kpiScalanieTopByItems,kpiRozkTopByNorm,kpiRozkTopByItems,
kpiNadweTopByNorm,kpiNadweTopByItems,kpiVasTopByNorm,kpiVasTopByItems,
kpiAuditFiltered,kpiScalanieFiltered,kpiRozkFiltered,kpiNvFiltered,kpiNvReportRows,
kpiIsBelow,kpiIsScalanieBelow,kpiIsRozkBelow,kpiIsNvBelow,
kpiGroupByKey,kpiStatusFilters,kpiSortOptions,
kpiToggleGroup,kpiSelectAllGroups,kpiToggleShift,kpiSelectAllShifts,kpiClearSelection,
kpiToggleScalanieGroup,kpiSelectAllScalanieGroups,kpiToggleScalanieShift,kpiSelectAllScalanieShifts,kpiClearScalanieSelection,
kpiToggleRozkGroup,kpiToggleRozkRodzaj,kpiSelectAllRozkRodzaje,kpiIsAllRozkRodzajeActive,kpiRozkRodzajCounts,kpiRozkRodzajKeys,kpiSelectAllRozkGroups,kpiToggleRozkShift,kpiSelectAllRozkShifts,kpiClearRozkSelection,
kpiToggleNvGroup,kpiSelectAllNvGroups,kpiToggleNvShift,kpiSelectAllNvShifts,kpiClearNvSelection,
kpiOnAuditFile,kpiOnAuditDrop,kpiResetAudit,kpiExportAudit,
kpiOnScalanieFile,kpiOnScalanieDrop,kpiResetScalanie,kpiExportScalanie,
kpiOnRozkFile,kpiOnRozkDrop,kpiResetRozk,kpiExportRozk,
kpiOnNvFile,kpiOnNvDrop,kpiResetNv,kpiExportNv,kpiNvColorFor,kpiNvCellStyle,
kpiAnyLoaded,kpiCanGlobalExport,kpiExportGlobalXlsx,
toteStatsOpen,toteMp,toteRs,toteOptions,toteFilters,toteResults,toteStats,toteSearched,toteCanSearch,
toteStatsMp,toteStatsRs,toteMpLoaded,toteRsLoaded,
toteOnMpFile,toteOnRsFile,toteOnMpDrop,toteOnRsDrop,toteResetMp,toteResetRs,
toteRunSearch,toteExportExcel,toteToggleAll,toteAllChecked,
toteManualText,toteManualResults,toteManualMissing,toteManualFiltered,toteManualSearched,toteManualStats,totePickStrategy,toteManualToteType,toteManualMultiTote,
toteManualEanCount,toteCanManualSearch,toteRunManualSearch,toteExportManualExcel,toteCopyManualToClipboard,
audytTab,audyt,audytOnFile,audytOnDrop,audytReset,audytRunAnalysis,audytExportExcel,audytCopyToClipboard,audytCopyKpiValues,
formatka59,formatka59RunAnalysis,formatka59CopyToClipboard,
mdt,mdtOnFile,mdtOnDrop,mdtReset,mdtRunAnalysis,mdtExportCSV,
mdtFilteredPolki11,mdtFilteredAllSelected,mdtToggleLoc,mdtSelectAll11,mdtClearSelected11,mdtCopySelectedLoc,mdtCopyKpiValues,mdtNum,
stock,stockOnFile,stockOnDrop,stockReset,stockStats,stockPeriodsGrouped,stockTogglePeriod,stockClearPeriods,stockGenerate,stockFilteredLoc,stockAllLocSelected,stockToggleLoc,stockSelectAllLoc,stockCopySelectedLoc,
przestoje,przestojeOnFile,przestojeOnDrop,przestojeReset,przestojeReport,fmtPrzestoj,fmtDateTime,przestojColor,
kreseczki,kreseczkiGenerate,kreseczkiClear,kreseczkiSaveSvg,kreseczkiSavePng,kreseczkiPrint,artltt,artlttPreview,artlttRun,artlttClear,artlttDownload,artlttDownloadAll,geek,geekRetMode,geekListOptions,geekSelCount,geekT1,geekSelectAll,geekGroups,geekFilterNote,geekOpSelectAll,geekOpOptions,geekOpSelCount,geekGroupsFiltered,geekPct,geekOnFile,geekOnDrop,geekReset,geekCopyT1,geekCopyT1Values,geekCopyT2,geekCopyGroup,geekCopyList,
kpiAuditFilterActive,kpiScalanieFilterActive,kpiRozkFilterActive,kpiNvFilterActive,mrSaved,mrSavedList,mrSavedTitle,mrClearAllSaved,mrRestore,mrRestoreStats,mrRestoreActive,mrRestoreText,mrRestoreStatus,mrRestorePercent,mrMemoryItems,mrMemoryBytes,mrMemorySize,mrMemoryDate,mrMemoryRemove,pracownicyFmtDate,pracownicy,pracownicyOnFile,pracownicyOnDrop,pracownicyReset,employeeSearch,employeeMatches,employeeRoster,employeeTraining,employeeCurrentRows,employeeCurrent,employeeSelected,employeeProfile,employeeProfileTab,employeeProfileFields,employeeFilter,employeeFilteredTraining,employeeTrainingMinutes,employeeResignations,employeeOpen,employeeClose,employeeOnTrainingFile,employeeClearTraining,eDate,eTime,eDuration,eText,eMsg,kpiAttrOpts,kpiToggleAttr,kpiClearAttr};
}}).mount('#app');

