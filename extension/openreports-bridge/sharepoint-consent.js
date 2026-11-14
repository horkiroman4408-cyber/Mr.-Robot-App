/* Browser-managed optional permission; must run from a direct extension-page click. */
'use strict';
(()=>{
 const ORIGINS=['https://lppsa-my.sharepoint.com/*'];
 const text={pl:['SharePoint · Uprawnienia','Zezwól Mr. Robot Bridge na odczyt pliku Excel z SharePoint firmy LPP. Zgoda jest obsługiwana przez Edge i pozostaje ważna, dopóki nie zostanie cofnięta.','Zezwól na SharePoint','Zgoda została zapisana. Możesz wrócić do Obsada.','Nie udzielono dostępu. Spróbuj ponownie.','Tylko lppsa-my.sharepoint.com · Bez automatycznych pobrań'],ru:['SharePoint · Разрешение','Разреши Bridge читать Excel из корпоративного SharePoint. Разрешение выдаётся Edge один раз и действует, пока его не отзовёшь.','Разрешить SharePoint','Доступ разрешён. Вернись в Obsada.','Доступ не разрешён. Попробуй ещё раз.','Только lppsa-my.sharepoint.com · Без автообновления'],en:['SharePoint · Permission','Allow Bridge to read Excel from your company SharePoint. Edge handles this permission and remembers it until revoked.','Allow SharePoint','Permission saved. Return to Obsada.','Permission denied. Try again.','Only lppsa-my.sharepoint.com · No scheduled downloads'],uk:['SharePoint · Дозвіл','Дозволь Bridge читати Excel із корпоративного SharePoint. Дозвіл видає Edge і зберігає, доки його не відкличуть.','Дозволити SharePoint','Дозвіл збережено. Поверніться до Obsada.','Доступ не надано. Спробуйте ще раз.','Лише lppsa-my.sharepoint.com · Без автоматичних завантажень']};
 const lang=(navigator.language||'pl').slice(0,2).toLowerCase();const t=text[lang]||text.pl;
 for(const [id,i] of [['heading',0],['description',1],['allow',2],['note',5]])document.getElementById(id).textContent=t[i];
 const button=document.getElementById('allow'),status=document.getElementById('status');
 const success=()=>{status.textContent=t[3];button.disabled=true;setTimeout(()=>window.close(),1000);};
 chrome.permissions.contains({origins:ORIGINS}).then(granted=>{if(granted)success();}).catch(()=>{});
 button.addEventListener('click',()=>{
  // Start request synchronously from the actual user gesture, not from an await/effect.
  const request=chrome.permissions.request({origins:ORIGINS});button.disabled=true;
  request.then(granted=>{if(granted)success();else{button.disabled=false;status.textContent=t[4];}})
    .catch(()=>{button.disabled=false;status.textContent=t[4];});
 });
})();
