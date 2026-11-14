/* Browser-managed optional permission; must run from a direct extension-page click. */
'use strict';
(()=>{
 const ORIGINS=['https://lppsa-my.sharepoint.com/*','https://*.officeapps.live.com/*','https://*.office.com/*','https://*.office.net/*'];
 const text={pl:['SharePoint · Uprawnienia','Zezwól Mr. Robot Bridge na dostęp do SharePoint i osadzonego Excel Online. Zgoda jest obsługiwana przez Edge i pozostaje ważna, dopóki nie zostanie cofnięta.','Zezwól na SharePoint','Zgoda została zapisana. Możesz wrócić do Obsada.','Nie udzielono dostępu. Spróbuj ponownie.','SharePoint i Excel Online · Bez automatycznych pobrań'],ru:['SharePoint · Разрешение','Разреши Bridge доступ к SharePoint и встроенному Excel Online. Разрешение выдаётся Edge один раз и действует, пока его не отзовёшь.','Разрешить SharePoint','Доступ разрешён. Вернись в Obsada.','Доступ не разрешён. Попробуй ещё раз.','SharePoint и Excel Online · Без автообновления'],en:['SharePoint · Permission','Allow Bridge to access company SharePoint and embedded Excel Online. Edge handles this permission and remembers it until revoked.','Allow SharePoint','Permission saved. Return to Obsada.','Permission denied. Try again.','SharePoint and Excel Online · No scheduled downloads'],uk:['SharePoint · Дозвіл','Дозволь Bridge доступ до SharePoint і вбудованого Excel Online. Дозвіл видає Edge і зберігає, доки його не відкличуть.','Дозволити SharePoint','Дозвіл збережено. Поверніться до Obsada.','Доступ не надано. Спробуйте ще раз.','SharePoint і Excel Online · Без автоматичних завантажень']};
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
