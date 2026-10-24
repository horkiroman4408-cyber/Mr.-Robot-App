/* MR. BOT Intelligence · on-demand provenance, never changes business calculations. */
(function (root) {
  'use strict';
  const strings = {
    'subtitle':['Skąd pochodzi ten wynik?','Откуда взялся этот результат?','Where does this result come from?','Звідки взявся цей результат?'],
    'source':['Plik źródłowy','Исходный файл','Source file','Вихідний файл'],
    'sheet':['Arkusz','Лист Excel','Excel sheet','Аркуш Excel'],
    'row':['Wiersz Excela','Строка Excel','Excel row','Рядок Excel'],
    'rows':['Wiersze źródłowe','Исходные строки','Source rows','Вихідні рядки'],
    'filters':['Zastosowane filtry','Применённые фильтры','Applied filters','Застосовані фільтри'],
    'algorithm':['Jak powstał wynik','Как получен результат','How the result was obtained','Як отримано результат'],
    'matched':['Zgodne z raportem','Совпадает с отчётом','Matches the report','Збігається зі звітом'],
    'mismatch':['Wykryto rozbieżność','Обнаружено расхождение','Discrepancy detected','Виявлено розбіжність'],
    'included':['Uwzględniono','Учтено','Included','Враховано'],
    'excluded':['Pominięto','Исключено','Excluded','Виключено'],
    'all':['Wszystkie wiersze','Все строки','All rows','Усі рядки'],
    'onlyIncluded':['Tylko uwzględnione','Только учтённые','Included only','Лише враховані'],
    'onlyExcluded':['Tylko pominięte','Только исключённые','Excluded only','Лише виключені'],
    'previous':['Poprzednie','Назад','Previous','Назад'],
    'next':['Następne','Далее','Next','Далі'],
    'close':['Zamknij','Закрыть','Close','Закрити'],
    'reason':['Decyzja','Причина','Decision','Причина'],
    'qty':['Ilość','Количество','Quantity','Кількість'],
    'duplicate':['Powtórzony Shelf bin','Повтор Shelf bin','Duplicate Shelf bin','Повтор Shelf bin'],
    'unique':['Unikatowa przegroda','Уникальная ячейка','Unique shelf bin','Унікальна комірка'],
    'positive':['Dodatnia ilość i podana przyczyna','Положительное количество и указана причина','Positive quantity with reason','Додатна кількість та вказана причина'],
    'zero':['Ilość nie jest dodatnia','Количество не положительное','Quantity not positive','Кількість не додатна'],
    'empty':['Brak Exception reason','Не заполнена Exception reason','Missing Exception reason','Не заповнено Exception reason'],
    'group':['Grupa','Группа','Group','Група'],
    'operator':['Operator','Оператор','Operator','Оператор'],
    'selected':['zgodnie z wyborem','по выбранным значениям','as selected','за вибраними значеннями'],
    'retBinsRule':['Zliczane są unikatowe Shelf bin z dodatnim Stocktake qty. Powtórzenia liczą się raz.','Учитываются уникальные Shelf bin со Stocktake qty больше нуля. Повторы считаются один раз.','Count unique Shelf bin values where Stocktake qty is positive. Duplicates count once.','Враховуються унікальні Shelf bin зі Stocktake qty більше нуля. Повтори рахуються один раз.'],
    'retPiecesRule':['Sumowane są dodatnie Stocktake qty z wierszy z uzupełnionym Exception reason; duplikaty pozostają w sumie.','Суммируются положительные Stocktake qty строк с заполненной Exception reason; дубликаты не удаляются.','Sum positive Stocktake qty where Exception reason is filled in; duplicates remain in the sum.','Підсумовуються додатні Stocktake qty рядків із заповненою Exception reason; дублікати залишаються.'],
    'nvRule':['Items per hour jest odczytywane bezpośrednio z raportu Excel, a następnie porównywane z aktualnym progiem. Nie przeliczamy go z zaokrąglonego czasu.','Items per hour берётся непосредственно из Excel и сравнивается с текущей нормой. Мы не пересчитываем его по округлённому времени.','Items per hour comes directly from Excel and is compared with the current threshold. It is not recalculated from rounded time.','Items per hour береться безпосередньо з Excel і порівнюється з поточною нормою. Воно не перераховується з округленого часу.'],
    'norm':['Próg normy','Норма','Threshold','Норма'],
    'difference':['Różnica','Отклонение','Difference','Відхилення'],
    'status':['Status','Статус','Status','Статус'],
    'below':['Poniżej normy','Ниже нормы','Below threshold','Нижче норми'],
    'above':['W normie','В норме','Meets threshold','У нормі'],
    'itemCount':['Number of items','Количество единиц','Number of items','Кількість одиниць'],
    'totalTime':['Total time [h]','Время [ч]','Total time [h]','Час [год]'],
    'perHour':['Items per hour','Единиц в час','Items per hour','Одиниць на годину'],
    'readDirectly':['Wartość odczytana z Excela','Значение прочитано из Excel','Value read from Excel','Значення прочитано з Excel'],
    'currentFilters':['Uwzględniono bieżące filtry tabeli.','Учитываются текущие фильтры таблицы.','The current table filters were applied.','Враховано поточні фільтри таблиці.'],
    'firstSheet':['Pierwszy arkusz pliku','Первый лист файла','First sheet of the file','Перший аркуш файлу'],
    'allGroups':['AUDYT RET · wybrani operatorzy','AUDYT RET · выбранные операторы','AUDYT RET · selected operators','AUDYT RET · вибрані оператори'],
    'sourceNotTracked':['Numer źródłowego wiersza niedostępny w tym rekordzie','Номер исходной строки не сохранился в этой записи','Source row number unavailable for this record','Номер вихідного рядка недоступний'],
    'showingLimit':['Podgląd ograniczony do pierwszych 2000 wierszy; wynik liczony ze wszystkich.','Показаны первые 2000 строк; итог рассчитан по всем строкам.','Showing the first 2000 rows; result uses all rows.','Показано перші 2000 рядків; результат враховує всі.'],
    'noRows':['Brak pasujących wierszy','Нет подходящих строк','No matching rows','Немає відповідних рядків'],
    'explained':['Weryfikacja','Проверка','Verification','Перевірка'],
    'calculated':['Obliczenie na danych źródłowych','Расчёт по исходным данным','Calculated from source records','Розраховано за вихідними даними'],
    'reported':['Wartość widoczna w raporcie','Значение в отчёте','Value displayed in report','Значення у звіті'],
    'noChange':['Dane źródłowe nie zostały zmienione.','Исходные данные не изменены.','Source data has not been changed.','Вихідні дані не змінені.'],
    'open':['Wyjaśnij wynik','Объяснить результат','Explain result','Пояснити результат'],
    'process':['Rodzaj','Тип процесса','Process','Тип процесу'],
    'shift':['Zmiana','Смена','Shift','Зміна'],
    'agency':['Agencja','Агентство','Agency','Агенція'],
    'unit':['szt./h','ед./ч','items/h','од./год']
  };
  const languageIdx={pl:0,ru:1,en:2,uk:3};
  function t(language,key){const group=strings[key];return group?group[languageIdx[language]??0]:key;}
  const compact=(v)=>Number(v).toLocaleString('pl-PL',{maximumFractionDigits:12});
  function buildRet(records,selectedOperators,hasOp,metric,expected){
    const bins=new Set();let computed=0,included=0,excluded=0,selected=0;const rows=[];
    for(const r of records){
      if(String(r.key2||'').toUpperCase()!=='AUDYT RET')continue;
      if(hasOp&&!selectedOperators[r.op])continue;
      selected++;
      const qty=Number(r.qty)||0;
      let ok=false,reason='';
      if(metric==='bins'){
        if(qty<=0)reason='zero';
        else if(bins.has(r.shelf))reason='duplicate';
        else {bins.add(r.shelf);ok=true;reason='unique';computed++;}
      }else{
        if(!String(r.reason||'').trim())reason='empty';
        else if(qty<=0)reason='zero';
        else {ok=true;reason='positive';computed+=qty;}
      }
      ok?included++:excluded++;
      if(rows.length<2000)rows.push({excelRow:r.excelRow||null,shelf:r.shelf,qty,reasonText:r.reason||'',operator:r.op||'',ok,reason});
    }
    return {type:'ret',module:'rs',metric,title:metric==='bins'?'PRZEGRÓDKI PRZELICZONE':'POMIESZANYCH SZT.',expected,computed,matched:computed===expected,included,excluded,selected,rows,truncated:selected>rows.length};
  }
  function buildNv(record,norm){
    const threshold=Number(norm)||0;
    const source=Number(record.perHour);
    return {type:'nv',module:'kpi',title:'ITEMS PER HOUR',login:record.login,rodzaj:record.rodzaj,excelRow:record.excelRow||null,items:record.items,time:record.time,perHour:source,norm:threshold,delta:source-threshold,below:source<threshold,matched:Number.isFinite(source)};
  }
  root.MRIntelligence={t,compact,buildRet,buildNv};
})(window);
