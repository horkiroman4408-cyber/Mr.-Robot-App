/* Mr. Robot 3.23.0 · STOCK Intelligence: read-only analysis of recorded closure events. */
(function(root){
'use strict';
const labels={
 title:['Analiza zamkniętych lokalizacji','Анализ закрытых локаций','Closed-location analysis','Аналіз закритих локацій'],
 summary:['Przegląd zamknięć','Обзор закрытий','Closure overview','Огляд закриттів'],resetPrefs:['Przywróć domyślne ustawienia','Сбросить настройки','Reset preferences','Скинути налаштування'],repeats:['Powtórzenia','Повторы','Repeats','Повтори'],
 scope:['Zakres analizy','Период анализа','Analysis scope','Період аналізу'],allFile:['Cały plik','Весь файл','Entire file','Увесь файл'],periods:['Wybrane godziny STOCK','Выбранные часы STOCK','Selected STOCK hours','Вибрані години STOCK'],
 noPeriods:['Wybierz godziny w module STOCK, aby przeanalizować ten zakres.','Выбери часы в STOCK, чтобы анализировать этот период.','Select hours in STOCK first to analyze that period.','Спочатку обери години в STOCK для аналізу цього періоду.'],
 mpArea:['Obszar lokalizacji','Область локаций','Location area','Зона локацій'],other:['Pozostałe','Остальные','Other','Інші'],all:['Wszystkie MP','Все MP','All MP','Усі MP'],
 excludeP:['Wyklucz loginy PKECOM','Исключить PKECOM','Exclude PKECOM logins','Виключити PKECOM'],excludeS:['Wyklucz loginy zaczynające się od S','Исключить логины на S','Exclude logins starting with S','Виключити логіни на S'],
 original:['Wiersze w wybranym zakresie','Строк в выбранном периоде','Rows in chosen scope','Рядки в обраному періоді'],events:['Zdarzenia zamknięcia','События закрытия','Closure events','Події закриття'],unique:['Unikatowe lokalizacje','Уникальные локации','Unique locations','Унікальні локації'],
 excluded:['Wykluczone wiersze','Исключённые строки','Excluded rows','Виключені рядки'],excludedP:['Z loginem PKECOM','С логином PKECOM','With PKECOM login','З логіном PKECOM'],excludedS:['Z loginem S','С логином S','With S login','З логіном S'],both:['Spełnia oba warunki','Подходит под оба условия','Matches both rules','Відповідає обом умовам'],
 breakdown:['Zamknięcia według MP','Закрытия по MP','Closures by MP','Закриття за MP'],noRows:['Brak danych dla tych filtrów.','Нет данных для выбранных фильтров.','No data matches these filters.','Немає даних для цих фільтрів.'],
 locations:['Lokalizacje','Локации','Locations','Локації'],repeatPlaces:['Lokalizacje zamknięte wielokrotnie','Локации с повторными закрытиями','Repeatedly closed locations','Локації з повторними закриттями'],repeatExtra:['Dodatkowe zdarzenia ponad pierwsze','Повторные события сверх первого','Events after first closure','Події після першого закриття'],
 sameEan:['Ten sam EAN','Один EAN','Same EAN','Той самий EAN'],differentEan:['Różne EAN','Разные EAN','Different EANs','Різні EAN'],
 find:['Szukaj lokalizacji lub EAN…','Поиск локации или EAN…','Search location or EAN…','Пошук локації або EAN…'],times:['Zamknięcia','Закрытия','Closures','Закриття'],operators:['Operatorzy','Операторы','Operators','Оператори'],history:['Historia zdarzeń','История событий','Event history','Історія подій'],time:['Data i czas','Дата и время','Date and time','Дата й час'],item:['Produkt','Товар','Product','Товар'],quantity:['QUANTITY','QUANTITY','QUANTITY','QUANTITY'],
 note:['Zdarzenie zamknięcia nie jest potwierdzeniem błędu. QUANTITY pochodzi z raportu i nie oznacza wyniku audytu fizycznego.','Закрытие не доказывает ошибку. QUANTITY взято из отчёта, а не из физического аудита.','A closure event does not prove an error. QUANTITY is from the source report, not a physical audit result.','Закриття не доводить помилку. QUANTITY взято зі звіту, а не з фізичного аудиту.'],
 based:['Analiza tylko do odczytu; nie zmienia listy STOCK, wyboru godzin ani eksportu.','Анализ только для просмотра; не меняет список STOCK, выбранные часы и экспорт.','Read-only analysis; STOCK lists, selected periods and exports remain unchanged.','Аналіз лише для перегляду; список STOCK, години та експорт без змін.'],
 source:['Plik źródłowy','Исходный файл','Source file','Вихідний файл'],found:['Wyświetlono','Показано','Showing','Показано'],allExcluded:['Bez wykluczeń','Без исключений','No exclusions','Без виключень']
};
function t(lang,key){const i={pl:0,ru:1,en:2,uk:3}[lang]??0;return(labels[key]||[key])[i]||key;}
const area=loc=>{const m=/^MP([123])/i.exec(String(loc||'').trim());return m?'MP'+m[1]:'OTHER';};
const key=r=>String(r.loc||'').trim().toUpperCase();
const normalized=r=>({loc:String(r.loc||'').trim(),ean:String(r.ean||'').trim(),who:String(r.who||'').trim(),item:String(r.item||'').trim(),qty:r.qty,date:String(r.date||''),hour:String(r.hour||''),time:String(r.time||'').trim(),lack:r.lack,deficiency:r.deficiency,komnam:r.komnam});
function analyze(rows,options){
 const opts=options||{},periods=opts.periods instanceof Set?opts.periods:new Set(opts.periods||[]);
 const inScope=(rows||[]).filter(r=>(opts.scope!=='selected'||periods.has(String(r.date||'')+' '+String(r.hour||'')))&&(!opts.mp||opts.mp==='ALL'||area(r.loc)===opts.mp));
 let p=0,s=0,both=0,removed=0;const filtered=[];
 for(const r of inScope){const login=String(r.who||'').trim().toUpperCase();const isP=login.startsWith('PKECOM');const isS=login.startsWith('S');if(isP)p++;if(isS)s++;if(isP&&isS)both++;
  if((opts.excludeP&&isP)||(opts.excludeS&&isS)){removed++;continue;} filtered.push(r);
 }
 const groups=new Map(['MP1','MP2','MP3','OTHER'].map(mp=>[mp,{mp,events:0,places:new Set()}]));
 const map=new Map();let events=0;
 for(const raw of filtered){const r=normalized(raw),loc=key(r);if(!loc)continue;const mp=area(loc);
  events++;const g=groups.get(mp);g.events++;g.places.add(loc);
  if(!map.has(loc))map.set(loc,{loc,mp,events:[],eans:new Set(),operators:new Set()});
  const box=map.get(loc);box.events.push(r);if(r.ean)box.eans.add(r.ean);if(r.who)box.operators.add(r.who);
 }
 const repeats=[];for(const g of map.values()){if(g.events.length<2)continue;g.events.sort((a,b)=>a.time.localeCompare(b.time)||a.date.localeCompare(b.date)||a.hour.localeCompare(b.hour));repeats.push({loc:g.loc,mp:g.mp,count:g.events.length,eanCount:g.eans.size,operators:g.operators.size,events:g.events});}
 repeats.sort((a,b)=>b.count-a.count||a.loc.localeCompare(b.loc));
 return {sourceRows:inScope.length,excluded:removed,excludedP:p,excludedS:s,excludedBoth:both,events,unique:map.size,byMp:[...groups.values()].map(g=>({mp:g.mp,events:g.events,unique:g.places.size})),repeats,repeatPlaces:repeats.length,repeatExtra:repeats.reduce((n,g)=>n+g.count-1,0)};
}
root.MRStockIntelligence=Object.freeze({t,analyze});
})(window);
