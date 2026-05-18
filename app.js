(function () {
  function isValidLang(lang) {
    return lang === 'fr' || lang === 'en';
  }

  function getUrlLang() {
    const lang = new URLSearchParams(window.location.search).get('lang');
    const normalized = lang ? lang.toLowerCase() : '';
    return isValidLang(normalized) ? normalized : null;
  }

  function setCurrentUrlLang(lang) {
    if (!isValidLang(lang) || !window.history || !window.history.replaceState) return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', url);
  }

  function buildLangHref(href, lang) {
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|sms|javascript):/i.test(href)) {
      return href;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return href;

    url.searchParams.set('lang', lang);
    return url.pathname + url.search + url.hash;
  }

  function syncLangLinks(lang) {
    document.querySelectorAll('a[href]').forEach(link => {
      const baseHref = link.dataset.baseHref || link.getAttribute('href');
      link.dataset.baseHref = baseHref;
      link.setAttribute('href', buildLangHref(baseHref, lang));
    });
  }

  function redirectHome(lang) {
    const url = new URL('index.html', window.location.href);
    url.searchParams.set('lang', lang);
    window.location.href = url.pathname + url.search;
  }

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

    // show/hide elements restricted to a specific language
    document.querySelectorAll('[data-lang-only]').forEach(el => {
      el.style.display = el.dataset.langOnly === lang ? '' : 'none';
    });

    syncLangLinks(lang);
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
    const val = document.getElementById('gate-input').value.trim().toLowerCase();
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
    const lang = btn.dataset.lang;
    if (!isValidLang(lang)) return;

    const restrict = document.body.dataset.langRestrict;
    localStorage.setItem('wedding_lang', lang);
    if (restrict && lang !== restrict) {
      redirectHome(lang);
      return;
    }

    setCurrentUrlLang(lang);
    applyLang(lang);
  });

  /* ── hamburger menu ── */
  document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('nav-hamburger');
    const navMenu   = document.getElementById('nav-menu');

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

    // close when a menu link or RSVP button is clicked
    navMenu.addEventListener('click', function (e) {
      if (e.target.closest('.nav__menu-link') || e.target.closest('[data-rsvp-open]')) {
        toggleMenu(false);
      }
    });

    // close on outside click
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // hide nav on scroll down, reveal on scroll up (mobile only)
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
      var lang = localStorage.getItem('wedding_lang') || 'en';
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
  document.addEventListener('DOMContentLoaded', function () {
    const storedLang = localStorage.getItem('wedding_lang');
    const lang = getUrlLang() || (isValidLang(storedLang) ? storedLang : 'en');

    // redirect if this page is restricted to a specific language
    const restrict = document.body.dataset.langRestrict;
    if (restrict && lang !== restrict) {
      redirectHome(lang);
      return;
    }

    applyLang(lang);
  });
})();
