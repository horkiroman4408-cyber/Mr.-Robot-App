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
    'unit':['szt./h','ед./ч','items/h','од./год'],
    'geekAll':["Wybrane grupy audytów", "Выбранные группы аудитов", "Selected audit groups", "Вибрані групи аудитів"],
    'geekAllRule':["Tabela 1: wynik jest liczony dla aktualnie wybranych grup i operatorów. Kategorie pochodzą z Exception reason, błędy z Exception = YES, poprawne z NO.", "Таблица 1: результат рассчитывается по выбранным аудитам и операторам. Категории берутся из Exception reason, ошибки из Exception = YES, правильные строки из NO.", "Table 1 uses currently selected groups and operators. Categories come from Exception reason, errors from Exception = YES, correct rows from NO.", "Таблиця 1 враховує вибрані аудити й операторів. Категорії беруться з Exception reason, помилки з Exception = YES, правильні рядки з NO."],
    'geekRetRule':["Tabela 2 · RET: wartość wynika z unikatowych TOT / Shelf bin lub z kategorii błędu na podstawie Exception reason. Dla powtarzających się lokalizacji pierwszeństwo mają pomieszane artykuły.", "Таблица 2 · RET: значение определяется уникальными TOT / Shelf bin или категорией ошибки из Exception reason. При повторении локаций приоритет у смешанных товаров.", "Table 2 · RET: the result counts unique totes/shelf bins or error categories derived from Exception reason. Repeated locations take precedence as mixed articles.", "Таблиця 2 · RET: результат визначається унікальними TOT / Shelf bin чи категорією Exception reason. Повторювані локації мають пріоритет як змішані товари."],
    'geekPercentage':["Procent = liczba błędnych / liczba przeliczonych × 100; pokazano zaokrąglenie do 2 miejsc.", "Процент = количество ошибочных / количество пересчитанных × 100, округление до двух знаков.", "Percentage = incorrect / counted × 100, displayed to two decimal places.", "Відсоток = помилкові / перераховані × 100; округлено до двох знаків."],
    'geekConstant':["W obecnej wersji raportu ta pozycja ma stałą wartość 0; nie jest wyprowadzana z wierszy Excel.", "В текущей версии отчёта показатель равен константе 0 и не вычисляется из строк Excel.", "In this version of the report this metric is fixed at 0; it is not derived from Excel rows.", "У цій версії звіту показник має сталу величину 0 та не обчислюється з рядків Excel."],
    'counted':["Wiersz uwzględniony", "Строка учтена", "Row counted", "Рядок враховано"],
    'notRelevant':["Nie spełnia kryterium wskaźnika", "Не соответствует условию показателя", "Does not match metric condition", "Не відповідає умові показника"],
    'firstUnique':["Pierwsza unikatowa wartość", "Первое уникальное значение", "First unique value", "Перше унікальне значення"],
    'duplicateValue':["Powtórzona wartość (liczona tylko raz)", "Повтор значения (учитывается один раз)", "Duplicate value (counted once)", "Повтор значення (лише один раз)"],
    'ratio':["Wiersz uczestniczy w obliczeniu udziału", "Строка входит в расчёт доли", "Row contributes to ratio", "Рядок бере участь в обчисленні частки"],
    'retMixed':["Wiele wierszy w tej samej lokalizacji", "Несколько строк в одной локации", "Multiple rows at the same location", "Кілька рядків в одній локації"],
    'retPriority':["Lokalizacja mieszana: wyłączono z innych kategorii", "Смешанная локация: исключена из других категорий", "Mixed location: excluded from other categories", "Змішана локація: виключено з інших категорій"],
    'noCalculation':["Brak źródłowych rekordów dla stałej wartości", "Для константы нет исходных строк", "No source rows for fixed value", "Немає вихідних рядків для сталої величини"],
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
  // v3.8.1 · Source-based explanations only. Business report calculations stay unchanged.
  function buildGeek(records, selectedGroups, selectedOperators, hasOp, title, expected, scope){
    const ret=scope==='ret';
    const selected=records.filter(r=>ret?String(r.key2||'').toUpperCase()==='AUDYT RET':!!selectedGroups[r.key2]).filter(r=>!hasOp||!!selectedOperators[r.op]);
    const pct=String(title).includes('ODSETEK')||title==='Odsetek błędnych';
    const constant=title==='TOTY Z ART. BEZ METKI'||title==='BRAK METKI SZT.';
    const tote=r=>String(r.shelf||'').slice(0,10);
    const location=r=>String(r.shelf||'').length>2?String(r.shelf).slice(0,-2):String(r.shelf||'');
    const errors=selected.filter(r=>String(r.reason||'').trim());
    const byLocation=new Map();
    errors.forEach(r=>{const k=location(r);if(!byLocation.has(k))byLocation.set(k,[]);byLocation.get(k).push(r);});
    const mixedLocations=new Set([...byLocation].filter(([k,v])=>v.length>=2).map(([k])=>k));
    const seen=new Set(),rows=[];
    let computed=0,included=0,excluded=0,denominator=0;
    const categoryPairs={
      'TOTY Z NADWE':['surplus','totes'],'NADWE SZT.':['surplus','pieces'],
      'TOTY Z BRAKIEM':['Shortage','totes'],'BRAK SZT.':['Shortage','pieces'],
      'TOTY PRZEPEŁNIONE':['Extra sku','totes'],'PRZEPEŁNIONE SZT.':['Extra sku','pieces'],
      'TOTY Z WADĄ':['Major damage','totes'],'WADA SZT.':['Major damage','pieces']
    };
    for(const r of selected){
      let ok=false,contribution=0,reason='notRelevant',key='';
      const qty=Number(r.qty)||0, exc=String(r.exc||''), hasReason=!!String(r.reason||'').trim();
      if(!constant && ret){
        if(title==='TOTY PRZELICZONE'||title==='TOTY POPRAWNE'||title==='SUMA NIEPOPRAWNYCH TOTÓW'||title==='ODSETEK BŁĘDÓW'){
          const isError=exc==='YES';
          key=tote(r);
          if(title==='TOTY POPRAWNE'){ // Correct totes = all unique totes minus unique bad totes.
            const badTotes=new Set(selected.filter(x=>x.exc==='YES').map(tote));
            ok=!badTotes.has(key)&&!seen.has(key);
          }else if(title==='SUMA NIEPOPRAWNYCH TOTÓW'||title==='ODSETEK BŁĘDÓW')ok=isError&&!seen.has(key);
          else ok=!seen.has(key);
          if(ok){seen.add(key);contribution=1;reason='firstUnique';}
          else reason=seen.has(key)?'duplicateValue':'notRelevant';
        }else if(title==='PRZEGRÓDKI PRZELICZONE'||title==='PRZEGRÓDKI NIE POPRAWNE'){
          key=r.shelf;ok=(title==='PRZEGRÓDKI PRZELICZONE'?qty>0:exc==='YES')&&!seen.has(key);
          if(ok){seen.add(key);contribution=1;reason='firstUnique';}
          else reason=seen.has(key)?'duplicateValue':'notRelevant';
        }else if(title==='SZTUKI PRZELICZONE'){ok=true;contribution=qty;reason='counted';}
        else if(title==='TOTY Z POMESZANYMI ART. W PRZEGRÓDKACH'){
          key=location(r);ok=mixedLocations.has(key)&&!seen.has(key);
          if(ok){seen.add(key);contribution=1;reason='retMixed';}
          else reason=mixedLocations.has(key)?'duplicateValue':'notRelevant';
        }else if(title==='POMIESZANYCH SZT.'){
          ok=hasReason&&qty>0;contribution=ok?qty:0;reason=ok?'positive':hasReason?'zero':'empty';
        }else if(categoryPairs[title]){
          const [cat,kind]=categoryPairs[title];
          const loc=location(r);ok=hasReason&&!mixedLocations.has(loc)&&r.cat===cat;
          contribution=ok?(kind==='totes'?1:Math.max(0,Number(r.n)||0)):0;
          reason=ok?'counted':mixedLocations.has(loc)?'retPriority':'notRelevant';
        }
      }else if(!constant){
        const nonret={
          'Toty poprawne':()=>exc==='NO','Toty z brakami':()=>r.cat==='Shortage',
          'Toty z nadwyżkami':()=>r.cat==='surplus','Toty przepełnione':()=>r.cat==='Extra sku',
          'Toty z wadą':()=>r.cat==='Major damage','Total toty przeliczone':()=>true,
          'Total toty błędne':()=>exc==='YES','Odsetek błędnych':()=>exc==='YES',
          'Sztuk przeliczone':()=>true
        };
        ok=!!nonret[title]?.();contribution=ok?(title==='Sztuk przeliczone'?qty:1):0;
        reason=ok?'counted':'notRelevant';
      }
      if(ok)included++;else excluded++;
      computed+=contribution;
      if(rows.length<2000&&!constant)rows.push({excelRow:r.excelRow||null,shelf:r.shelf,qty,reasonText:r.reason||'',operator:r.op||'',ok,reason});
    }
    if(pct){
      if(ret)denominator=new Set(selected.map(tote)).size;
      else denominator=selected.length;
      computed=denominator?computed/denominator*100:0;
    }
    // Existing values are formatted with comma decimal separators in the UI.
    const expectedNum=typeof expected==='number'?expected:Number(String(expected).replace(/\s/g,'').replace('%','').replace(',','.'));
    const matched=Number.isFinite(expectedNum)&&(pct?computed.toFixed(2)===expectedNum.toFixed(2):Math.abs(computed-expectedNum)<1e-8);
    const display=v=>pct?v.toFixed(2).replace('.',',')+'%':compact(v);
    return {type:'ret',module:'rs',metric:title,title,groupLabel:ret?'AUDYT RET':'Tabela 1',
      ruleKey:constant?'geekConstant':pct?'geekPercentage':ret?'geekRetRule':'geekAllRule',
      expected,computed,displayExpected:typeof expected==='string'?expected:display(expectedNum),displayComputed:display(computed),
      matched,included:constant?0:included,excluded:constant?0:excluded,selected:selected.length,
      rows,truncated:!constant&&selected.length>rows.length,constant};
  }
  root.MRIntelligence={t,compact,buildRet,buildNv,buildGeek};
})(window);
