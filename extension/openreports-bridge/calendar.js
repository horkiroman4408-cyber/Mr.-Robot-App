/* Shared inline date picker for OpenReports Bridge. No native date/time widgets. */
(function(){'use strict';
  const pad=n=>String(n).padStart(2,'0');
  const locale=()=>({pl:'pl-PL',ru:'ru-RU',en:'en-GB',uk:'uk-UA'})[document.documentElement.lang?.slice(0,2)]||'pl-PL';
  const labels={
    pl:{today:'Dzisiaj',close:'Zamknij',previous:'Poprzedni miesiąc',next:'Następny miesiąc',day:'Wybierz dzień',month:'Miesiąc',year:'Rok',open:'Otwórz kalendarz'},
    ru:{today:'Сегодня',close:'Закрыть',previous:'Предыдущий месяц',next:'Следующий месяц',day:'Выбрать день',month:'Месяц',year:'Год',open:'Открыть календарь'},
    en:{today:'Today',close:'Close',previous:'Previous month',next:'Next month',day:'Choose day',month:'Month',year:'Year',open:'Open calendar'},
    uk:{today:'Сьогодні',close:'Закрити',previous:'Попередній місяць',next:'Наступний місяць',day:'Вибрати день',month:'Місяць',year:'Рік',open:'Відкрити календар'}
  };
  const l=()=>labels[document.documentElement.lang?.slice(0,2)]||labels.pl;
  const parse=value=>{const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value||'').trim());
    if(!m)return null;const d=+m[1],mo=+m[2],y=+m[3];
    if(y<1900||y>2100||mo<1||mo>12||d<1||d>new Date(y,mo,0).getDate())return null;
    return new Date(y,mo-1,d);};
  const fmt=d=>`${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
  let current=null;
  function css(){if(document.getElementById('mr-bridge-calendar-style'))return;
    const st=document.createElement('style');st.id='mr-bridge-calendar-style';st.textContent=`
    .mr-period-date{position:relative;display:flex!important;gap:5px;align-items:center}
    .mr-period-date input{min-width:0;flex:1}
    .mr-period-date .mr-cal-open{flex:none!important;min-width:38px;width:38px;height:40px;padding:0!important;border:1px solid #d7dbe3!important;background:#fff!important;color:#475569!important;border-radius:9px!important;display:grid;place-items:center;cursor:pointer}
    .mr-period-date .mr-cal-open:hover{background:#f3f5f9!important}
    .mr-bridge-calendar{width:100%;margin:5px 0 10px;padding:12px;border:1px solid #dce2ea;border-radius:13px;background:#fff;color:#20252e;box-shadow:0 5px 17px #13182313;font:13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif}
    .mr-bridge-calendar[hidden]{display:none!important}
    .mr-cal-bar{display:flex;gap:5px;align-items:center;justify-content:space-between;margin-bottom:10px}
    .mr-cal-bar select{width:auto;min-width:0;flex:1;padding:7px 4px;border:1px solid #dce2ea;border-radius:8px;background:#fff;color:#20252e;font:600 12px system-ui}
    .mr-bridge-calendar button{width:auto;min-width:0;flex:none;margin:0;border:0;background:transparent;color:inherit;border-radius:7px;cursor:pointer;padding:6px!important;font:600 12px system-ui}
    .mr-bridge-calendar button:hover{background:#eef1f7}
    .mr-cal-week,.mr-cal-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;text-align:center}
    .mr-cal-week{margin:0 0 5px;color:#758093;font-size:10px;font-weight:650}
    .mr-cal-day{aspect-ratio:1.18;display:grid!important;place-items:center;font-variant-numeric:tabular-nums}
    .mr-cal-day[aria-selected=true]{background:#253247!important;color:#fff!important}
    .mr-cal-day.is-today:not([aria-selected=true]){outline:1px solid #8796ac;outline-offset:-2px}
    .mr-cal-spacer{min-height:24px}
    .mr-cal-footer{margin-top:9px;display:flex;justify-content:space-between;border-top:1px solid #e6eaf1;padding-top:7px}
    .mr-cal-footer button{color:#385c9c}
    `;document.head.append(st);}
  function attach(root,prefix){
    css();
    const input=root.querySelector('#'+prefix+'-date');if(!input)return;
    const wrapper=input.closest('.mr-period-date');if(!wrapper||wrapper.dataset.calendarAttached)return;
    wrapper.dataset.calendarAttached='true';
    const button=document.createElement('button');button.type='button';button.className='mr-cal-open';
    button.setAttribute('aria-label',l().open);button.setAttribute('aria-expanded','false');
    button.innerHTML='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';
    wrapper.append(button);
    const container=document.createElement('div');container.className='mr-bridge-calendar';container.hidden=true;container.id=prefix+'-calendar';
    button.setAttribute('aria-controls',container.id);
    // Below the whole two-column date/time row to prevent clipping and cramped grids.
    const grid=wrapper.closest('.mr-or-grid');
    const anchor=grid || wrapper.parentElement;
    anchor.insertAdjacentElement('afterend',container);
    let viewed=parse(input.value)||new Date();
    function close(){container.hidden=true;button.setAttribute('aria-expanded','false');if(current===container)current=null;}
    function render(){const selected=parse(input.value),year=viewed.getFullYear(),month=viewed.getMonth();
      container.replaceChildren();
      const bar=document.createElement('div');bar.className='mr-cal-bar';
      const prev=document.createElement('button');prev.type='button';prev.textContent='‹';prev.title=l().previous;
      const next=document.createElement('button');next.type='button';next.textContent='›';next.title=l().next;
      const months=document.createElement('select');months.setAttribute('aria-label',l().month);
      for(let m=0;m<12;m++){const opt=document.createElement('option');opt.value=String(m);opt.textContent=new Intl.DateTimeFormat(locale(),{month:'long'}).format(new Date(2026,m,1));months.append(opt)}months.value=String(month);
      const years=document.createElement('select');years.setAttribute('aria-label',l().year);
      for(let y=year-30;y<=year+30;y++){const opt=document.createElement('option');opt.value=String(y);opt.textContent=String(y);years.append(opt)}years.value=String(year);
      const move=delta=>{viewed=new Date(year,month+delta,1);render();};
      prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
      months.addEventListener('change',()=>{viewed=new Date(year,+months.value,1);render();});
      years.addEventListener('change',()=>{viewed=new Date(+years.value,month,1);render();});
      bar.append(prev,months,years,next);container.append(bar);
      const week=document.createElement('div');week.className='mr-cal-week';
      for(let i=0;i<7;i++){const label=document.createElement('span');label.textContent=new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(new Date(2026,10,2+i));week.append(label)}container.append(week);
      const days=document.createElement('div');days.className='mr-cal-days';
      const offset=(new Date(year,month,1).getDay()+6)%7;for(let i=0;i<offset;i++){const sp=document.createElement('span');sp.className='mr-cal-spacer';days.append(sp)}
      const max=new Date(year,month+1,0).getDate(),today=new Date();
      for(let d=1;d<=max;d++){
        const day=new Date(year,month,d),el=document.createElement('button');el.type='button';el.className='mr-cal-day';el.textContent=String(d);el.setAttribute('aria-label',new Intl.DateTimeFormat(locale(),{day:'numeric',month:'long',year:'numeric'}).format(day));
        el.setAttribute('aria-selected',String(!!selected&&selected.getTime()===day.getTime()));
        if(today.toDateString()===day.toDateString())el.classList.add('is-today');
        el.addEventListener('click',()=>{input.value=fmt(day);input.dispatchEvent(new Event('change',{bubbles:true}));close();input.focus();});days.append(el);
      }container.append(days);
      const footer=document.createElement('div');footer.className='mr-cal-footer';
      const todayBtn=document.createElement('button');todayBtn.type='button';todayBtn.textContent=l().today;todayBtn.addEventListener('click',()=>{input.value=fmt(new Date());input.dispatchEvent(new Event('change',{bubbles:true}));close();});
      const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.textContent=l().close;closeBtn.addEventListener('click',close);footer.append(todayBtn,closeBtn);container.append(footer);
    }
    button.addEventListener('click',()=>{
      if(!container.hidden){close();return;}
      if(current&&current!==container){current.hidden=true;const other=document.querySelector('button[aria-controls="'+current.id+'"]');other?.setAttribute('aria-expanded','false');}
      viewed=parse(input.value)||new Date();render();container.hidden=false;button.setAttribute('aria-expanded','true');current=container;
    });
    input.addEventListener('change',()=>{if(!container.hidden){viewed=parse(input.value)||viewed;render();}});
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!container.hidden){close();ev.stopPropagation();}},true);
  }
  globalThis.MRBridgeCalendar={attach};
})();
