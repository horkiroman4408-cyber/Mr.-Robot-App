/* Theme preference is isolated from report storage and safe when storage is blocked. */
(function(){
 const root=document.documentElement;
 const system=window.matchMedia('(prefers-color-scheme: dark)');
 let explicit=false,db=null,pending=null;
 function render(theme){
   root.dataset.theme=theme;
   const button=document.getElementById('theme-toggle');
   if(button){
     const dark=theme==='dark';
     button.setAttribute('aria-pressed',String(dark));
     button.setAttribute('aria-label',window.MRI18N.t(dark?'Włącz jasny motyw':'Włącz ciemny motyw'));
     button.title=window.MRI18N.t(dark?'Włącz jasny motyw':'Włącz ciemny motyw');
     button.querySelector('.theme-label').textContent=window.MRI18N.t(dark?'Jasny motyw':'Ciemny motyw');
   }
 }
 function save(theme){
   pending=theme;
   if(!db)return;
   try{const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put(theme,'theme');tx.oncomplete=()=>{if(pending===theme)pending=null;};}catch(e){}
 }
 window.MRTheme={set:function(theme){if(theme!=='light'&&theme!=='dark')return;explicit=true;render(theme);save(theme);}};
 render(system.matches?'dark':'light');
 try{
   const request=indexedDB.open('mrrobot-preferences',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('settings');
   request.onsuccess=()=>{
     db=request.result;
     db.onversionchange=()=>{db.close();db=null;};
     if(pending){save(pending);return;}
     const read=db.transaction('settings').objectStore('settings').get('theme');
     read.onsuccess=()=>{if(!explicit&&(read.result==='light'||read.result==='dark')){explicit=true;render(read.result);}};
   };
   request.onerror=()=>{};
 }catch(e){}
 function systemChanged(e){if(!explicit)render(e.matches?'dark':'light');}
 if(system.addEventListener)system.addEventListener('change',systemChanged);
 document.addEventListener('click',e=>{
   if(!e.target.closest('#theme-toggle'))return;
   explicit=true;
   const theme=root.dataset.theme==='dark'?'light':'dark';
   render(theme);save(theme);
 });
 document.addEventListener('DOMContentLoaded',()=>render(root.dataset.theme));
})();
