(function () {
  // Replace with your deployed Cloudflare Worker URL
  var WORKER_URL = 'https://wedding.windnow.workers.dev';

  var guestCount = 0;

  function getLang() { return localStorage.getItem('wedding_lang') || 'en'; }

  function t(key) {
    var lang = getLang();
    return (T[lang] && T[lang][key]) || (T.en && T.en[key]) || '';
  }

  /* ── guest rows ── */
  function createGuestRow(isSelf) {
    var idx = guestCount++;
    var row = document.createElement('div');
    row.className = 'rsvp__guest-row';
    row.dataset.idx = idx;

    var nameInput = document.createElement('input');
    nameInput.className = 'rsvp__input';
    nameInput.type = 'text';
    nameInput.name = 'guest-name-' + idx;
    nameInput.placeholder = t(isSelf ? 'rsvp.form.guest-self' : 'rsvp.form.guest-name');
    nameInput.dataset.i18nPlaceholder = isSelf ? 'rsvp.form.guest-self' : 'rsvp.form.guest-name';

    var dietInput = document.createElement('input');
    dietInput.className = 'rsvp__input';
    dietInput.type = 'text';
    dietInput.name = 'guest-dietary-' + idx;
    dietInput.placeholder = t('rsvp.form.guest-dietary');
    dietInput.dataset.i18nPlaceholder = 'rsvp.form.guest-dietary';

    row.appendChild(nameInput);
    row.appendChild(dietInput);

    if (!isSelf) {
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'rsvp__remove-guest';
      removeBtn.setAttribute('aria-label', 'Remove');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function () { row.remove(); });
      row.appendChild(removeBtn);
    } else {
      row.appendChild(document.createElement('div')); // spacer
    }

    return row;
  }

  function collectGuests() {
    var guests = [];
    document.querySelectorAll('#rsvp-guest-list .rsvp__guest-row').forEach(function (row) {
      var name = row.querySelector('input[name^="guest-name"]').value.trim();
      var diet = row.querySelector('input[name^="guest-dietary"]').value.trim();
      if (name) guests.push({ name: name, dietary: diet });
    });
    return guests;
  }

  /* ── parse Airtable guests string back into rows ── */
  function parseGuestString(str) {
    if (!str) return [];
    return str.split('\n').filter(Boolean).map(function (line) {
      var m = line.match(/^(.+?)\s*(?:\((.+)\))?$/);
      return { name: m ? m[1].trim() : line.trim(), dietary: m && m[2] ? m[2].trim() : '' };
    });
  }

  /* ── attending toggle ── */
  function setAttending(value) {
    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
      r.checked = (r.value === value);
    });
    var details = document.getElementById('rsvp-details');
    if (value === 'yes') details.classList.add('is-open');
    else details.classList.remove('is-open');
  }

  function onAttendingChange() {
    var attending = '';
    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
      if (r.checked) attending = r.value;
    });
    var details = document.getElementById('rsvp-details');
    if (attending === 'yes') details.classList.add('is-open');
    else details.classList.remove('is-open');
  }

  /* ── pre-fill form from existing RSVP ── */
  function prefillForm(rsvp) {
    document.getElementById('rsvp-name').value  = rsvp.name  || '';
    document.getElementById('rsvp-email').value = rsvp.email || '';

    if (rsvp.attending) setAttending(rsvp.attending);

    // events checkboxes
    document.querySelectorAll('input[name="events"]').forEach(function (cb) {
      cb.checked = rsvp.events && rsvp.events.indexOf(cb.value) !== -1;
    });

    // guest rows — rebuild
    var guestList = document.getElementById('rsvp-guest-list');
    guestList.innerHTML = '';
    guestCount = 0;
    var parsed = parseGuestString(rsvp.guests);
    var hasSelf = parsed.length > 0;

    if (hasSelf) {
      parsed.forEach(function (g, i) {
        var row = createGuestRow(i === 0);
        row.querySelector('input[name^="guest-name"]').value    = g.name;
        row.querySelector('input[name^="guest-dietary"]').value = g.dietary;
        guestList.appendChild(row);
      });
    } else {
      guestList.appendChild(createGuestRow(true));
    }

    // re-wire self-sync
    wireSelfSync(guestList);

    document.getElementById('rsvp-message').value = rsvp.message || '';

    // show update banner
    var banner = document.getElementById('rsvp-update-banner');
    if (banner) {
      banner.hidden = false;
      banner.querySelector('[data-i18n]').textContent = t('rsvp.form.update-banner');
    }
  }

  /* ── self-sync: mirror main name field into first guest row ── */
  function wireSelfSync(guestList) {
    var mainName      = document.getElementById('rsvp-name');
    var selfNameInput = guestList.querySelector('input[name^="guest-name"]');
    var selfEdited    = false;

    if (!selfNameInput) return;
    selfNameInput.addEventListener('input', function () { selfEdited = true; });
    mainName.addEventListener('input', function () {
      if (!selfEdited) selfNameInput.value = mainName.value;
    });
  }

  /* ── form submit ── */
  function onSubmit(e) {
    e.preventDefault();

    var name      = document.getElementById('rsvp-name').value.trim();
    var email     = document.getElementById('rsvp-email').value.trim();
    var errorEl   = document.getElementById('rsvp-error');
    var submitBtn = document.getElementById('rsvp-submit');

    errorEl.textContent = '';

    if (!name || !email) {
      errorEl.textContent = t('rsvp.form.error-required');
      return;
    }

    var attending = '';
    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
      if (r.checked) attending = r.value;
    });

    var events = [];
    document.querySelectorAll('input[name="events"]:checked').forEach(function (cb) {
      events.push(cb.value);
    });

    var message = document.getElementById('rsvp-message').value.trim();
    var guests  = attending === 'yes' ? collectGuests() : [];
    var lang    = getLang();

    submitBtn.disabled = true;

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, attending, events, guests, message, lang }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) { console.error('RSVP error:', data); throw new Error('server'); }
          return data;
        });
      })
      .then(function () {
        var isYes = attending === 'yes';
        // swap in correct success message
        document.querySelector('#rsvp-success .rsvp__success-title').textContent =
          t(isYes ? 'rsvp.form.success-title' : 'rsvp.form.success-title-no');
        document.querySelector('#rsvp-success .rsvp__success-text').textContent =
          t(isYes ? 'rsvp.form.success-text' : 'rsvp.form.success-text-no');

        document.getElementById('rsvp-form').hidden    = true;
        document.getElementById('rsvp-success').hidden = false;
        document.getElementById('rsvp-update-banner').hidden = true;
      })
      .catch(function () {
        errorEl.textContent = t('rsvp.form.error-server');
        submitBtn.disabled  = false;
      });
  }

  /* ── modal ── */
  function openModal() {
    var modal = document.getElementById('rsvp-modal');
    modal.removeAttribute('hidden');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { modal.classList.add('is-open'); });
    });
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    var modal = document.getElementById('rsvp-modal');
    modal.classList.remove('is-open');
    setTimeout(function () { modal.setAttribute('hidden', ''); }, 250);
    document.body.classList.remove('modal-open');
  }

  /* ── init ── */
  document.addEventListener('DOMContentLoaded', function () {
    var guestList = document.getElementById('rsvp-guest-list');
    var addBtn    = document.getElementById('rsvp-add-guest');
    var form      = document.getElementById('rsvp-form');

    if (!form) return;

    // first row = yourself
    guestList.appendChild(createGuestRow(true));
    wireSelfSync(guestList);

    addBtn.addEventListener('click', function () {
      guestList.appendChild(createGuestRow(false));
    });

    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
      r.addEventListener('change', onAttendingChange);
    });

    form.addEventListener('submit', onSubmit);

    // open modal buttons (hero + banner)
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-rsvp-open]')) { e.preventDefault(); openModal(); }
      if (e.target.closest('#rsvp-modal-close'))  closeModal();
      if (e.target.id === 'rsvp-modal-overlay')   closeModal();
    });

    // close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // pre-fill + auto-open if arriving via edit link (?rsvp=TOKEN)
    var token = new URLSearchParams(window.location.search).get('rsvp');
    if (token) {
      fetch(WORKER_URL + '?token=' + encodeURIComponent(token))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.ok) { prefillForm(data.rsvp); openModal(); }
        })
        .catch(function () {});
    }
  });
})();
