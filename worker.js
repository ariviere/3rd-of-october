/**
 * Wedding RSVP + Registry – Cloudflare Worker
 *
 * Replies are saved to a Google Sheet when these secrets are set:
 *   GOOGLE_SHEET_ID              The sheet link, or just the id in the link
 *   GOOGLE_SERVICE_ACCOUNT_JSON  The service-account key file, as one JSON string
 *
 * Until those are set, replies still go to Airtable:
 *   AIRTABLE_TOKEN
 *   AIRTABLE_BASE_ID
 *
 * Email (optional):
 *   RESEND_API_KEY
 *   FROM_EMAIL
 *   SITE_URL
 *
 * Sheet tabs (created automatically):
 *   "RSVPs" — Submitted At, Name, Email, Attending, Events, Guests, Message, Token
 *   "Notes" — Submitted At, Name, Message
 */

const AIRTABLE_TABLE          = 'RSVPs';
const AIRTABLE_REGISTRY_TABLE = 'GiftMessages';
const RSVP_SHEET              = 'RSVPs';
const NOTES_SHEET             = 'Notes';
const RSVP_HEADERS            = ['Submitted At', 'Name', 'Email', 'Attending', 'Events', 'Guests', 'Message', 'Token'];
const NOTE_HEADERS            = ['Submitted At', 'Name', 'Message'];

let cachedToken = '';
let cachedTokenExp = 0;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);

    const url = new URL(request.url);

    if (url.pathname === '/registry') return handleRegistry(request, env);

    // GET /?token=... — retrieve existing RSVP so the form can pre-fill
    if (request.method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token) return cors(JSON.stringify({ error: 'Missing token' }), 400);

      let found;
      try { found = await findRsvp(env, 'token', token); }
      catch (err) { return cors(JSON.stringify({ error: 'Database error', detail: String(err.message || err) }), 500); }
      if (!found) return cors(JSON.stringify({ error: 'Not found' }), 404);

      return cors(JSON.stringify({
        ok: true,
        rsvp: {
          name:      found.name,
          email:     found.email,
          attending: found.attending,
          events:    found.events ? found.events.split(', ').filter(Boolean) : [],
          guests:    found.guests,
          message:   found.message,
        },
      }), 200);
    }

    if (request.method !== 'POST') {
      return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
    }

    let body;
    try { body = await request.json(); }
    catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }

    const { name, email, attending, events = [], guests = [], message = '', lang = 'en' } = body;

    if (!name || !email) {
      return cors(JSON.stringify({ error: 'Name and email are required' }), 400);
    }

    let existing;
    let token;
    try {
      existing = await findRsvp(env, 'email', email);
      token = (existing && existing.token) || crypto.randomUUID();
      await saveRsvp(env, {
        submittedAt: new Date().toISOString(),
        name,
        email,
        attending: attending || '',
        events: events.join(', '),
        guests: guests.map(g => g.dietary ? `${g.name} (${g.dietary})` : g.name).join('\n'),
        message,
        token,
      }, existing);
    } catch (err) {
      return cors(JSON.stringify({ error: 'Database error', detail: String(err.message || err) }), 500);
    }

    // Send confirmation email if Resend is configured
    if (env.RESEND_API_KEY && env.SITE_URL) {
      await sendEmail({ env, to: email, name, attending, events, guests, token, lang })
        .catch(() => {}); // don't fail the request if email fails
    }

    return cors(JSON.stringify({ ok: true }), 200);
  },
};

/* ── Registry: save a gift note ── */

async function handleRegistry(request, env) {
  if (request.method !== 'POST') {
    return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
  }

  let body;
  try { body = await request.json(); }
  catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }

  const { name, message = '' } = body;
  if (!name) return cors(JSON.stringify({ error: 'Name is required' }), 400);

  try {
    await saveNote(env, name, message);
  } catch (err) {
    return cors(JSON.stringify({ error: 'Database error', detail: String(err.message || err) }), 500);
  }

  return cors(JSON.stringify({ ok: true }), 200);
}

/* ── Email ── */

