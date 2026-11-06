/* Segmented 24-hour time editor for OpenReports Bridge. */
(function(){'use strict';
  const pad=n=>String(n).padStart(2,'0');
  const parts=['hour','minute','second'];
  const limits=[23,59,59];
  const locales={
    pl:['Godziny 00–23','Minuty 00–59','Sekundy 00–59'],
    ru:['Часы 00–23','Минуты 00–59','Секунды 00–59'],
    en:['Hours 00–23','Minutes 00–59','Seconds 00–59'],
    uk:['Години 00–23','Хвилини 00–59','Секунди 00–59']
  };
  const tr=i=>(locales[document.documentElement.lang?.slice(0,2)]||locales.pl)[i];
  function markup(prefix){
    return `<span class="mr-period-clock" data-clock="${prefix}" role="group">
      ${parts.map((p,i)=>`${i?'<span class="mr-time-colon" aria-hidden="true">:</span>':''}<input id="${prefix}-${p}" class="mr-time-segment" type="text" inputmode="numeric" maxlength="2" placeholder="${['HH','MM','SS'][i]}" data-part="${i}" aria-label="${['Hours','Minutes','Seconds'][i]}" autocomplete="off" spellcheck="false">`).join('')}
    </span>`;
  }
  function parse(v){
    const match=/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/.exec(String(v||'').trim());
    if(!match)return null;
    const n=match.slice(1).map(Number);
    return n.every((value,i)=>value<=limits[i])?n:null;
  }
  const liveEditors=new WeakMap();
  function attach(root,prefix,time){
    const inputs=parts.map(p=>root.querySelector('#'+prefix+'-'+p));
    if(inputs.some(x=>!x))throw new Error('Time inputs missing: '+prefix);
    let last=(parse(time)||[0,0,0]).map(pad);
    const setPart=(i,value)=>{inputs[i].value=pad(value);inputs[i].dataset.last=pad(value);inputs[i].setAttribute('aria-invalid','false');last[i]=pad(value);};
    last.forEach((value,i)=>setPart(i,value));
    liveEditors.set(inputs[0],values=>values.forEach((value,i)=>setPart(i,value)));
    inputs.forEach((input,i)=>{
      input.setAttribute('aria-label',tr(i));
      input.addEventListener('focus',()=>input.select());
      input.addEventListener('click',()=>input.select());
      input.addEventListener('input',()=>{
        // Only edit this segment. Never rebuild the entire time string while typing.
        input.value=input.value.replace(/\D/g,'').slice(0,2);
        if(input.value.length===2){
          if(Number(input.value)<=limits[i]){
            setPart(i,Number(input.value));
            if(i<2){inputs[i+1].focus();}
          }else input.setAttribute('aria-invalid','true');
        }else input.setAttribute('aria-invalid','false');
      });
      input.addEventListener('blur',()=>{
        const value=input.value;
        if(/^\d{1,2}$/.test(value)&&Number(value)<=limits[i])setPart(i,Number(value));
        else setPart(i,last[i]);
      });
      input.addEventListener('keydown',event=>{
        if(event.key==='ArrowLeft'&&i>0){event.preventDefault();inputs[i-1].focus();}
        else if(event.key==='ArrowRight'&&i<2){event.preventDefault();inputs[i+1].focus();}
        else if(event.key==='ArrowUp'||event.key==='ArrowDown'){
          event.preventDefault();const value=Number(input.value);const n=Number.isFinite(value)&&value<=limits[i]?value:Number(last[i]);
          const delta=event.key==='ArrowUp'?1:-1;
          setPart(i,(n+delta+limits[i]+1)%(limits[i]+1));input.select();
        }
        else if(event.key==='Backspace'&&input.selectionStart===0&&input.selectionEnd===0&&i>0){event.preventDefault();inputs[i-1].focus();}
      });
      input.addEventListener('paste',event=>{
        const value=event.clipboardData?.getData('text')?.trim()||'';
        if(!value)return;
        const full=parse(value);
        if(full){
          event.preventDefault();full.forEach((v,j)=>setPart(j,v));inputs[i].select();return;
        }
        if(/^\d{1,2}$/.test(value)){
          event.preventDefault();
          if(Number(value)<=limits[i])setPart(i,Number(value));
          else input.setAttribute('aria-invalid','true');
          input.select();
        }
      });
    });
  }
  function read(root,prefix){
    const values=parts.map((p,i)=>{
      const el=root.querySelector('#'+prefix+'-'+p);
      if(!el||!/^(\d{1,2})$/.test(el.value)||Number(el.value)>limits[i])return null;
      return pad(Number(el.value));
    });
    return values.includes(null)?null:values.join(':');
  }
  function set(root,prefix,time){
    const values=parse(time);
    const first=root.querySelector('#'+prefix+'-hour');
    const editor=first&&liveEditors.get(first);
    if(!values||!editor)return false;
    editor(values);return true;
  }
  globalThis.MRBridgeTime={markup,attach,read,set};
})();
