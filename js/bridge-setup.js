/* OpenReports Bridge: UI-only installation guide and connection indicator. */
(function () { 'use strict';
  const get = id => document.getElementById(id);
  const translations = {
    pl: { connected: 'Połączono', missing: 'Nie wykryto rozszerzenia', warning: 'PWA nie może samodzielnie zainstalować rozszerzenia. Jeśli zasady firmowe blokują instalację, skontaktuj się z IT.', copied: 'Skopiowano', copy: 'Kopiuj', latest: "Aktualna wersja", update: "Dostępna aktualizacja", installed: "Zainstalowano", available: "Dostępna", download: "Pobierz Bridge v{v}", history: "Historia wersji Bridge", checking: "Sprawdzam aktualizacje…", unknown: "Nie udało się sprawdzić aktualizacji. Zainstalowana wersja nadal działa.", first: "Archiwum instalacyjne: Bridge v{v}.", upToDate: "Wersja jest aktualna", compat: "Do użycia tej wersji Mr. Robot wymagana jest aktualizacja Bridge.", updateHow: "Aktualizując rozpakowane rozszerzenie, zastąp pliki w dotychczasowym folderze i kliknij „Przeładuj” w menedżerze rozszerzeń. Nie instaluj drugiej kopii.", noHistory: "Historia będzie dostępna po połączeniu z GitHub.", installedLabel: "Wersja zainstalowana", plainDownload: "Pobierz rozszerzenie", plainInstall: "Zainstaluj Bridge", plainUpdate: "Zaktualizuj Bridge", unverified: "Nie można sprawdzić aktualności" },
    ru: { connected: 'Подключено', missing: 'Расширение не обнаружено', warning: 'PWA не может самостоятельно устанавливать расширения. Если корпоративные правила запрещают установку, обратись в IT.', copied: 'Скопировано', copy: 'Копировать', latest: "Актуальная версия", update: "Доступно обновление", installed: "Установлено", available: "Доступна", download: "Скачать Bridge v{v}", history: "История обновлений Bridge", checking: "Проверяю обновления…", unknown: "Не удалось проверить обновления. Установленный Bridge продолжает работать.", first: "Установочный архив: Bridge v{v}.", upToDate: "Установлена последняя версия", compat: "Для совместимости с Mr. Robot необходимо обновить Bridge.", updateHow: "Для обновления замени файлы в прежней папке расширения и нажми «Обновить» на странице расширений. Не устанавливай вторую копию.", noHistory: "История появится после подключения к GitHub.", installedLabel: "Установленная версия", plainDownload: "Скачать расширение", plainInstall: "Установить Bridge", plainUpdate: "Обновить Bridge", unverified: "Не удалось проверить актуальность" },
    en: { connected: 'Connected', missing: 'Extension not detected', warning: 'A PWA cannot install extensions automatically. If corporate policy blocks installation, contact IT.', copied: 'Copied', copy: 'Copy', latest: "Up to date", update: "Update available", installed: "Installed", available: "Available", download: "Download Bridge v{v}", history: "Bridge release history", checking: "Checking for updates…", unknown: "Cannot check for updates. Your installed Bridge can still work.", first: "Installation archive: Bridge v{v}.", upToDate: "Latest version installed", compat: "A Bridge update is required for this Mr. Robot version.", updateHow: "To update, replace files in the existing extension folder and click Reload on the extensions page. Do not install a second copy.", noHistory: "Release history will appear when connected to GitHub.", installedLabel: "Installed version", plainDownload: "Download extension", plainInstall: "Install Bridge", plainUpdate: "Update Bridge", unverified: "Update status unavailable" },
    uk: { connected: 'Підключено', missing: 'Розширення не виявлено', warning: 'PWA не може автоматично встановлювати розширення. Якщо корпоративні правила забороняють встановлення, звернися до IT.', copied: 'Скопійовано', copy: 'Копіювати', latest: "Актуальна версія", update: "Доступне оновлення", installed: "Встановлено", available: "Доступна", download: "Завантажити Bridge v{v}", history: "Історія оновлень Bridge", checking: "Перевірка оновлень…", unknown: "Не вдалося перевірити оновлення. Встановлений Bridge може працювати далі.", first: "Інсталяційний архів: Bridge v{v}.", upToDate: "Встановлено найновішу версію", compat: "Для сумісності з Mr. Robot потрібно оновити Bridge.", updateHow: "Щоб оновити, заміни файли в поточній папці розширення й натисни «Оновити» на сторінці розширень. Не встановлюй другу копію.", noHistory: "Історія з’явиться після підключення до GitHub.", installedLabel: "Встановлена версія", plainDownload: "Завантажити розширення", plainInstall: "Встановити Bridge", plainUpdate: "Оновити Bridge", unverified: "Не вдалося перевірити актуальність" }
  };
  function lang() {
    const raw = String(window.MRI18N?.language || document.documentElement.lang || 'pl').toLowerCase().slice(0, 2);
    return translations[raw] ? raw : 'pl';
  }
  function detectedBrowser() {
    const ua = navigator.userAgent || '';
    if (/Edg\//i.test(ua)) return 'edge';
    if (/(?:OPR|Opera)\//i.test(ua)) return 'opera';
    if (/Vivaldi\//i.test(ua)) return 'vivaldi';
    if (/Brave\//i.test(ua)) return 'brave';
    if (/Chrome\//i.test(ua)) return 'chrome';
    return 'edge'; // Explicitly switchable fallback.
  }
  const FALLBACK_VERSION='0.3.11';
  const state = {version:null,browser:detectedBrowser(),expanded:false,guideMode:'install',historyExpanded:false,copyNotice:false,latest:null,history:null,check:'idle',lastCheck:0};
  function tr(key,vars={}){const v=translations[lang()][key]||translations.pl[key]||key;return v.replace(/\{(\w+)\}/g,(_,k)=>String(vars[k]||''));}
  function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i]?1:-1;}return 0;}
  function validVersion(v){return typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);}
  // Never allow arbitrary URLs in release metadata to become download links.
  function validRelease(info){return info&&validVersion(info.version)&&validVersion(info.minCompatibleVersion)&&
    typeof info.download==='string'&&/^downloads\/OpenReports-Bridge-v\d+\.\d+\.\d+\.zip$/.test(info.download)&&
    info.download===`downloads/OpenReports-Bridge-v${info.version}.zip`&&info.changelog==='extension/openreports-bridge/history.json';}
  const BROWSER_URLS=Object.freeze({edge:'edge://extensions',chrome:'chrome://extensions',brave:'brave://extensions',vivaldi:'vivaldi://extensions',opera:'opera://extensions'});
  function browserUrl(){return BROWSER_URLS[state.browser]||BROWSER_URLS.edge;}
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
  function newerState(){return !!(state.version&&state.latest&&state.check==='ok'&&compare(state.latest.version,state.version)>0);}
  function draw(){
    const present=!!state.version;
    const status=present?tr('connected',{v:state.version}):tr('missing');
    const displayState=!present?'disconnected':newerState()?'update':state.check==='ok'?'connected':'unverified';
    const displayLabels={
      pl:{connected:'Bridge połączony',update:'Aktualizacja Bridge',disconnected:'Bridge niepołączony',unverified:'Bridge połączony · bez weryfikacji'},
      ru:{connected:'Bridge подключён',update:'Обновление Bridge',disconnected:'Bridge не подключён',unverified:'Bridge подключён · нет проверки'},
      en:{connected:'Bridge connected',update:'Bridge update available',disconnected:'Bridge disconnected',unverified:'Bridge connected · unchecked'},
      uk:{connected:'Bridge підключено',update:'Оновлення Bridge',disconnected:'Bridge не підключено',unverified:'Bridge підключено · без перевірки'}
    };
    document.querySelectorAll('[data-mr-bridge-status]').forEach(el=>{
      const label=displayLabels[lang()][displayState];
      el.dataset.state=displayState;
      const text=el.querySelector('.mr-bridge-status-label');if(text)text.textContent=label;
      el.title=label+' · '+tr('history');
      el.setAttribute('aria-label',label+' · OpenReports Bridge');
    });
    const dot=get('mr-bridge-indicator-dot');if(dot)dot.dataset.connected=String(present);
    const trigger=get('mr-bridge-indicator');if(trigger)trigger.title='OpenReports Bridge · '+status;
    const panel=get('settings-openreports');if(!panel)return;
    const put=(id,text)=>{const el=get(id);if(el)el.textContent=text;};
    put('mr-bridge-status',status);const mainDot=get('mr-bridge-dot');if(mainDot)mainDot.dataset.connected=String(present);
    const installedRow=get('mr-bridge-installed-version');
    if(installedRow)installedRow.hidden=!present;
    put('mr-bridge-installed-label',tr('installedLabel'));
    put('mr-bridge-installed-value',present?'v'+state.version:'');
    const newer=present&&state.latest&&compare(state.latest.version,state.version)>0;
    const obsolete=present&&state.latest&&compare(state.version,state.latest.minCompatibleVersion)<0;
    const health=get('mr-bridge-version-health');
    if(health){
      const verified=present&&state.check==='ok'&&!newer;
      health.hidden=!verified;
      if(verified)health.textContent='✓ '+tr('upToDate');
    }
    put('mr-bridge-warning',tr('warning'));
    panel.querySelectorAll('[data-bridge-browser]').forEach(b=>{const active=b.dataset.bridgeBrowser===state.browser;b.setAttribute('aria-pressed',String(active));b.classList.toggle('is-selected',active);});
    panel.querySelectorAll('[data-bridge-url]').forEach(el=>{el.textContent=browserUrl();});
    panel.querySelectorAll('[data-bridge-compat-note]').forEach(el=>{el.hidden=!['brave','vivaldi','opera'].includes(state.browser);});
    panel.querySelectorAll('[data-bridge-guide]').forEach(b=>{const active=b.dataset.bridgeGuide===state.guideMode;b.classList.toggle('is-selected',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    const installSteps=get('mr-bridge-guide-install'),updateSteps=get('mr-bridge-guide-update');if(installSteps)installSteps.hidden=state.guideMode!=='install';if(updateSteps)updateSteps.hidden=state.guideMode!=='update';
    const install=get('mr-bridge-install-toggle'),installBody=get('mr-bridge-install-body');
    if(install)install.setAttribute('aria-expanded',String(state.expanded));if(installBody)installBody.hidden=!state.expanded;
    panel.querySelectorAll('[data-bridge-copy-label]').forEach(el=>{el.textContent=state.copyNotice?tr('copied'):tr('copy');});
    const version=state.latest?.version||FALLBACK_VERSION;
    const download=get('mr-bridge-download');
    if(download){download.textContent=tr(!present?'plainInstall':newer?'plainUpdate':'plainDownload');download.href=state.latest?.download||`downloads/OpenReports-Bridge-v${FALLBACK_VERSION}.zip`;download.download=`OpenReports-Bridge-v${version}.zip`;}
    const update=get('mr-bridge-update');
    if(update){
      // Show a comparison only when the installed version is outdated.
      // Do not repeat the same version twice when everything is current.
      update.hidden=!(newer||state.check==='error');
      update.classList.toggle('is-warning',!!newer);
      put('mr-bridge-update-title',newer?tr('update'):tr('unknown'));
      put('mr-bridge-update-detail',newer?`${tr('installed')}: v${state.version}  →  ${tr('available')}: v${state.latest.version}${obsolete?' · '+tr('compat'):''}\n${tr('updateHow')}`:'');
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
    const guide=ev.target.closest('[data-bridge-guide]');if(guide&&get('settings-openreports')?.contains(guide)){state.guideMode=guide.dataset.bridgeGuide;draw();return;}
    const b=ev.target.closest('[data-bridge-browser]');if(b&&get('settings-openreports')?.contains(b)){state.browser=b.dataset.bridgeBrowser;state.copyNotice=false;draw();return;}
    if(ev.target.closest('#mr-bridge-install-toggle')){state.expanded=!state.expanded;draw();return;}
    if(ev.target.closest('#mr-bridge-history-toggle')){state.historyExpanded=!state.historyExpanded;draw();return;}
    if(ev.target.closest('[data-bridge-copy]') && get('settings-openreports')?.contains(ev.target))copyUrl();
  });
  document.addEventListener('keydown',ev=>{
    const tab=ev.target.closest?.('[data-bridge-guide]');
    if(!tab||!get('settings-openreports')?.contains(tab))return;
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;
    ev.preventDefault();
    const next=ev.key==='Home'?'install':ev.key==='End'?'update':state.guideMode==='install'?'update':'install';
    state.guideMode=next;draw();get('mr-bridge-guide-tab-'+next)?.focus();
  });
  document.addEventListener('mr-openreports-bridge-ready',detect);
  window.MRI18N?.subscribe?.(draw);
  let lastPanel=null,lastIndicator=null;
  let pendingStatusRefresh=false;
  new MutationObserver(changes=>{
    const panel=get('settings-openreports'),dot=get('mr-bridge-indicator-dot');
    if(panel!==lastPanel||dot!==lastIndicator){lastPanel=panel;lastIndicator=dot;draw();if(panel)checkUpdates();return;}
    // Vue may create a new uploader after a view transition. Only refresh
    // when an actual Bridge status target was added, never on our own text update.
    if(!pendingStatusRefresh&&changes.some(c=>Array.from(c.addedNodes).some(n=>n.nodeType===1&&
      (n.matches?.('[data-mr-bridge-status]')||n.querySelector?.('[data-mr-bridge-status]'))))){
      pendingStatusRefresh=true;
      requestAnimationFrame(()=>{pendingStatusRefresh=false;draw();});
    }
  }).observe(get('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('mrbot-view-change',()=>queueMicrotask(draw));
  if(navigator.brave?.isBrave && state.browser==='chrome'){Promise.resolve().then(()=>navigator.brave.isBrave()).then(yes=>{if(yes && state.browser==='chrome'){state.browser='brave';draw();}}).catch(()=>{});}
  detect();checkUpdates();document.dispatchEvent(new Event('mr-openreports-bridge-query'));setTimeout(detect,600);setTimeout(detect,2500);
})();