async function sendEmail({ env, to, name, attending, events, guests, token, lang }) {
  const editUrl = `${env.SITE_URL}?rsvp=${token}`;
  const isFr    = lang === 'fr';
  const isJa    = lang === 'ja';
  const isYes   = attending === 'yes';
  const pick    = (en, fr, ja) => (isJa ? ja : isFr ? fr : en);

  const eventLabels = {
    wedding: pick('Sat Aug 14 — Wedding at La Poterie', 'Sam. 14 août — Mariage à La Poterie', '8月14日（土）— La Poterieでの結婚式'),
    retour:  pick('Sun Aug 15 — Retour brunch', 'Dim. 15 août — Retour (brunch)', '8月15日（日）— Retourブランチ'),
  };

  const guestLines = guests.length
    ? guests.map(g => `<li>${g.name}${g.dietary ? ` <span style="color:#aaa">(${g.dietary})</span>` : ''}</li>`).join('')
    : '';

  const eventLines = events.length
    ? events.map(e => `<li>${eventLabels[e] || e}</li>`).join('')
    : '';

  const listStyle = 'padding-left:20px;margin:0 0 20px;color:#343434;line-height:1.8';
  const labelStyle = 'color:#aaa;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px';

  let bodyHtml;
  if (isYes) {
    bodyHtml = `<p style="color:#343434;font-size:1rem;margin:0 0 24px">${pick(
      "We've received your RSVP and can't wait to celebrate with you!",
      'Nous avons bien reçu votre réponse et avons hâte de vous voir&nbsp;!',
      '出欠を受け取りました。一緒にお祝いできるのを楽しみにしています。'
    )}</p>`
      + (eventLines ? `<p style="${labelStyle}">${pick('Events', 'Événements', '催し')}</p><ul style="${listStyle}">${eventLines}</ul>` : '')
      + (guestLines ? `<p style="${labelStyle}">${pick('Guests', 'Invités', 'ゲスト')}</p><ul style="${listStyle}">${guestLines}</ul>` : '');
  } else {
    bodyHtml = `<p style="color:#343434;font-size:1rem;margin:0 0 24px">${pick(
      "We're sorry you can't make it. You'll be missed!",
      'Nous sommes désolés que vous ne puissiez pas venir. Vous nous manquerez&nbsp;!',
      '来られないのは残念です。会えないのが寂しいです。'
    )}</p>`;
  }

  const subject = pick('Your RSVP — Norika & Antoine', 'Votre RSVP — Norika & Antoine', '出欠の確認 — Norika & Antoine');
  const editLabel = pick('Update your RSVP', 'Modifier votre RSVP', '出欠を変更する');
  const editNote  = pick('Need to make a change?', 'Vous avez changé d\'avis ?', '変更がありますか？');

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FEF7F1;font-family:Georgia,serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;padding:48px 40px;border-radius:4px">
    <h1 style="font-weight:300;color:#5c8a6a;font-size:2rem;margin:0 0 4px;letter-spacing:0.04em">Norika &amp; Antoine</h1>
    <p style="color:#aaa;margin:0 0 32px;font-size:0.85rem;letter-spacing:0.1em">${pick('August 14th, 2027', '14 août 2027', '2027年8月14日')} &middot; La Poterie</p>
    ${bodyHtml}
    <div style="border-top:1px solid #eee;margin:32px 0"></div>
    <p style="color:#aaa;font-size:0.85rem;margin:0">${editNote} <a href="${editUrl}" style="color:#5c8a6a">${editLabel}</a></p>
  </div>
</body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.FROM_EMAIL, to, subject, html }),
  });
}

/* ── Helpers ── */

