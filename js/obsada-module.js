/* Mr. Robot · Obsada: reactive SPA view. XLSX parser remains js/obsada.js. */
(function(root){
'use strict';
root.createMrObsada=function({reactive,computed,markRaw}){
 const state=reactive({fileName:'',loadedAt:'',loading:false,error:'',model:null,tab:'today',interval:'',source:'main',month:'',employee:'',process:''});
 const intervals=computed(()=>state.model?.intervals||[]);
 const selected=computed(()=>intervals.value.find(x=>x.key===state.interval)||intervals.value[0]||null);
 const processes=computed(()=>selected.value?Object.entries(selected.value.summary).sort((a,b)=>b[1]-a[1]):[]);
 const history=computed(()=>state.model?.history||[]);
 const months=computed(()=>[...new Set(history.value.map(x=>x.date.slice(0,7)))].sort().reverse());
 const employees=computed(()=>[...new Set(history.value.map(x=>x.login))].sort());
 const processOptions=computed(()=>[...new Set(history.value.map(x=>x.process))].sort());
 const report=computed(()=>root.ObsadaParser.analyze(history.value,{sourceType:state.source,month:state.month,employee:state.employee,process:state.process}));
 const maxHours=computed(()=>report.value.processes[0]?.[1]||1);
 const tableRows=computed(()=>report.value.rows.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,600));
 const nowInterval=computed(()=>intervals.value.find(x=>root.ObsadaParser.inInterval(x,new Date()))?.key||'');
 function chosenPeople(name){return selected.value?.people.filter(x=>x.process===name)||[];}
 function formatLoaded(locale){return state.loadedAt?new Date(state.loadedAt).toLocaleString(({pl:'pl-PL',ru:'ru-RU',en:'en-GB',uk:'uk-UA'}[locale]||'pl-PL')):'';}
 function formatHours(value,locale){return Number(value||0).toLocaleString(({pl:'pl-PL',ru:'ru-RU',en:'en-GB',uk:'uk-UA'}[locale]||'pl-PL'),{maximumFractionDigits:2});}
 function percent(v){return Math.min(100,Math.max(0,100*Number(v||0)/maxHours.value))+'%';}
 async function loadFile(file){
   if(!file)return;
   if(!/\.xlsx?$/i.test(file.name||'')){state.error='Wybierz plik XLSX / XLS';return;}
   state.loading=true;state.error='';
   try{
     const buf=await file.arrayBuffer();
     const workbook=root.XLSX.read(buf,{type:'array',cellDates:false});
     const parsed=root.ObsadaParser.extract(workbook,root.XLSX);
     state.model=markRaw(parsed);
     state.fileName=file.name;
     state.loadedAt=Date.now();
     const current=parsed.intervals.find(x=>root.ObsadaParser.inInterval(x,new Date()));
     state.interval=current?.key||parsed.intervals[0]?.key||'';
     state.month='';state.employee='';state.process='';state.source='main';state.tab='today';
   }catch(err){state.error=err?.message||String(err);}
   finally{state.loading=false;}
 }
 async function onFile(event){const file=event?.target?.files?.[0];await loadFile(file);if(event?.target)event.target.value='';}
 function onDrop(event){event.preventDefault();loadFile(event.dataTransfer?.files?.[0]);}
 return {state,intervals,selected,processes,history,months,employees,processOptions,report,maxHours,tableRows,nowInterval,chosenPeople,formatLoaded,formatHours,percent,onFile,onDrop,loadFile};
};
})(typeof window!=='undefined'?window:globalThis);
