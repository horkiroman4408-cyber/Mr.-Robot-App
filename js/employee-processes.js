/* Employee profile / Procesy: read-only display of local Obsada hourly assignments. */
(function(root){
'use strict';
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const midnight=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return NaN;const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d).getTime();return dateKey(new Date(t))===iso?t:NaN;};
const clock=t=>{const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const normalized=s=>String(s||'').replace(/\s+/g,'').toUpperCase();
function aliases(id,brand,originalLogin){
 const ids=new Set([normalized(id),normalized(originalLogin)].filter(Boolean));
 // PM/SPM is the public MOHITO alias of its underlying PD login.
 // Never rewrite a SINSAY PD login into a MOHITO one.
 if(brand==='MOHITO')for(const value of [...ids]){
  const match=/^(?:PM|SPM)(\d+)$/.exec(value);
  if(match){ids.add('PM'+match[1]);ids.add('SPM'+match[1]);ids.add('PD'+match[1]);}
 }
 return ids;
}
function create(records,ids,makeSlots,now=Date.now()){
 if(!Array.isArray(records)||typeof makeSlots!=='function')return [];
 const allowed=ids instanceof Set?ids:new Set(ids||[]);
 const hours=[];const unique=new Set();
 for(const row of records){
  if(!allowed.has(normalized(row?.login))||!row.process)continue;
  const slots=makeSlots(row.day,row.shift);const slot=slots?.[Number(row.slot)];
  if(!slot||!Number.isFinite(slot.start)||!Number.isFinite(slot.end)||slot.end<=slot.start)continue;
  const id=[row.day,row.shift,row.slot,normalized(row.login),row.process].join('|');
  if(unique.has(id))continue;unique.add(id);
  hours.push({start:slot.start,end:slot.end,process:String(row.process),shift:String(row.shift),day:row.day});
 }
 hours.sort((a,b)=>a.start-b.start||a.end-b.end||a.process.localeCompare(b.process));
 // Adjacent hours with the same process and shift are one interval.
 const intervals=[];
 for(const item of hours){const prev=intervals[intervals.length-1];if(prev&&prev.end===item.start&&prev.process===item.process&&prev.shift===item.shift&&prev.day===item.day){prev.end=item.end;}else intervals.push({...item});}
 return intervals.map(x=>({...x,status:x.end<=now?'elapsed':x.start<=now?'current':'planned',from:clock(x.start),to:clock(x.end)}));
}
function forDate(intervals,day,now=Date.now()){
 const start=midnight(day);if(!Number.isFinite(start))return [];
 const end=new Date(start);end.setDate(end.getDate()+1);const finish=end.getTime();
 return (intervals||[]).filter(x=>x.start<finish&&x.end>start).map(x=>{
  const from=Math.max(start,x.start),to=Math.min(finish,x.end);
  return {...x,start:from,end:to,from:clock(from),to:to===finish?'24:00':clock(to),status:to<=now?'elapsed':from<=now?'current':'planned',fromPreviousDay:x.start<start};
 });
}
function around(intervals,now=Date.now()){
 const a=(intervals||[]),previous=a.filter(x=>x.end<=now).at(-1)||null;
 const current=a.find(x=>x.start<=now&&x.end>now)||null;
 const next=a.find(x=>x.start>now)||null;
 return {previous,current,next};
}
root.MREmployeeProcesses={aliases,create,forDate,around,dateKey,midnight};
if(typeof module==='object'&&module.exports)module.exports=root.MREmployeeProcesses;
})(typeof window!=='undefined'?window:globalThis);
/* UI enhancement for v3.27.0. Intentionally installed AFTER Vue mounts.
 * Read-only: no assignment modification, no localStorage/IndexedDB access, no Vue template mutation.
 * Keeps the original shared employee profile and all existing handlers intact.
 */