function usesSheets(env) {
  return Boolean(env.GOOGLE_SHEET_ID && env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

function sheetId(env) {
  const raw = String(env.GOOGLE_SHEET_ID || '').trim();
  const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : raw;
}

function base64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToBinary(pem) {
  const b64 = String(pem)
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(env) {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExp) return cachedToken;

  const account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const iat = Math.floor(now / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = base64url(new TextEncoder().encode(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp: iat + 3600,
  })));
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Google sign-in failed');

  cachedToken = data.access_token;
  cachedTokenExp = now + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

async function sheets(env, path, init = {}) {
  const token = await getAccessToken(env);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId(env)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error?.message || text || 'Sheet request failed');
  return data;
}

async function ensureTab(env, title, headers) {
  const meta = await sheets(env, '?fields=sheets.properties');
  const tabs = meta.sheets || [];
  const titles = tabs.map(tab => tab.properties.title);
  if (!titles.includes(title)) {
    const onlyBlank = titles.length === 1 && titles[0] === 'Sheet1' && title === RSVP_SHEET;
    const requests = onlyBlank
      ? [{ updateSheetProperties: { properties: { sheetId: tabs[0].properties.sheetId, title }, fields: 'title' } }]
      : [{ addSheet: { properties: { title } } }];
    await sheets(env, ':batchUpdate', { method: 'POST', body: JSON.stringify({ requests }) });
  }

  const head = await sheets(env, `/values/${encodeURIComponent(title + '!1:1')}`);
  const first = (head.values && head.values[0]) || [];
  if (!first.some(Boolean)) {
    await sheets(env, `/values/${encodeURIComponent(title + '!A1')}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: [headers] }),
    });
  }
}

async function readRows(env, title, headers) {
  await ensureTab(env, title, headers);
  const data = await sheets(env, `/values/${encodeURIComponent(title)}`);
  return data.values || [];
}

function findRow(values, column, needle) {
  const want = String(needle || '').trim().toLowerCase();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][column] || '').trim().toLowerCase() === want) return i + 1;
  }
  return 0;
}

function rsvpFromRow(row) {
  return {
    submittedAt: row[0] || '',
    name:        row[1] || '',
    email:       row[2] || '',
    attending:   row[3] || '',
    events:      row[4] || '',
    guests:      row[5] || '',
    message:     row[6] || '',
    token:       row[7] || '',
  };
}

function rsvpToRow(record) {
  return [record.submittedAt, record.name, record.email, record.attending, record.events, record.guests, record.message, record.token];
}

async function findRsvp(env, key, value) {
  if (usesSheets(env)) {
    const rows = await readRows(env, RSVP_SHEET, RSVP_HEADERS);
    const column = key === 'token' ? 7 : 2;
    const rowNumber = findRow(rows, column, value);
    if (!rowNumber) return null;
    return { ...rsvpFromRow(rows[rowNumber - 1]), rowNumber };
  }
  return findRsvpInAirtable(env, key, value);
}

async function saveRsvp(env, record, existing) {
  if (usesSheets(env)) {
    const row = rsvpToRow(record);
    if (existing && existing.rowNumber) {
      await sheets(env, `/values/${encodeURIComponent(RSVP_SHEET + '!A' + existing.rowNumber)}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({ values: [row] }),
      });
      return;
    }
    await sheets(env, `/values/${encodeURIComponent(RSVP_SHEET)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    });
    return;
  }
  await saveRsvpInAirtable(env, record, existing);
}

async function saveNote(env, name, message) {
  if (usesSheets(env)) {
    await ensureTab(env, NOTES_SHEET, NOTE_HEADERS);
    await sheets(env, `/values/${encodeURIComponent(NOTES_SHEET)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: JSON.stringify({ values: [[new Date().toISOString(), name, message]] }),
    });
    return;
  }
  await saveNoteInAirtable(env, name, message);
}

async function findRsvpInAirtable(env, key, value) {
  const field = key === 'token' ? 'Token' : 'Email';
  const formula = `{${field}}="${String(value).replace(/"/g, '')}"`;
  const res = await fetch(
    `${airtableUrl(env)}?filterByFormula=${encodeURIComponent(formula)}`,
    { headers: airtableHeaders(env) }
  );
  const data = await res.json();
  if (!data.records || !data.records.length) return null;
  const record = data.records[0];
  const f = record.fields;
  return {
    id:          record.id,
    name:        f.Name || '',
    email:       f.Email || '',
    attending:   f.Attending || '',
    events:      f.Events || '',
    guests:      f.Guests || '',
    message:     f.Message || '',
    token:       f.Token || '',
  };
}

async function saveRsvpInAirtable(env, record, existing) {
  const fields = {
    Name:           record.name,
    Email:          record.email,
    Attending:      record.attending,
    Events:         record.events,
    Guests:         record.guests,
    Message:        record.message,
    Token:          record.token,
    'Submitted At': record.submittedAt,
  };
  const res = await fetch(existing ? `${airtableUrl(env)}/${existing.id}` : airtableUrl(env), {
    method: existing ? 'PATCH' : 'POST',
    headers: airtableHeaders(env),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function saveNoteInAirtable(env, name, message) {
  const res = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_REGISTRY_TABLE)}`,
    {
      method: 'POST',
      headers: airtableHeaders(env),
      body: JSON.stringify({ fields: { Name: name, Message: message, 'Submitted At': new Date().toISOString() } }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}

function airtableUrl(env) {
  return `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
}

function airtableHeaders(env) {
  return { Authorization: `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };
}

function cors(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
  });
}
