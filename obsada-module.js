/* Mr. Robot · Obsada: reactive SPA view. XLSX parser remains js/obsada.js. */
(function(root){
'use strict';
root.createMrObsada=function({reactive,computed,markRaw}){
 const state=reactive({fileName:'',loadedAt:'',savedAt:'',loading:false,error:'',model:null,tab:'today',interval:'',source:'main',month:'',employee:'',process:''});
 const intervals=computed(()=>state.model?.intervals||[]);
 const selected=computed(()=>intervals.value.find(x=>x.key===state.interval)||intervals.value[0]||null);
 // Non-production assignments in STAN are kept separate from operational processes.
 // Normalize Polish diacritics and whitespace without altering source labels.
 function outsideKey(value){
  const normalized=String(value||'').replace(/[Łł]/g,c=>c==='Ł'?'L':'l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
  if(normalized==='N/N')return 'N/N';
  if(normalized==='INNE DZIALY')return 'INNE DZIALY';
  if(normalized==='W DOMU')return 'W DOMU';
  return '';
 }
 const otherAssignments=computed(()=>{
  const result={'N/N':[],'INNE DZIALY':[],'W DOMU':[]};
  for(const person of selected.value?.people||[]){const key=outsideKey(person.process);if(key)result[key].push(person);}
  return Object.entries(result).filter(([,people])=>people.length).map(([name,people])=>({name,people,count:people.length}));
 });
 const otherPeopleCount=computed(()=>otherAssignments.value.reduce((n,g)=>n+g.count,0));
 const processAssignmentsCount=computed(()=>(selected.value?.people.length||0)-otherPeopleCount.value);
 function personInitials(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  return parts.length>=2 && parts.some(x=>/[\p{L}]/u.test(x)) && parts.every(x=>/[\p{L}]/u.test(x))
   ? (parts[0][0]+parts[parts.length-1][0]).toLocaleUpperCase():'';
 }
 const processes=computed(()=>{
  if(!selected.value)return [];
  const iv=selected.value, names=new Set([...Object.keys(iv.officialSummary||{}),...Object.keys(iv.summary)]);
  return [...names].filter(name=>!outsideKey(name)).map(name=>({name,count:Object.prototype.hasOwnProperty.call(iv.officialSummary||{},name)?iv.officialSummary[name]:iv.summary[name],people:iv.summary[name]||0}))
   .filter(x=>x.count>0||x.people>0).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 });
 const totalPeople=computed(()=>selected.value?.people.length||0);
 const officialTotal=computed(()=>selected.value?.officialTotal);
 const summaryCount=computed(()=>processes.value.reduce((sum,p)=>sum+p.count,0));
 let persist=null;
 function setPersist(handler){persist=handler;}
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
 async function loadFile(file,{restore=false,savedAt="",keepSelection=false}={}){
   const previous={tab:state.tab,interval:state.interval,month:state.month,employee:state.employee,process:state.process,source:state.source};
   if(!file)return false;
   if(!/\.xlsx?$/i.test(file.name||'')){state.error='Wybierz plik XLSX / XLS';return false;}
   state.loading=true;state.error='';
   try{
     const buf=await file.arrayBuffer();
     const workbook=root.XLSX.read(buf,{type:'array',cellDates:false});
     const parsed=root.ObsadaParser.extract(workbook,root.XLSX);
     state.model=markRaw(parsed);
     state.fileName=file.name;
     state.loadedAt=restore&&savedAt?new Date(savedAt).getTime():Date.now();state.savedAt=restore?savedAt:new Date(state.loadedAt).toISOString();
     const current=parsed.intervals.find(x=>root.ObsadaParser.inInterval(x,new Date()));
     state.interval=keepSelection&&parsed.intervals.some(x=>x.key===previous.interval)?previous.interval:(current?.key||parsed.intervals[0]?.key||'');
     state.month=keepSelection?previous.month:'';state.employee=keepSelection?previous.employee:'';state.process=keepSelection?previous.process:'';state.source=keepSelection?previous.source:'main';state.tab=keepSelection?previous.tab:'today';
     if(!restore&&persist)await persist(file);
     return true;
   }catch(err){state.error=err?.message||String(err);return false;}
   finally{state.loading=false;}
 }
 async function onFile(event){const file=event?.target?.files?.[0];await loadFile(file);if(event?.target)event.target.value='';}
 function onDrop(event){event.preventDefault();loadFile(event.dataTransfer?.files?.[0]);}
 function reset(){state.model=null;state.fileName='';state.loadedAt='';state.savedAt='';state.error='';state.interval='';state.tab='today';}
 return {state,intervals,selected,processes,totalPeople,officialTotal,summaryCount,otherAssignments,otherPeopleCount,processAssignmentsCount,personInitials,history,months,employees,processOptions,report,maxHours,tableRows,nowInterval,chosenPeople,formatLoaded,formatHours,percent,onFile,onDrop,loadFile,setPersist,reset};
};
})(typeof window!=='undefined'?window:globalThis);
