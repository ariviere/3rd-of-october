# Norika & Antoine — Wedding Website

A static wedding invitation site with password-gated access, bilingual content (EN/FR), and a fully serverless RSVP pipeline.

---

## Stack overview

| Layer | Service | Purpose |
|---|---|---|
| Hosting | GitHub Pages (or any static host) | Serves HTML/CSS/JS |
| RSVP API | Cloudflare Workers | Handles form submissions |
| Database | Airtable | Stores and manages RSVP records |
| Email | Resend | Sends confirmation emails to guests |

---

## How it works

### 1. Guest flow

1. Guest visits the site and enters the password to unlock it.
2. They fill out the RSVP form (name, email, attending, events, guests, note).
3. On submit, `rsvp.js` posts the data to the Cloudflare Worker endpoint.
4. The Worker saves the record to Airtable and triggers a confirmation email via Resend.
5. The email contains a unique link (`?rsvp=<token>`) that lets guests update their RSVP anytime.

### 2. RSVP updates

If a guest returns via their email link (`?rsvp=<token>`), the form pre-fills with their existing data. On resubmit the Worker finds the record by email and patches it instead of creating a duplicate.

### 3. Language

The site supports English and French. Language is selected via:
- `?lang=fr` / `?lang=en` query param (shareable link)
- The language toggle button in the nav
- Falls back to `localStorage` from a previous visit, then defaults to English

Confirmation emails are also sent in the guest's chosen language.

---

## Services setup

### Airtable

1. Create a free account at [airtable.com](https://airtable.com)
2. Create a base with a table named **`Table 1`** (or update `AIRTABLE_TABLE` in `worker.js`)
3. Add the following fields (all **Single line text** unless noted):
   - `Name`
   - `Email`
   - `Attending`
   - `Events`
   - `Guests` (Long text)
   - `Message` (Long text)
   - `Submitted At`
   - `Token`
4. Go to **Account → Developer Hub** → create a **Personal Access Token** with `data.records:read` and `data.records:write` scopes on your base
5. Copy your **Base ID** from the URL: `airtable.com/appXXXXXXXX/...`

### Cloudflare Workers

1. Create a free account at [cloudflare.com](https://cloudflare.com)
2. Go to **Workers & Pages → Create** → paste the contents of `worker.js`
3. Go to **Settings → Variables** and add the following **Secrets**:

| Secret | Value |
|---|---|
| `AIRTABLE_TOKEN` | Your Airtable Personal Access Token |
| `AIRTABLE_BASE_ID` | Your Airtable Base ID (`appXXXX...`) |
| `RESEND_API_KEY` | Your Resend API key |
| `FROM_EMAIL` | Verified sender address (e.g. `rsvp@yourdomain.com`) |
| `SITE_URL` | Your wedding site URL (e.g. `https://you.github.io/wedding`) |

4. Deploy — Cloudflare gives you a URL like `https://your-worker.your-subdomain.workers.dev`
5. Update the Worker URL in `rsvp.js`

### Resend

1. Create a free account at [resend.com](https://resend.com) (free tier: 3 000 emails/month)
2. Go to **Domains** → add and verify your domain (add the DNS records it provides)
3. Go to **API Keys** → create a key and copy it
4. Use a verified sender address as `FROM_EMAIL` (e.g. `rsvp@yourdomain.com`)

---

## Local development

The site is purely static. Start a local server with [live-server](https://github.com/tapio/live-server) (auto-reloads on file changes):

```bash
live-server
```

The RSVP form will hit the live Cloudflare Worker URL defined in `rsvp.js`. To test locally end-to-end, you can use [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```bash
npm install -g wrangler
wrangler dev worker.js
```

Then temporarily point `rsvp.js` at `http://localhost:8787`.

---

## File structure

```
index.html        Main page
styles.css        All styles (desktop + mobile responsive)
app.js            Language switching, password gate, hamburger menu, FAQ
rsvp.js           RSVP form logic (submit, pre-fill, validation)
translations.js   EN/FR string dictionaries
worker.js         Cloudflare Worker (Airtable + Resend integration)
images/           Photo assets
TODO.md           Project to-do list
```

---

## Password

The gate password is defined in `app.js` (`const CORRECT = '...'`). Change it before sharing the site.
