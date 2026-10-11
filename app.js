(function () {
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

    refreshTrip();
  }

  var FIRST_HOP = {
    sfo: { cdg: '11h', ams: '10h30', yul: '5h30' },
    lax: { cdg: '10h30', ams: '10h20', yul: '5h20' },
    mia: { cdg: '9h', ams: '8h50', yul: '3h45' },
    nyc: { cdg: '7h30', ams: '7h30', yul: '1h30' },
    atl: { cdg: '8h30', ams: '8h30', yul: '3h' },
    yyz: { cdg: '7h10', ams: '7h30', yul: '1h20' },
    tyo: { cdg: '14h45', ams: '14h' }
  };

  function refreshTrip() {
    var plan = document.getElementById('trip-plan');
    var btn = document.querySelector('.trip-city.is-on');
    if (!plan || !btn) return;
    var lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
    var dict = T[lang] || T.en;
    var name = btn.querySelector('.trip-city__name');
    plan.querySelectorAll('[data-trip-name]').forEach(function (el) {
      el.dataset.i18n = name.dataset.i18n;
      el.textContent = name.textContent;
    });
    var times = FIRST_HOP[btn.dataset.city] || {};
    plan.querySelectorAll('[data-first]').forEach(function (el) {
      var hours = times[el.dataset.first];
      el.textContent = hours ? ((lang === 'fr' ? 'environ ' : 'about ') + hours) : '';
    });
    plan.querySelectorAll('[data-trip-airports]').forEach(function (el) {
      var key = '';
      if (btn.dataset.city === 'tyo') {
        key = el.dataset.hub === 'ams'
          ? 'getting-there.airport.tyo.ams'
          : 'getting-there.airport.tyo.paris';
      }
      if (!key) {
        el.hidden = true;
        el.textContent = '';
        el.removeAttribute('data-i18n');
        return;
      }
      el.hidden = false;
      el.dataset.i18n = key;
      el.textContent = dict[key] || '';
    });
    var montreal = plan.querySelector('[data-montreal]');
    if (montreal) montreal.hidden = btn.dataset.montreal === '0';
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
    applyLang(btn.dataset.lang);
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
    const params   = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang');
    const validLang = paramLang === 'fr' || paramLang === 'en' ? paramLang : null;
    const lang = validLang || localStorage.getItem('wedding_lang') || 'en';

    // redirect if this page is restricted to a specific language
    const restrict = document.body.dataset.langRestrict;
    if (restrict && lang !== restrict) {
      window.location.href = 'index.html';
      return;
    }

    applyLang(lang);

    const pick = document.querySelector('.trip-pick');
    const plan = document.getElementById('trip-plan');
    if (pick && plan) {
      pick.addEventListener('click', function (event) {
        const btn = event.target.closest('.trip-city');
        if (!btn) return;
        const closing = btn.classList.contains('is-on');
        pick.querySelectorAll('.trip-city').forEach(function (city) {
          const on = !closing && city === btn;
          city.classList.toggle('is-on', on);
          city.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (closing) {
          plan.hidden = true;
          plan.classList.remove('is-in');
          return;
        }
        refreshTrip();
        plan.hidden = false;
        plan.classList.remove('is-in');
        void plan.offsetWidth;
        plan.classList.add('is-in');
      });
    }

    const trainBtn = document.getElementById('trip-train');
    const trainPlan = document.getElementById('train-plan');
    if (trainBtn && trainPlan) {
      trainBtn.addEventListener('click', function () {
        const open = trainPlan.hidden;
        trainPlan.hidden = !open;
        trainBtn.classList.toggle('is-on', open);
        trainBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) return;
        trainPlan.classList.remove('is-in');
        void trainPlan.offsetWidth;
        trainPlan.classList.add('is-in');
      });
    }
  });
})();
