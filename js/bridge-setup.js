/* OpenReports Bridge: UI-only installation guide and connection indicator. */
(function () { 'use strict';
  const get = id => document.getElementById(id);
  const translations = {
    pl: { connected: 'Połączono · v{v}', missing: 'Nie wykryto rozszerzenia', warning: 'PWA nie może samodzielnie zainstalować rozszerzenia. Jeśli zasady firmowe blokują instalację, skontaktuj się z IT.', copied: 'Skopiowano', copy: 'Kopiuj' },
    ru: { connected: 'Подключено · v{v}', missing: 'Расширение не обнаружено', warning: 'PWA не может самостоятельно устанавливать расширения. Если корпоративные правила запрещают установку, обратись в IT.', copied: 'Скопировано', copy: 'Копировать' },
    en: { connected: 'Connected · v{v}', missing: 'Extension not detected', warning: 'A PWA cannot install extensions automatically. If corporate policy blocks installation, contact IT.', copied: 'Copied', copy: 'Copy' },
    uk: { connected: 'Підключено · v{v}', missing: 'Розширення не виявлено', warning: 'PWA не може автоматично встановлювати розширення. Якщо корпоративні правила забороняють встановлення, звернися до IT.', copied: 'Скопійовано', copy: 'Копіювати' }
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
  const state = { version: null, browser: detectedBrowser(), expanded: false, copyNotice: false };
  function browserUrl() { return state.browser === 'chrome' ? 'chrome://extensions' : 'edge://extensions'; }
  function draw() {
    const t = translations[lang()];
    const present = !!state.version;
    const label = present ? t.connected.replace('{v}', state.version) : t.missing;
    const indicator = get('mr-bridge-indicator-dot');
    if (indicator) indicator.dataset.connected = String(present);
    const trigger = get('mr-bridge-indicator');
    if (trigger) trigger.title = 'OpenReports Bridge · ' + label;
    const panel = get('settings-openreports');
    if (!panel) return;
    const status = get('mr-bridge-status');
    const dot = get('mr-bridge-dot');
    const warning = get('mr-bridge-warning');
    if (status) status.textContent = label;
    if (dot) dot.dataset.connected = String(present);
    if (warning) warning.textContent = t.warning;
    panel.querySelectorAll('[data-bridge-browser]').forEach(b => {
      const active = b.dataset.bridgeBrowser === state.browser;
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('is-selected', active);
    });
    const url = get('mr-bridge-extension-url');
    if (url) url.textContent = browserUrl();
    const toggle = get('mr-bridge-install-toggle');
    const body = get('mr-bridge-install-body');
    if (toggle) toggle.setAttribute('aria-expanded', String(state.expanded));
    if (body) body.hidden = !state.expanded;
    const copyLabel = get('mr-bridge-copy-label');
    if (copyLabel) copyLabel.textContent = state.copyNotice ? t.copied : t.copy;
  }
  function detect() {
    const v = document.documentElement.dataset.mrOpenreportsBridge;
    state.version = /^\d+\.\d+\.\d+$/.test(v || '') ? v : null;
    draw();
  }
  function copyUrl() {
    const text = browserUrl();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => { state.copyNotice = true; draw(); }, () => fallbackCopy(text));
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.append(el); el.select();
    try { state.copyNotice = document.execCommand('copy'); } catch (_) { state.copyNotice = false; }
    el.remove(); draw();
  }
  // Delegate events: Vue creates the settings panel on demand.
  document.addEventListener('click', event => {
    const browser = event.target.closest('[data-bridge-browser]');
    if (browser && get('settings-openreports')?.contains(browser)) {
      state.browser = browser.dataset.bridgeBrowser;
      state.copyNotice = false;
      draw(); return;
    }
    if (event.target.closest('#mr-bridge-install-toggle')) { state.expanded = !state.expanded; draw(); return; }
    if (event.target.closest('#mr-bridge-copy-url')) { copyUrl(); }
  });
  document.addEventListener('mr-openreports-bridge-ready', detect);
  window.MRI18N?.subscribe?.(draw);
  const root = get('app') || document.body;
  let lastPanel = null, lastIndicator = null;
  new MutationObserver(() => {
    const panel = get('settings-openreports'), indicator = get('mr-bridge-indicator-dot');
    if (panel !== lastPanel || indicator !== lastIndicator) {
      lastPanel = panel; lastIndicator = indicator; draw();
    }
  }).observe(root, { childList: true, subtree: true });
  document.addEventListener('mrbot-view-change', () => queueMicrotask(draw));
  detect();
  document.dispatchEvent(new Event('mr-openreports-bridge-query'));
  setTimeout(detect, 600);
  setTimeout(detect, 2500);
})();
