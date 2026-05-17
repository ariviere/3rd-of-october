(function () {
  /* ── apply language ── */
  function applyLang(lang) {
    localStorage.setItem('wedding_lang', lang);
    document.documentElement.lang = lang;
    const dict = T[lang] || T.en;
    const other = lang === 'en' ? 'FR' : 'EN';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key] != null) el.placeholder = dict[key];
    });

    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = other;
      btn.dataset.lang = lang === 'en' ? 'fr' : 'en';
    });
  }

  /* ── password gate ── */
  const CORRECT  = 'mochacoco';
  const AUTH_KEY = 'wedding_auth';

  function unlock() {
    localStorage.setItem(AUTH_KEY, '1');
    document.getElementById('gate').style.display = 'none';
    document.documentElement.style.visibility = 'visible';
  }

  if (localStorage.getItem(AUTH_KEY) === '1') {
    document.documentElement.style.visibility = 'visible';
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('gate').style.display = 'flex';
      document.documentElement.style.visibility = 'visible';
      document.getElementById('gate-input').focus();
    });
  }

  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'gate-form') return;
    e.preventDefault();
    const val = document.getElementById('gate-input').value;
    if (val === CORRECT) {
      unlock();
    } else {
      const lang = localStorage.getItem('wedding_lang') || 'en';
      const err  = document.getElementById('gate-error');
      err.textContent = T[lang]['gate.error'];
      document.getElementById('gate-input').value = '';
      document.getElementById('gate-input').focus();
    }
  });

  /* ── language toggle ── */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.lang-toggle');
    if (!btn) return;
    applyLang(btn.dataset.lang);
  });

  /* ── FAQ accordion ── */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.faq__q');
    if (!btn) return;
    const item = btn.closest('.faq__item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });

  /* ── init ── */
  document.addEventListener('DOMContentLoaded', function () {
    const saved = localStorage.getItem('wedding_lang') || 'en';
    applyLang(saved);
  });
})();
