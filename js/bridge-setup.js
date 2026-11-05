/* UI-only detection and installer. Never touches report files or auth. */
(function(){'use strict';
 const get=id=>document.getElementById(id);
 const supported=['pl','ru','en','uk'];
 const T={
 pl:{connected:'Połączono · v{v}',missing:'Nie wykryto rozszerzenia',action:'Szczegóły',close:'Zwiń',description:'OpenReports Bridge łączy OpenReports-WMS z modułami Mr. Robot. Obecnie obsługuje AL_AUDYT / FORMATKA_59 i GODZINY_MDT.',download:'Pobierz Bridge v0.2.8',how:'Rozpakuj ZIP → edge://extensions → Tryb dewelopera → Załaduj rozpakowane → wybierz folder extension. Następnie odśwież Mr. Robot.',warning:'Nie można instalować rozszerzeń automatycznie z aplikacji PWA. Jeśli Twoja firma blokuje rozszerzenia, skontaktuj się z IT.'},
 ru:{connected:'Подключено · v{v}',missing:'Расширение не обнаружено',action:'Подробнее',close:'Свернуть',description:'OpenReports Bridge подключает OpenReports-WMS к модулям Mr. Robot. Сейчас поддерживает AL_AUDYT / FORMATKA_59 и GODZINY_MDT.',download:'Скачать Bridge v0.2.8',how:'Распакуй ZIP → edge://extensions → Режим разработчика → Загрузить распакованное расширение → выбери папку extension. Затем обнови Mr. Robot.',warning:'PWA не может самостоятельно устанавливать расширения. Если корпоративные правила блокируют установку, обратись в IT.'},
 en:{connected:'Connected · v{v}',missing:'Extension not detected',action:'Details',close:'Collapse',description:'OpenReports Bridge connects OpenReports-WMS to Mr. Robot modules. Currently supports AL_AUDYT / FORMATKA_59 and GODZINY_MDT.',download:'Download Bridge v0.2.8',how:'Unzip → edge://extensions → Developer mode → Load unpacked → select the extension folder. Then refresh Mr. Robot.',warning:'A PWA cannot install a browser extension automatically. If company policy blocks extensions, contact IT.'},
 uk:{connected:'Підключено · v{v}',missing:'Розширення не виявлено',action:'Докладніше',close:'Згорнути',description:'OpenReports Bridge підключає OpenReports-WMS до модулів Mr. Robot. Зараз підтримує AL_AUDYT / FORMATKA_59 і GODZINY_MDT.',download:'Завантажити Bridge v0.2.8',how:'Розпакуй ZIP → edge://extensions → Режим розробника → Завантажити розпаковане → вибери папку extension. Потім онови Mr. Robot.',warning:'PWA не може автоматично встановлювати розширення. Якщо корпоративні правила блокують встановлення, звернися до IT.'}
 };
 const lang=()=>{const x=window.MRI18N?.language||document.documentElement.lang||'pl';return supported.includes(x)?x:'pl'};
 const state={version:null};
 function draw(){
  const panel=document.getElementById('settings-openreports');
  const indicator=get('mr-bridge-indicator-dot');
  const trigger=get('mr-bridge-indicator');
  const t=T[lang()],present=!!state.version;
  if(indicator)indicator.dataset.connected=String(present);
  if(trigger)trigger.title='OpenReports Bridge · '+(present?t.connected.replace('{v}',state.version):t.missing);
  if(!panel)return;
 get('mr-bridge-status').textContent=present?t.connected.replace('{v}',state.version):t.missing;
 get('mr-bridge-dot').dataset.connected=String(present);
 get('mr-bridge-category').textContent=({pl:'Integracje',ru:'Интеграции',en:'Integrations',uk:'Інтеграції'})[lang()];
 get('mr-bridge-description').textContent=t.description;get('mr-bridge-download').textContent=t.download;
 get('mr-bridge-warning').textContent=t.warning;
 }
 function detect(){const v=document.documentElement.dataset.mrOpenreportsBridge;
 state.version=/^\d+\.\d+\.\d+$/.test(v||'')?v:null;draw();}
 document.addEventListener('mr-openreports-bridge-ready',detect);
 if(window.MRI18N?.subscribe)window.MRI18N.subscribe(draw);
 // Settings is rendered on demand by Vue (v-if). It does not exist at initial script load.
 // Only redraw when the relevant DOM node identity changes; avoid a MutationObserver loop.
 const root=document.getElementById('app')||document.body;
 let lastPanel=null,lastIndicator=null;
 function onDOMChange(){
  const panel=get('settings-openreports'),indicator=get('mr-bridge-indicator-dot');
  if(panel!==lastPanel||indicator!==lastIndicator){
   lastPanel=panel;lastIndicator=indicator;draw();
  }
 }
 new MutationObserver(onDOMChange).observe(root,{childList:true,subtree:true});
 document.addEventListener('mrbot-view-change',()=>queueMicrotask(onDOMChange));
 // No attempt to install extensions or read any corporate report data.
 detect();document.dispatchEvent(new Event('mr-openreports-bridge-query'));
 setTimeout(detect,600);setTimeout(detect,2500);
})();
