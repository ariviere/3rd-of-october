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

  /* ── init ── */
  document.addEventListener('DOMContentLoaded', function () {
    const params   = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang');
    const validLang = paramLang === 'fr' || paramLang === 'en' ? paramLang : null;
    const lang = validLang || localStorage.getItem('wedding_lang') || 'en';
    applyLang(lang);
  });
})();
