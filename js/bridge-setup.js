/* OpenReports Bridge: UI-only installation guide and connection indicator. */
(function () { 'use strict';
  const get = id => document.getElementById(id);
  const translations = {
    pl: { connected: 'Połączono · v{v}', missing: 'Nie wykryto rozszerzenia', warning: 'PWA nie może samodzielnie zainstalować rozszerzenia. Jeśli zasady firmowe blokują instalację, skontaktuj się z IT.', copied: 'Skopiowano', copy: 'Kopiuj', latest: "Aktualna wersja", update: "Dostępna aktualizacja", installed: "Zainstalowano", available: "Dostępna", download: "Pobierz Bridge v{v}", history: "Historia wersji Bridge", checking: "Sprawdzam aktualizacje…", unknown: "Nie udało się sprawdzić aktualizacji. Zainstalowana wersja nadal działa.", first: "Pobierz Bridge v{v} i rozpakuj ZIP.", upToDate: "Wersja jest aktualna", compat: "Do użycia tej wersji Mr. Robot wymagana jest aktualizacja Bridge.", updateHow: "Aktualizując rozpakowane rozszerzenie, zastąp pliki w dotychczasowym folderze i kliknij „Przeładuj” w menedżerze rozszerzeń. Nie instaluj drugiej kopii.", noHistory: "Historia będzie dostępna po połączeniu z GitHub." },
    ru: { connected: 'Подключено · v{v}', missing: 'Расширение не обнаружено', warning: 'PWA не может самостоятельно устанавливать расширения. Если корпоративные правила запрещают установку, обратись в IT.', copied: 'Скопировано', copy: 'Копировать', latest: "Актуальная версия", update: "Доступно обновление", installed: "Установлено", available: "Доступна", download: "Скачать Bridge v{v}", history: "История обновлений Bridge", checking: "Проверяю обновления…", unknown: "Не удалось проверить обновления. Установленный Bridge продолжает работать.", first: "Скачай Bridge v{v} и распакуй ZIP.", upToDate: "Установлена последняя версия", compat: "Для совместимости с Mr. Robot необходимо обновить Bridge.", updateHow: "Для обновления замени файлы в прежней папке расширения и нажми «Обновить» на странице расширений. Не устанавливай вторую копию.", noHistory: "История появится после подключения к GitHub." },
    en: { connected: 'Connected · v{v}', missing: 'Extension not detected', warning: 'A PWA cannot install extensions automatically. If corporate policy blocks installation, contact IT.', copied: 'Copied', copy: 'Copy', latest: "Up to date", update: "Update available", installed: "Installed", available: "Available", download: "Download Bridge v{v}", history: "Bridge release history", checking: "Checking for updates…", unknown: "Cannot check for updates. Your installed Bridge can still work.", first: "Download Bridge v{v} and extract the ZIP.", upToDate: "Latest version installed", compat: "A Bridge update is required for this Mr. Robot version.", updateHow: "To update, replace files in the existing extension folder and click Reload on the extensions page. Do not install a second copy.", noHistory: "Release history will appear when connected to GitHub." },
    uk: { connected: 'Підключено · v{v}', missing: 'Розширення не виявлено', warning: 'PWA не може автоматично встановлювати розширення. Якщо корпоративні правила забороняють встановлення, звернися до IT.', copied: 'Скопійовано', copy: 'Копіювати', latest: "Актуальна версія", update: "Доступне оновлення", installed: "Встановлено", available: "Доступна", download: "Завантажити Bridge v{v}", history: "Історія оновлень Bridge", checking: "Перевірка оновлень…", unknown: "Не вдалося перевірити оновлення. Встановлений Bridge може працювати далі.", first: "Завантаж Bridge v{v} і розпакуй ZIP.", upToDate: "Встановлено найновішу версію", compat: "Для сумісності з Mr. Robot потрібно оновити Bridge.", updateHow: "Щоб оновити, заміни файли в поточній папці розширення й натисни «Оновити» на сторінці розширень. Не встановлюй другу копію.", noHistory: "Історія з’явиться після підключення до GitHub." }
  };
  function lang() {
    const raw = String(window.MRI18N?.language || document.documentElement.lang || 'pl').toLowerCase().slice(0, 2);
    return translations[raw] ? raw : 'pl';
  }
  function detectedBrowser() {
    const ua = navigator.userAgent || '';
    if (/Edg\//i.test(ua)) return 'edge';
    if (/Chrome\//i.test(ua) && !/(OPR|Opera|YaBrowser|Brave)\//i.test(ua)) return 'chrome';
    return 'edge'; // Fallback is explicitly switchable by the user.
  }
  const FALLBACK_VERSION='0.3.0';
  const state = {version:null,browser:detectedBrowser(),expanded:false,historyExpanded:false,copyNotice:false,latest:null,history:null,check:'idle',lastCheck:0};
  function tr(key,vars={}){const v=translations[lang()][key]||translations.pl[key]||key;return v.replace(/\{(\w+)\}/g,(_,k)=>String(vars[k]||''));}
  function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i]?1:-1;}return 0;}
  function validVersion(v){return typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);}
  // Never allow arbitrary URLs in release metadata to become download links.
  function validRelease(info){return info&&validVersion(info.version)&&validVersion(info.minCompatibleVersion)&&
    typeof info.download==='string'&&/^downloads\/OpenReports-Bridge-v\d+\.\d+\.\d+\.zip$/.test(info.download)&&
    info.download===`downloads/OpenReports-Bridge-v${info.version}.zip`&&info.changelog==='extension/openreports-bridge/history.json';}
  function browserUrl(){return state.browser==='chrome'?'chrome://extensions':'edge://extensions';}
  function appendHistory(list){
    list.replaceChildren();
    const versions=Array.isArray(state.history?.releases)?state.history.releases:[];
    if(!versions.length){const msg=document.createElement('p');msg.textContent=tr('noHistory');list.append(msg);return;}
    for(const release of versions.slice(0,20)){
      if(!validVersion(release.version))continue;
      const entry=document.createElement('div');entry.className='mr-bridge-release';
      const label=document.createElement('strong');label.textContent='v'+release.version+(release.date?' · '+release.date:'');entry.append(label);
      const h=document.createElement('div');h.textContent=release.title?.[lang()]||release.title?.pl||'';entry.append(h);
      const changes=release.changes?.[lang()]||release.changes?.pl||[];
      if(Array.isArray(changes)){const ul=document.createElement('ul');for(const item of changes.slice(0,10)){const li=document.createElement('li');li.textContent=String(item);ul.append(li);}entry.append(ul);}
      list.append(entry);
    }
  }
  function draw(){
    const present=!!state.version;
    const status=present?tr('connected',{v:state.version}):tr('missing');
    const dot=get('mr-bridge-indicator-dot');if(dot)dot.dataset.connected=String(present);
    const trigger=get('mr-bridge-indicator');if(trigger)trigger.title='OpenReports Bridge · '+status;
    const panel=get('settings-openreports');if(!panel)return;
    const put=(id,text)=>{const el=get(id);if(el)el.textContent=text;};
    put('mr-bridge-status',status);const mainDot=get('mr-bridge-dot');if(mainDot)mainDot.dataset.connected=String(present);
    put('mr-bridge-warning',tr('warning'));
    panel.querySelectorAll('[data-bridge-browser]').forEach(b=>{const active=b.dataset.bridgeBrowser===state.browser;b.setAttribute('aria-pressed',String(active));b.classList.toggle('is-selected',active);});
    put('mr-bridge-extension-url',browserUrl());
    const install=get('mr-bridge-install-toggle'),installBody=get('mr-bridge-install-body');
    if(install)install.setAttribute('aria-expanded',String(state.expanded));if(installBody)installBody.hidden=!state.expanded;
    put('mr-bridge-copy-label',state.copyNotice?tr('copied'):tr('copy'));
    const version=state.latest?.version||FALLBACK_VERSION;
    const download=get('mr-bridge-download');
    if(download){download.textContent=tr('download',{v:version});download.href=state.latest?.download||`downloads/OpenReports-Bridge-v${FALLBACK_VERSION}.zip`;download.download=`OpenReports-Bridge-v${version}.zip`;}
    put('mr-bridge-version-note',`Bridge v${version} · Edge / Chrome`);
    put('mr-bridge-first-step',tr('first',{v:version}));
    const update=get('mr-bridge-update');
    const newer=present&&state.latest&&compare(state.latest.version,state.version)>0;
    const obsolete=present&&state.latest&&compare(state.version,state.latest.minCompatibleVersion)<0;
    if(update){update.hidden=!(state.check==='loading'||state.check==='error'||newer||present&&state.latest);
      update.classList.toggle('is-warning',!!newer);
      const title=state.check==='loading'?tr('checking'):state.check==='error'?tr('unknown'):newer?tr('update'):tr('upToDate');
      put('mr-bridge-update-title',title);
      put('mr-bridge-update-detail',state.check==='ok'&&present?`${tr('installed')}: v${state.version}  ·  ${tr('available')}: v${state.latest.version}${obsolete?' · '+tr('compat'):''}${newer?'\n'+tr('updateHow'):''}`:'');
    }
    const historyToggle=get('mr-bridge-history-toggle'),historyBody=get('mr-bridge-history-body');
    if(historyToggle)historyToggle.setAttribute('aria-expanded',String(state.historyExpanded));
    if(historyBody)historyBody.hidden=!state.historyExpanded;
    put('mr-bridge-history-label',tr('history'));
    const list=get('mr-bridge-history-list');if(list)appendHistory(list);
  }
  async function checkUpdates(){
    if(state.check==='loading'||Date.now()-state.lastCheck<60000)return;
    state.lastCheck=Date.now();state.check='loading';draw();
    try{
      const base=new URL('./',location.href);
      const r=await fetch(new URL('extension/openreports-bridge/latest.json',base),{cache:'no-store'});
      if(!r.ok)throw Error('HTTP '+r.status);
      const data=await r.json();if(!validRelease(data))throw Error('Invalid latest.json');
      state.latest=data;state.check='ok';draw();
      try{const hr=await fetch(new URL(data.changelog,base),{cache:'no-store'});if(hr.ok){const history=await hr.json();if(Array.isArray(history.releases))state.history=history;}}catch(_){}
    }catch(e){state.check='error';}
    draw();
  }
  function detect(){const v=document.documentElement.dataset.mrOpenreportsBridge;state.version=validVersion(v)?v:null;draw();}
  function copyUrl(){const value=browserUrl();if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>{state.copyNotice=true;draw();},()=>fallbackCopy(value));else fallbackCopy(value);}
  function fallbackCopy(value){const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();try{state.copyNotice=document.execCommand('copy');}catch(_){state.copyNotice=false;}input.remove();draw();}
  document.addEventListener('click',ev=>{
    const b=ev.target.closest('[data-bridge-browser]');if(b&&get('settings-openreports')?.contains(b)){state.browser=b.dataset.bridgeBrowser;state.copyNotice=false;draw();return;}
    if(ev.target.closest('#mr-bridge-install-toggle')){state.expanded=!state.expanded;draw();return;}
    if(ev.target.closest('#mr-bridge-history-toggle')){state.historyExpanded=!state.historyExpanded;draw();return;}
    if(ev.target.closest('#mr-bridge-copy-url'))copyUrl();
  });
  document.addEventListener('mr-openreports-bridge-ready',detect);
  window.MRI18N?.subscribe?.(draw);
  let lastPanel=null,lastIndicator=null;
  new MutationObserver(()=>{
    const panel=get('settings-openreports'),dot=get('mr-bridge-indicator-dot');
    if(panel!==lastPanel||dot!==lastIndicator){lastPanel=panel;lastIndicator=dot;draw();if(panel)checkUpdates();}
  }).observe(get('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('mrbot-view-change',()=>queueMicrotask(draw));
  detect();document.dispatchEvent(new Event('mr-openreports-bridge-query'));setTimeout(detect,600);setTimeout(detect,2500);
})();