(function(root){
'use strict';
if(!root.document||!root.MutationObserver)return;
const d=root.document;
const css=`
#app .employee-calendar-day.mrpro-has-process{position:relative;justify-content:flex-start;gap:3px;padding-bottom:5px;cursor:pointer}
#app .employee-calendar-day.mrpro-has-process>b{font-size:10px;line-height:1.1}
#app .employee-calendar-day .employee-process-calendar-marker{display:none}
#app .mrpro-calendar-chips{display:flex;flex-direction:column;gap:2px;width:100%;min-width:0;margin-top:auto}
#app .mrpro-calendar-chip{min-width:0;max-width:100%;width:100%;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;border:1px solid rgba(185,79,92,.22);border-radius:5px;padding:2px 3px;background:rgba(185,79,92,.09);color:inherit;font-size:9px;font-weight:600;line-height:1.15;cursor:pointer;box-sizing:border-box}
#app .mrpro-calendar-chip:hover,#app .mrpro-calendar-chip:focus-visible{border-color:#b94f5c;outline:none;background:rgba(185,79,92,.17)}
#app .mrpro-calendar-more{font-size:9px;line-height:1.1;text-align:center;opacity:.7}
#app .employee-calendar-day.mrpro-has-process{min-height:65px}
#app .employee-process-overview.mrpro-overview-original{display:none}
#app .mrpro-browse{display:flex;gap:8px;align-items:stretch;min-width:0}
#app .mrpro-browse-arrow{flex:0 0 32px;min-width:32px;background:var(--mr-c106,#fff);color:inherit;border:1px solid var(--mr-c105,#d6dee9);border-radius:11px;cursor:pointer;font-size:22px}
#app .mrpro-browse-arrow:disabled{cursor:default;opacity:.3}
#app .mrpro-browse-grid{flex:1;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#app .mrpro-browse-card{min-width:0;min-height:91px;background:var(--mr-c106,#fff);border:1px solid var(--mr-c105,#d6dee9);border-radius:13px;color:inherit;display:flex;flex-direction:column;gap:7px;text-align:left;padding:12px;cursor:pointer}
#app .mrpro-browse-card.is-selected{border-color:rgba(185,79,92,.55);background:rgba(185,79,92,.07)}
#app .mrpro-browse-card:focus-visible{outline:2px solid #b94f5c;outline-offset:2px}
#app .mrpro-browse-card>span,#app .mrpro-browse-card>small{font-size:10px;color:var(--mr-c13,#64748b)}
#app .mrpro-browse-card>strong{font-size:12px;line-height:1.25;overflow-wrap:anywhere}
#app .mrpro-browse-card:disabled{cursor:default;opacity:.45}
@media(max-width:680px){#app .mrpro-browse-grid{gap:4px}#app .mrpro-browse{gap:4px}#app .mrpro-browse-arrow{flex-basis:25px;min-width:25px}#app .mrpro-browse-card{padding:7px;min-height:88px}#app .mrpro-browse-card>strong{font-size:10px}#app .mrpro-calendar-chip{font-size:8px;padding:2px 1px}}
`;
let styleAdded=false,scheduled=false,personKey='',offset=0,monthKey='',lastFocus='';
const make=(tag,klass,text)=>{const node=d.createElement(tag);if(klass)node.className=klass;if(text!=null)node.textContent=text;return node;};
const pad=n=>String(n).padStart(2,'0');
function getVM(){return d.getElementById('app')?.__vue_app__?._instance?.setupState||null;}
function lang(vm){const value=vm.uiLanguage;return (typeof value==='string'?value:value?.value)||'pl';}
const words={
 pl:{older:'Wcześniej',selected:'Wybrano',later:'Później',empty:'Brak przydziału',prev:'Poprzednie przydziały',next:'Następne przydziały'},
 ru:{older:'Ранее',selected:'Выбрано',later:'Далее',empty:'Нет назначения',prev:'Предыдущие назначения',next:'Следующие назначения'},
 en:{older:'Earlier',selected:'Selected',later:'Later',empty:'No assignment',prev:'Previous assignments',next:'Next assignments'},
 uk:{older:'Раніше',selected:'Обрано',later:'Пізніше',empty:'Немає призначення',prev:'Попередні призначення',next:'Наступні призначення'}
};
function currentIntervals(vm){const data=vm.employeeProcessIntervals;return Array.isArray(data)?data:[];}
function openDay(vm,day){if(typeof vm.employeeProcessGoDay==='function')vm.employeeProcessGoDay(day);}
function paintCalendar(vm,overlay){
 const grid=overlay.querySelector('.employee-calendar-grid');
 const month=vm.employeeSchedule;if(!grid||!month)return;
 const prefix=`${month.year}-${pad(month.month+1)}-`;
 const grouped=new Map();
 for(const item of currentIntervals(vm)){
  const day=item.day;
  if(!day?.startsWith(prefix))continue;
  const labels=grouped.get(day)||[];
  if(!labels.includes(item.process))labels.push(item.process);
  grouped.set(day,labels);
 }
 for(const cell of grid.querySelectorAll('.employee-calendar-day')){
  const n=Number(cell.querySelector('small')?.textContent);
  if(!Number.isInteger(n)||n<1||n>31)continue;
  const key=prefix+pad(n),labels=grouped.get(key)||[],signature=labels.join('|');
  const old=cell.querySelector('.mrpro-calendar-chips');
  if(!labels.length){if(old)old.remove();cell.classList.remove('mrpro-has-process');continue;}
  cell.classList.add('mrpro-has-process');
  if(old?.dataset.signature===signature)continue;
  if(old)old.remove();
  const wrap=make('div','mrpro-calendar-chips');wrap.dataset.signature=signature;
  for(const proc of labels.slice(0,2)){
   const chip=make('button','mrpro-calendar-chip',proc);chip.type='button';chip.title=proc;
   chip.addEventListener('click',ev=>{ev.stopPropagation();openDay(vm,key);});wrap.append(chip);
  }
  if(labels.length>2)wrap.append(make('span','mrpro-calendar-more','+'+(labels.length-2)));
  cell.append(wrap);
 }
}
function paintBrowse(vm,overlay){
 const section=overlay.querySelector('.employee-process-section');
 if(!section)return;
 const original=section.querySelector('.employee-process-overview');
 if(!original)return;
 original.classList.add('mrpro-overview-original');
 let surface=section.querySelector('.mrpro-browse');
 if(!surface){
  surface=make('div','mrpro-browse');surface.setAttribute('aria-label','Assignment history');
  const nav=section.querySelector('.employee-process-navigation');
  if(nav)nav.after(surface);else original.before(surface);
 }
 const items=currentIntervals(vm),now=Date.now();
 const active=items.findIndex(x=>x.start<=now&&x.end>now);
 const next=items.findIndex(x=>x.start>now);
 const anchor=active>=0?active:next>=0?next:Math.max(0,items.length-1);
 const focused=items.length?Math.max(0,Math.min(items.length-1,anchor+offset)):-1;
 const l=words[lang(vm)]||words.pl;
 const signature=lang(vm)+'|'+focused+'|'+items.map(x=>[x.day,x.process,x.start,x.end].join(':')).join(';');
 if(surface.dataset.signature===signature)return;
 surface.dataset.signature=signature;
 surface.replaceChildren();
 const arrow=(delta,title,disabled)=>{
  const button=make('button','mrpro-browse-arrow',delta<0?'‹':'›');button.type='button';button.title=title;button.setAttribute('aria-label',title);button.disabled=disabled;
  button.addEventListener('click',()=>{offset+=delta;surface.dataset.signature='';paintBrowse(vm,overlay);});return button;
 };
 surface.append(arrow(-1,l.prev,focused<=0));
 const grid=make('div','mrpro-browse-grid');
 for(let pos=focused-1;pos<=focused+1;pos++){
  const item=items[pos];const status=pos<focused?l.older:pos===focused?l.selected:l.later;
  const card=make('button','mrpro-browse-card'+(pos===focused?' is-selected':''));card.type='button';card.disabled=!item;
  card.append(make('span','',status));card.append(make('strong','',item?.process||l.empty));
  if(item){card.append(make('small','',item.day+' · '+item.from+'–'+item.to));card.title=item.process+' · '+item.day;card.addEventListener('click',()=>{offset+=pos-focused;openDay(vm,item.day);surface.dataset.signature='';paintBrowse(vm,overlay);});}
  grid.append(card);
 }
 surface.append(grid,arrow(1,l.next,focused<0||focused===items.length-1));
}
function render(){
 scheduled=false;
 try{
  const overlay=d.querySelector('.employee-overlay');if(!overlay){personKey='';offset=0;return;}
  const vm=getVM();if(!vm)return;
  const id=String(vm.employeeProfile||'');if(personKey!==id){personKey=id;offset=0;}
  if(!styleAdded){const style=make('style');style.textContent=css;d.head.append(style);styleAdded=true;}
  const section=overlay.querySelector('.employee-process-section');
  if(section)paintBrowse(vm,overlay);
  const grid=overlay.querySelector('.employee-calendar-grid');
  if(grid)paintCalendar(vm,overlay);
 }catch(err){root.console?.warn?.('Mr. Robot: Procesy UI enhancement skipped; original view remains functional',err);}
}
function requestPaint(){if(!scheduled){scheduled=true;root.requestAnimationFrame?root.requestAnimationFrame(render):root.setTimeout(render,0);}}
function start(){
 const app=d.getElementById('app');if(!app)return;
 const observer=new MutationObserver(requestPaint);
 observer.observe(app,{subtree:true,childList:true,characterData:true});
 requestPaint();
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
