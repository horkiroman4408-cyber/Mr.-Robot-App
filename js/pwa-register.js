/* Mr. Robot — PWA registration + user-controlled update flow.
 * Registers sw.js, shows a floating pill when a new version is waiting,
 * and only reloads after the user clicks it (reports are never interrupted).
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var proto = location.protocol;
  if (proto !== 'https:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;

  var PILL_TEXT_KEY = 'Dostępna aktualizacja';
  var PILL_BTN_KEY = 'Zaktualizuj teraz';

  function tr(key) {
    try { return window.MRI18N ? window.MRI18N.t(key) : key; } catch (e) { return key; }
  }

  // ---- pill UI ----
  var pill = document.createElement('div');
  pill.id = 'mr-update-pill';
  pill.setAttribute('role', 'status');
  pill.style.display = 'none';
  var label = document.createElement('span');
  label.className = 'mr-update-label';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mr-update-btn';
  pill.appendChild(label);
  pill.appendChild(btn);
  document.body.insertBefore(pill, document.body.firstChild); // banner at top, dedicated space in flow

  function refreshTexts() {
    label.textContent = tr(PILL_TEXT_KEY);
    btn.textContent = tr(PILL_BTN_KEY);
    btn.title = tr(PILL_BTN_KEY);
  }
  refreshTexts();
  if (window.MRI18N && window.MRI18N.subscribe) {
    window.MRI18N.subscribe(refreshTexts);
  }

  var reg = null;
  var reloading = false;
  var userRequestedUpdate = false; // only reload the page if THIS page asked for it

  function showPill() {
    refreshTexts();
    pill.style.display = 'flex';
  }

  btn.addEventListener('click', function () {
    if (reg && reg.waiting) {
      userRequestedUpdate = true;
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      location.reload();
    }
  });

  // Reload only when this page requested the update (user clicked).
  // First install / claim, or an update accepted in another tab, must not reload.
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloading || !userRequestedUpdate) return;
    reloading = true;
    location.reload();
  });

  function watchWaiting() {
    if (reg && reg.waiting && navigator.serviceWorker.controller) showPill();
  }

  // Keep the current report untouched. Only check for updates while online.
  var CHECK_INTERVAL_MS = 15 * 60 * 1000;
  var RETURN_CHECK_MIN_MS = 5 * 60 * 1000;
  var lastCheckAt = 0;
  var checking = false;
  function checkForUpdate(minAgeMs) {
    if (!reg || checking || !navigator.onLine) return;
    var now = Date.now();
    if (now - lastCheckAt < minAgeMs) return;
    lastCheckAt = now;
    checking = true;
    reg.update().then(watchWaiting).catch(function () {}).then(function () {
      checking = false;
    });
  }

  navigator.serviceWorker.register('./sw.js').then(function (r) {
    reg = r;
    watchWaiting();
    reg.addEventListener('updatefound', function () {
      var w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', function () {
        if (w.state === 'installed' && navigator.serviceWorker.controller) showPill();
      });
    });
    // Check immediately after registration, then every 15 minutes.
    checkForUpdate(0);
    setInterval(function () { checkForUpdate(CHECK_INTERVAL_MS); }, CHECK_INTERVAL_MS);
    // Returning to an existing PWA window is a good time to look for a release.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) checkForUpdate(RETURN_CHECK_MIN_MS);
    });
    window.addEventListener('focus', function () { checkForUpdate(RETURN_CHECK_MIN_MS); });
    window.addEventListener('online', function () { checkForUpdate(RETURN_CHECK_MIN_MS); });
  }).catch(function () { /* PWA is optional: app still works online */ });
})();
