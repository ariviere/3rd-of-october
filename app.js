(function () {
  /* ── language helpers ── */
  function getLang() {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('lang');
    if (p === 'fr' || p === 'en') return p;
    return localStorage.getItem('wedding_lang') || 'en';
  }

  function setLangInUrl(lang) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }

  function hrefWithLang(href, lang) {
    if (!href || /^https?:\/\//i.test(href) || href.startsWith('mailto:')) return href;

    const hashIdx = href.indexOf('#');
    const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
    const pathPart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;

    if (pathPart.startsWith('#')) {
      const u = new URL(window.location.href);
      u.searchParams.set('lang', lang);
      const file = u.pathname.split('/').pop() || 'index.html';
      return file + u.search + href;
    }

    const u = new URL(pathPart || window.location.pathname.split('/').pop(), window.location.href);
    u.searchParams.set('lang', lang);
    const file = u.pathname.split('/').pop();
    return file + u.search + hash;
  }

  function patchNavLinks(lang) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      const href = a.getAttribute('href');
      if (!href || /^https?:\/\//i.test(href) || href.startsWith('mailto:')) return;
      if (!a.dataset.hrefBase) a.dataset.hrefBase = href;
      a.href = hrefWithLang(a.dataset.hrefBase, lang);
    });
  }

  window.getWeddingLang = getLang;

  /* ── apply language ── */
  function applyLang(lang) {
    localStorage.setItem('wedding_lang', lang);
    document.documentElement.lang = lang;
    const dict = T[lang] || T.en;
    const other = lang === 'en' ? 'FR' : 'EN';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = dict[key] != null ? dict[key] : (T.fr[key] != null ? T.fr[key] : null);
      if (val != null) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      const val = dict[key] != null ? dict[key] : (T.fr[key] != null ? T.fr[key] : null);
      if (val != null) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const val = dict[key] != null ? dict[key] : (T.fr[key] != null ? T.fr[key] : null);
      if (val != null) el.placeholder = val;
    });

    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = other;
      btn.dataset.lang = lang === 'en' ? 'fr' : 'en';
    });

    document.querySelectorAll('[data-lang-only]').forEach(el => {
      el.style.display = el.dataset.langOnly === lang ? '' : 'none';
    });

    setLangInUrl(lang);
    patchNavLinks(lang);
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
      applyLang(getLang());
      document.getElementById('gate').style.display = 'flex';
      document.documentElement.style.visibility = 'visible';
      document.getElementById('gate-input').focus();
    });
  }

  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'gate-form') return;
    e.preventDefault();
    const val = document.getElementById('gate-input').value.trim().toLowerCase();
    if (val === CORRECT) {
      unlock();
    } else {
      const lang = getLang();
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

  /* ── hamburger menu ── */
  document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('nav-hamburger');
    const navMenu   = document.getElementById('nav-menu');
    if (!hamburger || !navMenu) return;

    function toggleMenu(open) {
      const isOpen = open !== undefined ? open : !hamburger.classList.contains('is-open');
      hamburger.classList.toggle('is-open', isOpen);
      navMenu.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      navMenu.setAttribute('aria-hidden', !isOpen);
    }

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    navMenu.addEventListener('click', function (e) {
      if (e.target.closest('.nav__menu-link') || e.target.closest('[data-rsvp-open]')) {
        toggleMenu(false);
      }
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        toggleMenu(false);
      }
    });

    const nav = document.getElementById('main-nav');
    let lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      if (window.innerWidth > 768) return;
      const y = window.scrollY;
      if (y > lastY && y > 60) {
        nav.classList.add('nav--hidden');
        toggleMenu(false);
      } else {
        nav.classList.remove('nav--hidden');
      }
      lastY = y;
    }, { passive: true });
  });

  /* ── registry gift note form ── */
  document.addEventListener('DOMContentLoaded', function () {
    var WORKER_URL = 'https://wedding.windnow.workers.dev';
    var form    = document.getElementById('registry-form');
    var success = document.getElementById('registry-success');
    var errorEl = document.getElementById('registry-error');
    var submitBtn = document.getElementById('registry-submit');
    if (!form) return;

    function t(key) {
      var lang = getLang();
      return (T[lang] && T[lang][key]) || (T.en && T.en[key]) || '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name    = document.getElementById('registry-name').value.trim();
      var message = document.getElementById('registry-message').value.trim();
      errorEl.textContent = '';
      if (!name) {
        errorEl.textContent = t('registry.note.name') + ' is required.';
        return;
      }
      submitBtn.disabled = true;
      fetch(WORKER_URL + '/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, message: message }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.ok) throw new Error('server');
          form.hidden    = true;
          success.hidden = false;
          success.textContent = t('registry.note.success');
        })
        .catch(function () {
          errorEl.textContent = t('registry.note.error');
          submitBtn.disabled  = false;
        });
    });
  });

  /* ── init ── */
  function initSite() {
    const lang = getLang();
    const restrict = document.body.dataset.langRestrict;
    if (restrict && lang !== restrict) {
      window.location.href = 'index.html?lang=' + lang;
      return;
    }
    applyLang(lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite);
  } else {
    initSite();
  }
})();
