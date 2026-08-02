/**
 * Wedding RSVP + Registry – Cloudflare Worker
 *
 * Environment variables (Worker Settings → Variables → add as Secrets):
 *   AIRTABLE_TOKEN    Airtable Personal Access Token
 *   AIRTABLE_BASE_ID  Airtable Base ID (appXXXX...)
 *   RESEND_API_KEY    Resend API key — get one free at resend.com (optional but needed for emails)
 *   FROM_EMAIL        Sender address verified in Resend, e.g. rsvp@yourdomain.com
 *   SITE_URL          Your wedding site URL, e.g. https://you.github.io/wedding
 *
 * Airtable tables:
 *   "RSVPs"        — Fields: Name, Email, Attending, Events, Guests, Message, Submitted At, Token
 *   "GiftMessages" — Fields: Name, Message, Submitted At  (create this table for registry notes)
 */

const AIRTABLE_TABLE          = 'RSVPs';
const AIRTABLE_REGISTRY_TABLE = 'GiftMessages';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);

    const url = new URL(request.url);

    if (url.pathname === '/registry') return handleRegistry(request, env);

    // GET /?token=... — retrieve existing RSVP so the form can pre-fill
    if (request.method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token) return cors(JSON.stringify({ error: 'Missing token' }), 400);

      const res = await fetch(
        `${airtableUrl(env)}?filterByFormula=${encodeURIComponent(`{Token}="${token}"`)}`,
        { headers: airtableHeaders(env) }
      );
      const data = await res.json();

      if (!data.records || data.records.length === 0) {
        return cors(JSON.stringify({ error: 'Not found' }), 404);
      }

      const f = data.records[0].fields;
      return cors(JSON.stringify({
        ok: true,
        rsvp: {
          name:      f.Name      || '',
          email:     f.Email     || '',
          attending: f.Attending || '',
          events:    f.Events    ? f.Events.split(', ').filter(Boolean) : [],
          guests:    f.Guests    || '',
          message:   f.Message   || '',
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

    // Look up existing record by email
    const searchRes = await fetch(
      `${airtableUrl(env)}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}`,
      { headers: airtableHeaders(env) }
    );
    const searchData = await searchRes.json();

    const isUpdate      = searchData.records && searchData.records.length > 0;
    const existingToken = isUpdate ? searchData.records[0].fields.Token : null;
    const token         = existingToken || crypto.randomUUID();

    const fields = {
      Name:           name,
      Email:          email,
      Attending:      attending || '',
      Events:         events.join(', '),
      Guests:         guests.map(g => g.dietary ? `${g.name} (${g.dietary})` : g.name).join('\n'),
      Message:        message,
      Token:          token,
      'Submitted At': new Date().toISOString(),
    };

    let saveRes;
    if (isUpdate) {
      saveRes = await fetch(`${airtableUrl(env)}/${searchData.records[0].id}`, {
        method: 'PATCH',
        headers: airtableHeaders(env),
        body: JSON.stringify({ fields }),
      });
    } else {
      saveRes = await fetch(airtableUrl(env), {
        method: 'POST',
        headers: airtableHeaders(env),
        body: JSON.stringify({ fields }),
      });
    }

    if (!saveRes.ok) {
      const detail = await saveRes.text();
      return cors(JSON.stringify({ error: 'Database error', detail }), 500);
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

  const fields = {
    Name:           name,
    Message:        message,
    'Submitted At': new Date().toISOString(),
  };

  const res = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_REGISTRY_TABLE)}`,
    {
      method: 'POST',
      headers: airtableHeaders(env),
      body: JSON.stringify({ fields }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    return cors(JSON.stringify({ error: 'Database error', detail }), 500);
  }

  return cors(JSON.stringify({ ok: true }), 200);
}

/* ── Email ── */

async function sendEmail({ env, to, name, attending, events, guests, token, lang }) {
  const editUrl = `${env.SITE_URL}?rsvp=${token}`;
  const isFr    = lang === 'fr';
  const isYes   = attending === 'yes';

  const eventLabels = {
    saturday: isFr ? 'Sam. 2 oct. — Apéro de bienvenue — Lieu à venir'    : 'Sat Oct 2 — Welcome drinks — Location TBA',
    sunday:   isFr ? 'Dim. 3 oct. — Mariage à la Brazilian Room'  : 'Sun Oct 3 — Wedding at the Brazilian Room',
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
    bodyHtml = (isFr
      ? `<p style="color:#343434;font-size:1rem;margin:0 0 24px">Nous avons bien reçu votre réponse et avons hâte de vous voir&nbsp;!</p>`
      : `<p style="color:#343434;font-size:1rem;margin:0 0 24px">We've received your RSVP and can't wait to celebrate with you!</p>`)
      + (eventLines ? `<p style="${labelStyle}">${isFr ? 'Événements' : 'Events'}</p><ul style="${listStyle}">${eventLines}</ul>` : '')
      + (guestLines ? `<p style="${labelStyle}">${isFr ? 'Invités' : 'Guests'}</p><ul style="${listStyle}">${guestLines}</ul>` : '');
  } else {
    bodyHtml = isFr
      ? `<p style="color:#343434;font-size:1rem;margin:0 0 24px">Nous sommes désolés que vous ne puissiez pas venir. Vous nous manquerez&nbsp;!</p>`
      : `<p style="color:#343434;font-size:1rem;margin:0 0 24px">We're sorry you can't make it. You'll be missed!</p>`;
  }

  const subject = isFr ? 'Votre RSVP — Norika & Antoine' : 'Your RSVP — Norika & Antoine';
  const editLabel = isFr ? 'Modifier votre RSVP' : 'Update your RSVP';
  const editNote  = isFr ? 'Vous avez changé d\'avis ?' : 'Need to make a change?';

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FEF7F1;font-family:Georgia,serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;padding:48px 40px;border-radius:4px">
    <h1 style="font-weight:300;color:#5c8a6a;font-size:2rem;margin:0 0 4px;letter-spacing:0.04em">Norika &amp; Antoine</h1>
    <p style="color:#aaa;margin:0 0 32px;font-size:0.85rem;letter-spacing:0.1em">October 3rd, 2027 &middot; Berkeley, CA</p>
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
