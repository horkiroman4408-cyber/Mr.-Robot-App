'use strict';
/* Local, dependency-free UI translations for the optional OpenReports Bridge.
   File names and report data are never translated. */
(function (root) {
  const DICT = {
    pl: {
      mpArea:"Typ lokalizacji MP",
      mpBrand:"Marka",
      mpAllBrands:"Wszystkie marki",
      mpHint:"Baza MP: wybierz typ lokalizacji MP i markę. Data Source: WMS ECM REPL PODKARPACIE.",
      mpInvalid:"Nieprawidłowy typ lokalizacji MP lub marka.",
      mpOpenModule:"Otwórz MP → Scalanie/Konsolidacja lub RS → Baza MP, aby wczytać raport.",
      trigger:'↓ OpenReports',triggerTitle:'Pobierz {report} i wczytaj do {module}',close:'Zamknij',
      choosePeriod:'Raport do {module}. Wybierz daty i godziny z sekundami.',
      mdtHint:' Pola EAN i Location pozostaną puste.',stockDate:'Data raportu',stockHint:'Raport STOCK. Wybierz jeden dzień. Data Source: WMS ECM PODKARPACIE Prod.',
      dateFrom:'Data od',timeFrom:'Godzina od',dateTo:'Data do',timeTo:'Godzina do',
      timeFromFull:'Godzina od (HH:MM:SS)',timeToFull:'Godzina do (HH:MM:SS)',
      dayPart:'Dzień',monthPart:'Miesiąc',yearPart:'Rok',hourPart:'Godzina (00–23)',minutePart:'Minuty (00–59)',secondPart:'Sekundy (00–59)',
      activeJob:'Inny raport jest aktywny ({module}). Możesz poczekać lub anulować poprzedni raport.',
      start:'↓ Pobierz z OpenReports',startPopup:'Pobierz z OpenReports',cancel:'Anuluj',
      autoImport:'Automatyczny import lokalnego XLSX',noFolder:'Nie wybrano folderu raportów.',
      folderUnset:'Folder nie został wybrany. Wybierz {folder}',folderWrong:'Wybrano nieprawidłowy folder. Wskaż {folder}',
      folderGranted:'odczyt dozwolony',folderExpired:'wymaga ponownej zgody',
      pickFolder:'📁 Wybierz folder',importLast:'Wczytaj ostatni pasujący XLSX',
      help:'Pliki zapisujemy w <b>Downloads/MrRobot/OpenReports</b>. Jednorazowo wybierz folder <b>OpenReports</b> w katalogu Downloads/MrRobot. Automatyczny import używa dokładnej nazwy zakończonego pobierania; ręczny wybór wybiera tylko najnowszy plik odpowiedniego raportu. Hasła i pliki nie są wysyłane na zewnętrzny serwer.',
      reportModule:'Raport / moduł',popupNote:'Bridge otworzy OpenReports, jeśli nie ma karty. Jeśli pojawi się logowanie, zaloguj się samodzielnie. Bridge przechodzi: Reports → ECM_Warehouse → wybrany raport. Wybierz daty i godziny z sekundami. Dla GODZINY_MDT: Data Source WMS ECM REPL PODKARPACIE, EAN i Location pozostają puste. Dla STOCK wybierz tylko dzień i Data Source WMS ECM PODKARPACIE Prod. Pliki zapisujemy w Downloads/MrRobot/OpenReports.',
      ready:'Gotowy.',readyPopup:'Gotowy do pobrania.',badTime:'Podaj daty i godziny wraz z sekundami.',badPeriod:'Data od musi być wcześniejsza niż data do.',
      launching:'Uruchamiam OpenReports…',started:'Raport uruchomiony w OpenReports. Czekam na XLSX…',
      syncError:'Błąd synchronizacji: {reason}',folderProblem:'Problem dostępu do folderu: {reason}',
      pickerUnavailable:'Przeglądarka nie udostępnia wyboru folderu. Użyj ręcznego importu Excel.',
      pickerWrong:'Wskaż folder OpenReports wewnątrz Downloads/MrRobot (nie sam folder Downloads).',
      pickerError:'Nie udało się wybrać folderu: {reason}',folderLinked:'Folder powiązany. Możesz wczytać pobrany plik.',
      noPermission:'Brak zgody na odczyt folderu.',chooseFolder:'Wybierz folder {folder}.',
      staleFolder:'Dostęp do folderu wygasł. Kliknij „Wczytaj ostatni pasujący XLSX”, aby potwierdzić dostęp.',
      noMatch:'Brak plików {report}*.xlsx w folderze OpenReports.',
      openModule:'Otwórz MP → AUDYT → {module} w Mr. Robot i spróbuj ponownie.',
      waitImport:'Poczekaj, aż zakończy się poprzedni import Excel.',
      noRecent:'Brak zakończonego pobierania {report} do {folder}.',
      fileNotFound:'Nie znaleziono {name} w wybranym folderze. Wybierz {folder}.',
      badFile:'Nieprawidłowy plik XLSX lub przekroczony limit 160 MB.',
      badZip:'Plik nie wygląda na arkusz XLSX (ZIP).',
      imported:'Plik {name} przekazany do {module}. Sprawdź wynik importu w Mr. Robot.',
      folderForImport:'Raport pobrany do {folder}. Kliknij „Wybierz folder” i wskaż folder OpenReports, aby automatycznie wczytać plik.',
      outsideFolder:'Raport został zapisany poza {folder}. Sprawdź opcję „Pytaj, gdzie zapisać pliki” w Edge. Możesz wskazać folder z plikiem i wczytać go ręcznie.',
      connectionError:'Błąd połączenia z rozszerzeniem',browserOpen:'Most otworzy OpenReports, jeśli karta jest zamknięta. W razie potrzeby zaloguj się samodzielnie; pobieranie wznowi się po zalogowaniu.',
      serverPreparing:'OpenReports przygotowuje raport. Czekam na rozpoczęcie pobierania XLSX…',
      downloading:'Pobieranie XLSX… {progress}',openReports:'Łączę się z kartą OpenReports…',
      looking:'Szukam raportu…',processing:'Przetwarzanie…',
      downloaded:'Excel pobrany do Downloads/MrRobot/OpenReports. Import do Mr. Robot…',
      cancelled:'Anulowano.',failed:'Nie udało się pobrać raportu.',
      otherError:'Błąd OpenReports: {reason}'
    },
    ru: {
      mpArea:"Тип локализации MP",
      mpBrand:"Бренд",
      mpAllBrands:"Все бренды",
      mpHint:"Baza MP: выбери тип локализации MP и бренд. Источник данных: WMS ECM REPL PODKARPACIE.",
      mpInvalid:"Недопустимая локализация MP или бренд.",
      mpOpenModule:"Открой MP → Scalanie/Konsolidacja или RS → Baza MP, чтобы загрузить отчёт.",
      trigger:'↓ OpenReports',triggerTitle:'Скачать {report} и загрузить в {module}',close:'Закрыть',
      choosePeriod:'Отчёт для {module}. Выбери дату и время с точностью до секунд.',
      mdtHint:' Поля EAN и Location останутся пустыми.',stockDate:'Дата отчёта',stockHint:'Отчёт STOCK. Выбери один день. Источник: WMS ECM PODKARPACIE Prod.',
      dateFrom:'Дата с',timeFrom:'Время с',dateTo:'Дата по',timeTo:'Время по',
      timeFromFull:'Время с (ЧЧ:ММ:СС)',timeToFull:'Время по (ЧЧ:ММ:СС)',
      dayPart:'День',monthPart:'Месяц',yearPart:'Год',hourPart:'Часы (00–23)',minutePart:'Минуты (00–59)',secondPart:'Секунды (00–59)',
      activeJob:'Уже выполняется отчёт ({module}). Можно дождаться завершения или отменить предыдущий запрос.',
      start:'↓ Скачать из OpenReports',startPopup:'Скачать из OpenReports',cancel:'Отмена',
      autoImport:'Автоматический импорт локального XLSX',noFolder:'Папка с отчётами не выбрана.',
      folderUnset:'Папка не выбрана. Укажи {folder}',folderWrong:'Выбрана неправильная папка. Укажи {folder}',
      folderGranted:'чтение разрешено',folderExpired:'нужно повторное разрешение',
      pickFolder:'📁 Выбрать папку',importLast:'Загрузить последний подходящий XLSX',
      help:'Файлы сохраняются в <b>Downloads/MrRobot/OpenReports</b>. Один раз выбери папку <b>OpenReports</b> внутри Downloads/MrRobot. Автоматический импорт использует точное имя завершённой загрузки; ручной выбирает только самый новый файл нужного отчёта. Пароли и содержимое файлов не отправляются на сторонний сервер.',
      reportModule:'Отчёт / модуль',popupNote:'Bridge откроет OpenReports, если вкладка отсутствует. При необходимости войди в систему на сайте. Затем Bridge выполнит переходы Reports → ECM_Warehouse → нужный отчёт. Выбери период до секунд. Для GODZINY_MDT: источник WMS ECM REPL PODKARPACIE, EAN и Location пустые. Для STOCK выбери только день, источник WMS ECM PODKARPACIE Prod. Файлы сохраняются в Downloads/MrRobot/OpenReports.',
      ready:'Готово к работе.',readyPopup:'Готово к скачиванию.',badTime:'Укажи даты и время до секунд.',badPeriod:'Начало периода должно быть раньше его окончания.',
      launching:'Запускаю OpenReports…',started:'Отчёт запущен в OpenReports. Ожидаю XLSX…',
      syncError:'Ошибка синхронизации: {reason}',folderProblem:'Ошибка доступа к папке: {reason}',
      pickerUnavailable:'Браузер не поддерживает выбор папки. Загрузи Excel вручную.',
      pickerWrong:'Выбери папку OpenReports внутри Downloads/MrRobot, а не всю папку Downloads.',
      pickerError:'Не удалось выбрать папку: {reason}',folderLinked:'Папка подключена. Можно загружать скачанные файлы.',
      noPermission:'Нет разрешения на чтение папки.',chooseFolder:'Выбери папку {folder}.',
      staleFolder:'Доступ к папке истёк. Нажми «Загрузить последний подходящий XLSX», чтобы подтвердить доступ.',
      noMatch:'В папке OpenReports нет файлов {report}*.xlsx.',
      openModule:'Открой MP → AUDYT → {module} в Mr. Robot и попробуй снова.',
      waitImport:'Дождись завершения предыдущего импорта Excel.',
      noRecent:'Нет завершённой загрузки {report} в {folder}.',
      fileNotFound:'Файл {name} не найден в выбранной папке. Укажи {folder}.',
      badFile:'Неверный XLSX или превышен лимит 160 МБ.',badZip:'Файл не похож на XLSX (ZIP).',
      imported:'Файл {name} передан в {module}. Проверь результат импорта в Mr. Robot.',
      folderForImport:'Отчёт скачан в {folder}. Нажми «Выбрать папку» и укажи OpenReports для автоматического импорта.',
      outsideFolder:'Отчёт сохранён вне {folder}. Проверь настройку Edge «Спрашивать, где сохранить» и при необходимости загрузи файл вручную.',
      connectionError:'Ошибка связи с расширением',browserOpen:'Bridge откроет OpenReports, если вкладка закрыта. При необходимости войди в систему самостоятельно, после входа запрос продолжится.',
      serverPreparing:'OpenReports формирует отчёт. Ожидаю начала скачивания XLSX…',
      downloading:'Скачивание XLSX… {progress}',openReports:'Подключаюсь к вкладке OpenReports…',
      looking:'Ищу отчёт…',processing:'Обработка…',downloaded:'Excel скачан в Downloads/MrRobot/OpenReports. Импорт в Mr. Robot…',
      cancelled:'Отменено.',failed:'Не удалось скачать отчёт.',otherError:'Ошибка OpenReports: {reason}'
    },
    en: {
      mpArea:"MP location type",
      mpBrand:"Brand",
      mpAllBrands:"All brands",
      mpHint:"Baza MP: select an MP location type and brand. Data source: WMS ECM REPL PODKARPACIE.",
      mpInvalid:"Invalid MP location or brand.",
      mpOpenModule:"Open MP → Scalanie/Konsolidacja or RS → Baza MP to import this report.",
      trigger:'↓ OpenReports',triggerTitle:'Download {report} and load it into {module}',close:'Close',
      choosePeriod:'Report for {module}. Select exact dates and times, including seconds.',
      mdtHint:' EAN and Location will remain blank.',stockDate:'Report date',stockHint:'STOCK report. Choose one day. Data Source: WMS ECM PODKARPACIE Prod.',
      dateFrom:'Start date',timeFrom:'Start time',dateTo:'End date',timeTo:'End time',
      timeFromFull:'Start time (HH:MM:SS)',timeToFull:'End time (HH:MM:SS)',
      dayPart:'Day',monthPart:'Month',yearPart:'Year',hourPart:'Hours (00–23)',minutePart:'Minutes (00–59)',secondPart:'Seconds (00–59)',
      activeJob:'A report is already running ({module}). Wait for it to finish or cancel the previous request.',
      start:'↓ Download from OpenReports',startPopup:'Download from OpenReports',cancel:'Cancel',
      autoImport:'Automatic local XLSX import',noFolder:'No report folder selected.',
      folderUnset:'Folder not selected. Choose {folder}',folderWrong:'Wrong folder selected. Choose {folder}',
      folderGranted:'read access granted',folderExpired:'permission needs renewal',
      pickFolder:'📁 Choose folder',importLast:'Load latest matching XLSX',
      help:'Files are saved to <b>Downloads/MrRobot/OpenReports</b>. Select the <b>OpenReports</b> folder under Downloads/MrRobot once. Automatic import uses the exact completed download name; manual import selects only the newest file for the requested report. Passwords and file contents are not sent to an external server.',
      reportModule:'Report / module',popupNote:'Bridge opens OpenReports if necessary. Sign in on the site if asked. Bridge follows Reports → ECM_Warehouse → chosen report. Select dates and times to the second. For GODZINY_MDT: WMS ECM REPL PODKARPACIE, with EAN and Location blank. For STOCK, choose one day and Data Source WMS ECM PODKARPACIE Prod. Files are saved to Downloads/MrRobot/OpenReports.',
      ready:'Ready.',readyPopup:'Ready to download.',badTime:'Enter dates and times including seconds.',badPeriod:'Start must be earlier than end.',
      launching:'Starting OpenReports…',started:'Report started in OpenReports. Waiting for XLSX…',
      syncError:'Synchronization error: {reason}',folderProblem:'Folder access error: {reason}',
      pickerUnavailable:'This browser cannot select a folder. Import the Excel file manually.',
      pickerWrong:'Choose the OpenReports folder inside Downloads/MrRobot, not Downloads itself.',
      pickerError:'Could not select folder: {reason}',folderLinked:'Folder connected. Downloaded files can be imported.',
      noPermission:'Folder read access was not granted.',chooseFolder:'Choose the {folder} folder.',
      staleFolder:'Folder access expired. Click “Load latest matching XLSX” to renew access.',
      noMatch:'No {report}*.xlsx files found in OpenReports.',
      openModule:'Open MP → AUDYT → {module} in Mr. Robot and try again.',
      waitImport:'Wait for the previous Excel import to finish.',
      noRecent:'No completed {report} download in {folder}.',
      fileNotFound:'{name} was not found in the selected folder. Choose {folder}.',
      badFile:'Invalid XLSX or file exceeds 160 MB.',badZip:'File does not look like an XLSX (ZIP).',
      imported:'{name} was passed to {module}. Check the import results in Mr. Robot.',
      folderForImport:'Report downloaded to {folder}. Click “Choose folder” and select OpenReports to enable automatic import.',
      outsideFolder:'Report was saved outside {folder}. Check Edge’s “Ask where to save” setting and import the file manually if needed.',
      connectionError:'Extension connection error',browserOpen:'Bridge opens OpenReports if the tab is closed. If prompted, sign in yourself; the report request resumes after sign-in.',
      serverPreparing:'OpenReports is preparing the report. Waiting for the XLSX download to begin…',
      downloading:'Downloading XLSX… {progress}',openReports:'Connecting to the OpenReports tab…',
      looking:'Finding report…',processing:'Processing…',downloaded:'Excel saved to Downloads/MrRobot/OpenReports. Importing into Mr. Robot…',
      cancelled:'Cancelled.',failed:'Could not download the report.',otherError:'OpenReports error: {reason}'
    },
    uk: {
      mpArea:"Тип локації MP",
      mpBrand:"Бренд",
      mpAllBrands:"Усі бренди",
      mpHint:"Baza MP: вибери тип локації MP та бренд. Джерело даних: WMS ECM REPL PODKARPACIE.",
      mpInvalid:"Некоректна локація MP або бренд.",
      mpOpenModule:"Відкрий MP → Scalanie/Konsolidacja або RS → Baza MP, щоб імпортувати звіт.",
      trigger:'↓ OpenReports',triggerTitle:'Завантажити {report} та імпортувати в {module}',close:'Закрити',
      choosePeriod:'Звіт для {module}. Вибери дату й час із точністю до секунд.',
      mdtHint:' Поля EAN і Location залишаться порожніми.',stockDate:'Дата звіту',stockHint:'Звіт STOCK. Вибери один день. Джерело: WMS ECM PODKARPACIE Prod.',
      dateFrom:'Дата з',timeFrom:'Час з',dateTo:'Дата по',timeTo:'Час по',
      timeFromFull:'Час з (ГГ:ХХ:СС)',timeToFull:'Час по (ГГ:ХХ:СС)',
      dayPart:'День',monthPart:'Місяць',yearPart:'Рік',hourPart:'Години (00–23)',minutePart:'Хвилини (00–59)',secondPart:'Секунди (00–59)',
      activeJob:'Звіт уже виконується ({module}). Дочекайся завершення або скасуй попередній запит.',
      start:'↓ Завантажити з OpenReports',startPopup:'Завантажити з OpenReports',cancel:'Скасувати',
      autoImport:'Автоматичний імпорт локального XLSX',noFolder:'Папку зі звітами не вибрано.',
      folderUnset:'Папку не вибрано. Вкажи {folder}',folderWrong:'Вибрано неправильну папку. Вкажи {folder}',
      folderGranted:'читання дозволено',folderExpired:'потрібен повторний дозвіл',
      pickFolder:'📁 Вибрати папку',importLast:'Імпортувати останній відповідний XLSX',
      help:'Файли зберігаються в <b>Downloads/MrRobot/OpenReports</b>. Один раз вибери папку <b>OpenReports</b> усередині Downloads/MrRobot. Автоматичний імпорт використовує точну назву завершеного завантаження; ручний обирає лише найновіший файл потрібного звіту. Паролі та вміст файлів не надсилаються на сторонній сервер.',
      reportModule:'Звіт / модуль',popupNote:'Bridge відкриє OpenReports за потреби. Якщо потрібно, увійди на сайті. Далі Bridge переходить Reports → ECM_Warehouse → потрібний звіт. Вибери період до секунд. Для GODZINY_MDT: WMS ECM REPL PODKARPACIE, EAN і Location порожні. Для STOCK вибери лише день і джерело WMS ECM PODKARPACIE Prod. Файли зберігаються в Downloads/MrRobot/OpenReports.',
      ready:'Готово до роботи.',readyPopup:'Готово до завантаження.',badTime:'Вкажи дати та час із секундами.',badPeriod:'Початок періоду має бути раніше завершення.',
      launching:'Запускаю OpenReports…',started:'Звіт запущено в OpenReports. Очікую XLSX…',
      syncError:'Помилка синхронізації: {reason}',folderProblem:'Помилка доступу до папки: {reason}',
      pickerUnavailable:'Браузер не підтримує вибір папки. Імпортуй Excel вручну.',
      pickerWrong:'Вибери папку OpenReports усередині Downloads/MrRobot, а не всю Downloads.',
      pickerError:'Не вдалося вибрати папку: {reason}',folderLinked:'Папку підключено. Можна імпортувати завантажені файли.',
      noPermission:'Немає дозволу на читання папки.',chooseFolder:'Вибери папку {folder}.',
      staleFolder:'Доступ до папки завершився. Натисни «Імпортувати останній відповідний XLSX», щоб поновити його.',
      noMatch:'У папці OpenReports немає файлів {report}*.xlsx.',
      openModule:'Відкрий MP → AUDYT → {module} у Mr. Robot і спробуй ще раз.',
      waitImport:'Дочекайся завершення попереднього імпорту Excel.',
      noRecent:'Немає завершеного завантаження {report} у {folder}.',
      fileNotFound:'Файл {name} не знайдено у вибраній папці. Вкажи {folder}.',
      badFile:'Некоректний XLSX або файл перевищує 160 МБ.',badZip:'Файл не схожий на XLSX (ZIP).',
      imported:'Файл {name} передано до {module}. Перевір результат імпорту в Mr. Robot.',
      folderForImport:'Звіт завантажено до {folder}. Натисни «Вибрати папку» й укажи OpenReports для автоматичного імпорту.',
      outsideFolder:'Звіт збережено поза {folder}. Перевір налаштування Edge «Запитувати місце збереження» і за потреби імпортуй вручну.',
      connectionError:'Помилка зв’язку з розширенням',browserOpen:'Bridge відкриє OpenReports, якщо вкладку закрито. За потреби увійди самостійно; після входу запит продовжиться.',
      serverPreparing:'OpenReports готує звіт. Очікую початку завантаження XLSX…',
      downloading:'Завантаження XLSX… {progress}',openReports:'Підключаюся до вкладки OpenReports…',
      looking:'Шукаю звіт…',processing:'Обробка…',downloaded:'Excel завантажено до Downloads/MrRobot/OpenReports. Імпорт до Mr. Robot…',
      cancelled:'Скасовано.',failed:'Не вдалося завантажити звіт.',otherError:'Помилка OpenReports: {reason}'
    }
  };
  const LANGS = ['pl','ru','en','uk'];
  const normalize = code => {const k=String(code||'').toLowerCase().split('-')[0];return LANGS.includes(k)?k:'pl';};
  function t(key,lang='pl',vars={}) {
    const template=DICT[normalize(lang)][key]||DICT.pl[key]||key;
    return String(template).replace(/\{([\w]+)\}/g,(_,k)=>String(vars[k]??''));
  }
  function apply(target,lang){
    for(const el of target.querySelectorAll('[data-mr-tr]'))el.textContent=t(el.dataset.mrTr,lang);
    for(const el of target.querySelectorAll('[data-mr-aria]'))el.setAttribute('aria-label',t(el.dataset.mrAria,lang));
    for(const el of target.querySelectorAll('[data-mr-html]'))el.innerHTML=t(el.dataset.mrHtml,lang);
  }
  // Keep WMS automation diagnostics intact internally, but show the common
  // human-readable failures in the selected interface language.
  const ERRORS = [
    [/Nie znaleziono formularza parametrów/, 'Не найдена форма параметров отчёта.', 'Report parameters form not found.', 'Не знайдено форму параметрів звіту.'],
    [/Nieaktualny etap raportu/, 'Получено устаревшее сообщение от отчёта.', 'Received an outdated report step.', 'Отримано застарілий етап звіту.'],
    [/Zaloguj się do OpenReports|not currently logged into the system/, 'Войди в OpenReports и повтори попытку.', 'Sign in to OpenReports and try again.', 'Увійди до OpenReports і спробуй ще раз.'],
    [/Nie znaleziono przycisku Reports/, 'Не найдена кнопка Reports.', 'The Reports button was not found.', 'Кнопку Reports не знайдено.'],
    [/Nie znaleziono grupy|ECM_Warehouse.*nie znaleziono/, 'Группа ECM_Warehouse не найдена.', 'The ECM_Warehouse group was not found.', 'Групу ECM_Warehouse не знайдено.'],
    [/Nie znaleziono raportu|Nie można znaleźć raportu/, 'Нужный отчёт не найден в ECM_Warehouse.', 'Report not found under ECM_Warehouse.', 'Потрібний звіт не знайдено в ECM_Warehouse.'],
    [/Brak pól EAN \/ Location/, 'Не найдены поля EAN и Location. Отчёт не запущен.', 'EAN / Location fields missing. Report not started.', 'Поля EAN та Location відсутні. Звіт не запущено.'],
    [/Brak Data Source/, 'Не найден нужный источник данных (Data Source).', 'Required Data Source was not found.', 'Потрібне джерело даних (Data Source) не знайдено.'],
    [/Nieznany układ pól|Nie można rozpoznać pól MDT/, 'Не удалось определить поля формы отчёта. Экспорт остановлен.', 'Report form fields could not be identified. Export stopped.', 'Не вдалося визначити поля форми звіту. Експорт зупинено.'],
    [/Nie rozpoznano opcji XLSX|Nie znaleziono Execute Now|Nie rozpoznano metody dostarczenia|Brak metody Open in Browser/, 'Не найдены настройки экспорта XLSX на странице.', 'XLSX export controls not found on the page.', 'Налаштування експорту XLSX на сторінці не знайдено.'],
    [/Inny raport jest już uruchomiony/, 'Другой отчёт уже выполняется. Дождись завершения или отмени его.', 'Another report is already running. Let it finish or cancel it.', 'Інший звіт уже виконується. Дочекайся завершення або скасуй його.'],
    [/Nieprawidłowy okres/, 'Неправильно указан период.', 'Invalid report date range.', 'Некоректно вказано період.'],
    [/Otwórz OpenReports-WMS|Otwórz autoryzowaną stronę OpenReports/, 'Открой OpenReports в отдельной вкладке Edge и войди в систему.', 'Open OpenReports in another Edge tab and sign in.', 'Відкрий OpenReports в окремій вкладці Edge та увійди.'],
    [/Pobieranie przerwane/, 'Скачивание файла прервано.', 'File download was interrupted.', 'Завантаження файлу перервано.'],
    [/OpenReports nie rozpoczął pobierania/, 'OpenReports не начал скачивание за 45 минут. Проверь отчёт.', 'OpenReports did not start the download within 45 minutes.', 'OpenReports не розпочав завантаження за 45 хвилин. Перевір звіт.'],
    [/Upłynął czas oczekiwania na logowanie/, 'Время ожидания входа (15 минут) истекло.', 'Sign-in timed out after 15 minutes.', 'Час очікування входу (15 хвилин) минув.'],
    [/Poprzednie zadanie nie odpowiada/, 'Предыдущий запрос не отвечает. Можно запустить отчёт повторно.', 'Previous request stopped responding. You can retry.', 'Попередній запит не відповідає. Можна повторити спробу.'],
    [/Karta OpenReports została zamknięta/, 'Вкладка OpenReports закрыта или адрес изменился.', 'OpenReports tab was closed or its address changed.', 'Вкладку OpenReports закрито або адресу змінено.']
  ];
  // The background worker intentionally contains no UI or locale-specific code.
  // Map its diagnostic messages for display, retaining the raw text for unknown errors.
  function status(raw,lang='pl'){
    const s=String(raw||'');if(!s)return t('readyPopup',lang);
    let match;
    if(/^(?:Pobieranie XLSX|Pobieranie raportu)/.test(s)){
      match=s.match(/(?:\d+(?:[.,]\d+)?%[^\n]*|\d+(?:[.,]\d+)? MB[^\n]*)/);
      return t('downloading',lang,{progress:match?.[0]||''}).trim();
    }
    if(/OpenReports przygotowuje raport|Czekam na rozpoczęcie pobierania/.test(s))return t('serverPreparing',lang);
    if(/Oczekuję na zalogowanie/.test(s))return ({pl:'Oczekuję na zalogowanie w OpenReports…',ru:'Ожидаю входа в OpenReports…',en:'Waiting for OpenReports sign-in…',uk:'Очікую входу до OpenReports…'})[normalize(lang)];
    if(/Łączę się z kartą|Łączenie ze stroną/.test(s))return t('openReports',lang);
    if(/Przetwarzanie|Sprawdzam formularz|Wybieram raport|Szukam raportu|Otwieram|Ustawiam|Parametry/.test(s))return t('looking',lang);
    if(/Excel pobrany do Downloads\/MrRobot\/OpenReports/.test(s))return t('downloaded',lang);
    if(s==='Anulowano.')return t('cancelled',lang);
    if(s==='Gotowy do pobrania.'||s==='Gotowy.')return t('readyPopup',lang);
    if(normalize(lang)!=='pl'){
      for(const [pattern,ru,en,uk] of ERRORS){
        if(pattern.test(s))return normalize(lang)==='ru'?ru:normalize(lang)==='en'?en:uk;
      }
    }
    // Preserve specific diagnostics verbatim if no safe equivalent is known.
    return s;
  }
  root.MRBridgeI18n=Object.freeze({normalize,t,apply,status,keys:DICT});
})(globalThis);
