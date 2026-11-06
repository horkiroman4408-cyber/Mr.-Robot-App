/* Local per-report date/time preferences shared by Bridge popup and Mr. Robot modal. */
(function(){'use strict';
  const PREFIX='mrOpenReportsPeriod:';
  const pad=n=>String(n).padStart(2,'0');
  const valid = value=>{
    const m=/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(value||''));
    if(!m)return false;
    const [year,month,day,hour,minute,second]=m.slice(1).map(Number);
    if(year<1900||year>2100||month<1||month>12||day<1||
       day>new Date(year,month,0).getDate()||hour>23||minute>59||second>59)return false;
    return true;
  };
  const validReport=key=>key==='ai_audyt'||key==='godziny_mdt'||key==='stock';
  async function load(report){
    if(!validReport(report))return null;
    try{
      const result=await chrome.storage.local.get(PREFIX+report);
      const period=result[PREFIX+report];
      return period && valid(period.from)&&valid(period.to)&&period.from<=period.to?
        {from:period.from,to:period.to}:null;
    }catch{return null;}
  }
  async function save(report,from,to){
    if(!validReport(report)||!valid(from)||!valid(to)||from>to)return false;
    await chrome.storage.local.set({[PREFIX+report]:{from,to}});
    return true;
  }
  function apply(root,fromPrefix,toPrefix,period){
    if(!period||!valid(period.from)||!valid(period.to))return false;
    for(const [prefix,value] of [[fromPrefix,period.from],[toPrefix,period.to]]){
      const m=/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
      const dateInput=root.querySelector('#'+prefix+'-date');
      if(!dateInput)return false;
      dateInput.value=`${m[3]}.${m[2]}.${m[1]}`;
      globalThis.MRBridgeTime.set(root,prefix,`${m[4]}:${m[5]}:${m[6]}`);
      dateInput.dispatchEvent(new Event('change',{bubbles:true}));
    }
    return true;
  }
  globalThis.MRBridgePeriodStore={load,save,apply,valid};
})();
