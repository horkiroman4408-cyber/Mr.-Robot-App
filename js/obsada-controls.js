/* Obsada-only control surfaces. UI adapters: persisted dates, model values and calculations stay unchanged. */
(function(root){
'use strict';
const tr=(pl,ru,en,uk)=>({pl,ru,en,uk})[(root.MRI18N&&root.MRI18N.language)||'pl']||pl;
const two=n=>String(n).padStart(2,'0');
const parseISO=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(String(s||''));if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3],12);return d.getFullYear()===+m[1]&&d.getMonth()===+m[2]-1&&d.getDate()===+m[3]?d:null;};
const iso=d=>`${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}`;
const position=(el,width=275)=>{if(!el)return {top:8,left:8,width};const r=el.getBoundingClientRect();const w=Math.min(Math.max(width,r.width),innerWidth-16);const h=Math.min(350,innerHeight-32);return {top:r.bottom+h+12>innerHeight&&r.top>h?Math.max(8,r.top-h-6):Math.max(8,Math.min(r.bottom+6,innerHeight-120)),left:Math.max(8,Math.min(r.left,innerWidth-w-8)),width:w};};
const select={
 inheritAttrs:false,props:{modelValue:[String,Number],modelModifiers:{type:Object,default:()=>({})},disabled:Boolean,lang:{type:String,default:'pl'}},emits:['update:modelValue','change'],
 setup(props,{emit,attrs,slots}){
  const localTr=(pl,ru,en,uk)=>({pl,ru,en,uk})[props.lang]||pl;
  const native=Vue.ref(null),button=Vue.ref(null),opened=Vue.ref(false),entries=Vue.ref([]),active=Vue.ref(0),coords=Vue.reactive({top:0,left:0,width:260}),search=Vue.ref('');
  const chosen=Vue.computed(()=>entries.value.find(o=>String(o.value)===String(props.modelValue))||null);
  const filtered=Vue.computed(()=>entries.value.map((o,i)=>({...o,index:i})).filter(o=>o.label.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())));
  const searchable=Vue.computed(()=>entries.value.length>9);
  function refresh(){if(!native.value)return;const next=[...native.value.options].map(o=>({value:o.value,label:o.textContent.trim(),disabled:o.disabled}));if(JSON.stringify(entries.value)!==JSON.stringify(next))entries.value=next;}
  function close(){opened.value=false;search.value='';}
  function open(){if(props.disabled)return;refresh();Object.assign(coords,position(button.value,Math.max(button.value?.offsetWidth||220,250)));opened.value=true;active.value=Math.max(0,entries.value.findIndex(o=>String(o.value)===String(props.modelValue)));Vue.nextTick(()=>document.querySelector('.mr-obs-select-search')?.focus());}
  function selectOption(o){if(o.disabled)return;let v=o.value;if(props.modelModifiers?.number&&v!==''&&!Number.isNaN(Number(v)))v=Number(v);emit('update:modelValue',v);emit('change',{target:{value:v}});close();Vue.nextTick(()=>button.value?.focus());}
  function keydown(e){if(!opened.value){if(['Enter',' ','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();open();}return;}
   if(e.key==='Escape'){e.preventDefault();close();button.value?.focus();}
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const a=filtered.value;if(!a.length)return;let i=a.findIndex(o=>o.index===active.value);for(let j=0;j<a.length;j++){i=(i+(e.key==='ArrowDown'?1:-1)+a.length)%a.length;if(!a[i].disabled){active.value=a[i].index;break;}}}
   if(e.key==='Enter'&&!e.target.matches('input')){e.preventDefault();const o=entries.value[active.value];if(o)selectOption(o);}
  }
  function outside(e){if(opened.value&&!button.value?.contains(e.target)&&!e.target.closest('.mr-obs-select-popup'))close();}
  function onWindow(event){if(event?.target?.closest?.('.mr-obs-control-layer'))return;if(opened.value)close();}
  Vue.onMounted(()=>{refresh();document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',keydown);window.addEventListener('resize',onWindow);window.addEventListener('scroll',onWindow,true);});
  Vue.onBeforeUnmount(()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',keydown);window.removeEventListener('resize',onWindow);window.removeEventListener('scroll',onWindow,true);});
  Vue.watch(()=>props.modelValue,()=>Vue.nextTick(refresh));Vue.onUpdated(refresh);
  return {attrs,slots,native,button,opened,entries,active,coords,search,chosen,filtered,searchable,refresh,close,open,selectOption,tr:localTr};
 },
 template:`<span class="mr-obs-select-wrap"><select ref="native" class="mr-obs-select-native" :value="modelValue" :disabled="disabled" v-bind="attrs" tabindex="-1" aria-hidden="true"><slot/></select><button ref="button" type="button" class="mr-obs-select-trigger" :disabled="disabled" :aria-label="attrs['aria-label']||chosen?.label||tr('Wybierz','Выбрать','Select','Оберіть')" aria-haspopup="listbox" :aria-expanded="opened" @click="opened?close():open()"><span>{{chosen?.label||tr('Wybierz','Выбрать','Select','Оберіть')}}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button>
 <teleport to="body"><div v-if="opened" class="obsada-module mr-obs-control-layer mr-obs-select-popup" :style="{top:coords.top+'px',left:coords.left+'px',width:coords.width+'px'}"><input v-if="searchable" class="mr-obs-select-search" v-model="search" :placeholder="tr('Szukaj…','Поиск…','Search…','Пошук…')" :aria-label="tr('Szukaj opcji','Поиск вариантов','Search options','Пошук варіантів')" @keydown.stop="keydown"/><div class="mr-obs-option-list" role="listbox"><button v-for="o in filtered" :key="o.index" type="button" role="option" class="mr-obs-option" :class="{'is-selected':String(o.value)===String(modelValue),'is-active':o.index===active}" :aria-selected="String(o.value)===String(modelValue)" :disabled="o.disabled" @click="selectOption(o)" @mouseenter="active=o.index"><span>{{o.label}}</span><span v-if="String(o.value)===String(modelValue)" aria-hidden="true">✓</span></button><p v-if="!filtered.length" class="mr-obs-empty">{{tr('Brak wyników','Ничего не найдено','No matches','Нічого не знайдено')}}</p></div></div></teleport></span>`
};
const date={
 props:{modelValue:{type:String,default:''},disabled:Boolean,lang:{type:String,default:'pl'}},emits:['update:modelValue'],
 setup(props,{emit}){
  const localTr=(pl,ru,en,uk)=>({pl,ru,en,uk})[props.lang]||pl;
  const text=Vue.ref(''),invalid=Vue.ref(false),opened=Vue.ref(false),button=Vue.ref(null),coords=Vue.reactive({top:0,left:0,width:282}),year=Vue.ref(new Date().getFullYear()),month=Vue.ref(new Date().getMonth());
  const fmt=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(s||'');return m?`${m[3]}.${m[2]}.${m[1]}`:'';};
  Vue.watch(()=>props.modelValue,v=>{text.value=fmt(v);invalid.value=false;},{immediate:true});
  function commit(){const m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text.value.trim());const v=m?`${m[3]}-${two(+m[2])}-${two(+m[1])}`:'';if(parseISO(v)){invalid.value=false;text.value=fmt(v);if(v!==props.modelValue)emit('update:modelValue',v);}else{invalid.value=!!text.value;text.value=fmt(props.modelValue);}}
  function open(){if(props.disabled)return;const d=parseISO(props.modelValue)||new Date();year.value=d.getFullYear();month.value=d.getMonth();Object.assign(coords,position(button.value,282));opened.value=true;}
  function move(n){const d=new Date(year.value,month.value+n,1,12);year.value=d.getFullYear();month.value=d.getMonth();}
  const days=Vue.computed(()=>{const first=new Date(year.value,month.value,1,12);const n=new Date(year.value,month.value+1,0,12).getDate();const off=(first.getDay()+6)%7;return [...Array(off).fill(null),...Array.from({length:n},(_,i)=>i+1)];});
  const weekday=i=>({pl:['Pn','Wt','Śr','Cz','Pt','Sb','Nd'],ru:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],en:['Mo','Tu','We','Th','Fr','Sa','Su'],uk:['Пн','Вт','Ср','Чт','Пт','Сб','Нд']})[props.lang||'pl']?.[i]||['Mo','Tu','We','Th','Fr','Sa','Su'][i];
  const heading=Vue.computed(()=>new Intl.DateTimeFormat(({pl:'pl-PL',ru:'ru-RU',en:'en-GB',uk:'uk-UA'})[props.lang]||'pl-PL',{month:'long',year:'numeric'}).format(new Date(year.value,month.value,1)));
  function choose(d){emit('update:modelValue',iso(new Date(year.value,month.value,d,12)));opened.value=false;}
  function today(){emit('update:modelValue',iso(new Date()));opened.value=false;}
  function close(){opened.value=false;}
  function outside(e){if(opened.value&&!button.value?.contains(e.target)&&!e.target.closest('.mr-obs-calendar-popup'))close();}
  function keydown(e){if(e.key==='Escape'&&opened.value){close();button.value?.focus();}}
  function onWindow(event){if(event?.target?.closest?.('.mr-obs-control-layer'))return;if(opened.value)close();}
  Vue.onMounted(()=>{document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',keydown);window.addEventListener('resize',onWindow);window.addEventListener('scroll',onWindow,true);});
  Vue.onBeforeUnmount(()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',keydown);window.removeEventListener('resize',onWindow);window.removeEventListener('scroll',onWindow,true);});
  return {text,invalid,opened,button,coords,year,month,days,heading,commit,move,choose,today,close,open,tr:localTr,iso,weekday};
 },
 template:`<span class="mr-obs-date-field mr-obs-custom-date"><input class="mr-obs-date-text" type="text" inputmode="numeric" autocomplete="off"  :placeholder="tr('dd.mm.rrrr','дд.мм.гггг','dd.mm.yyyy','дд.мм.рррр')" :aria-label="tr('Data (dd.mm.rrrr)','Дата (дд.мм.гггг)','Date (dd.mm.yyyy)','Дата (дд.мм.рррр)')" :aria-invalid="invalid" :disabled="disabled" v-model="text" @blur="commit" @keydown.enter.prevent="commit" maxlength="10"><button ref="button" type="button" class="mr-obs-calendar-trigger" :disabled="disabled" :aria-label="tr('Wybierz datę','Выбрать дату','Choose date','Вибрати дату')" :aria-expanded="opened" aria-haspopup="dialog" @click="opened?close():open()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v5m9-5v5M3.5 10h17"/></svg></button>
 <teleport to="body"><div v-if="opened" class="obsada-module mr-obs-control-layer mr-obs-calendar-popup" role="dialog" :aria-label="tr('Kalendarz','Календарь','Calendar','Календар')" :style="{top:coords.top+'px',left:coords.left+'px',width:coords.width+'px'}"><div class="mr-obs-calendar-head"><button type="button" @click="move(-1)"  :aria-label="tr('Poprzedni miesiąc','Предыдущий месяц','Previous month','Попередній місяць')">‹</button><strong>{{heading}}</strong><button type="button" @click="move(1)"  :aria-label="tr('Następny miesiąc','Следующий месяц','Next month','Наступний місяць')">›</button></div><div class="mr-obs-calendar-grid"><span v-for="s in ['Mo','Tu','We','Th','Fr','Sa','Su']" :key="s" class="mr-obs-calendar-weekday">{{weekday(['Mo','Tu','We','Th','Fr','Sa','Su'].indexOf(s))}}</span><template v-for="(day,i) in days" :key="i"><span v-if="day===null" class="mr-obs-calendar-blank"></span><button v-else type="button" class="mr-obs-calendar-day" :class="{'is-selected':iso(new Date(year,month,day,12))===modelValue,'is-today':iso(new Date(year,month,day,12))===iso(new Date())}" :aria-pressed="iso(new Date(year,month,day,12))===modelValue" @click="choose(day)">{{day}}</button></template></div><div class="mr-obs-calendar-foot"><button type="button" @click="today()">{{tr('Dzisiaj','Сегодня','Today','Сьогодні')}}</button><button type="button" @click="close()">{{tr('Zamknij','Закрыть','Close','Закрити')}}</button></div></div></teleport></span>`
};
root.MRObsadaControls={select,date,parseISO,iso};
})(window);
