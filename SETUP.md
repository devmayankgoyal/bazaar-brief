# Bazaar Brief — setup guide

A static business/finance news site. Headlines come from Currents API
(free), summaries are written by Groq (free), and the whole thing
refreshes once a day on a schedule — never on a visitor's request.

**Note on refresh frequency:** Vercel's free Hobby plan only allows
cron jobs to run once per day (Pro plans allow more frequent
schedules). This site runs its refresh daily at 6:00 AM UTC (11:30 AM
IST) — see `vercel.json` if you want to change the time.

## Why it's secure

- **No SQL/NoSQL database.** The site stores one JSON file in Vercel
  Blob storage (simple file storage, not a queryable database).
  Nothing is written by visitors, so there's no injection surface.
- **No API keys in the browser.** Currents API and Groq are only ever
  called from `scripts/refresh-news.js`, which runs on Vercel's
  servers, never in anyone's browser.
- **One controlled endpoint.** `/api/cron` is the only route that can
  trigger outbound API calls, and it's locked behind a secret token
  (`CRON_SECRET`) that only you and Vercel's scheduler know.
- **Fixed request volume.** Because refreshes run on a timer (once a
  day) rather than per visitor, your API usage is the same whether you
  get 1 visitor or 100,000 — there's no way for traffic (or an
  attacker hitting refresh) to burn through your free API quota.
- **Security headers** are set in `next.config.js` to block clickjacking
  and other common browser-based attacks.

## Step-by-step setup

### 1. Get your two free API keys

**Currents API (free, headlines):**
1. Go to https://currentsapi.services/en and sign up — no credit card needed.
2. Copy your API key from the dashboard.

**Groq API (free, summaries):**
1. Go to https://console.groq.com
2. Sign up with email or a Google account — no credit card, no
   service account setup needed.
3. Click "API Keys" in the console, then "Create API Key".
4. Copy the key (starts with `gsk_...`).

Groq's free tier gives roughly 30 requests/minute. At a once-daily
refresh pulling ~8 stories per run, this site uses a tiny fraction of
that — far within the free quota.

### 2. Put the project on GitHub

1. Create a free GitHub account if you don't have one: https://github.com
2. Create a new repository (e.g. `bazaar-brief`).
3. Upload all the project files into it (GitHub's web interface has an
   "upload files" button — you can drag the whole folder in, no command
   line needed).

### 3. Deploy on Vercel (free)

1. Go to https://vercel.com and sign up using your GitHub account.
2. Click "Add New Project" and select your `bazaar-brief` repository.
3. Before clicking deploy, open the "Environment Variables" section and add:
   - `CURRENTS_API_KEY` → paste your Currents key
   - `GROQ_API_KEY` → paste your Groq key
   - `CRON_SECRET` → make up a long random password (e.g. mash your
     keyboard for 30+ characters, or ask any password generator site)
4. Click Deploy.

Vercel will automatically read `vercel.json` and set up the daily
schedule for you — no extra steps needed.

### 4. Create a Blob store (free, required)

The site stores its fetched headlines in Vercel Blob storage instead
of a local file, since Vercel's servers don't allow writing files to
disk in production. This is still not a database — just simple file
storage, included free on the Hobby plan.

1. In your Vercel project, click the "Storage" tab.
2. Click "Create Database" → select "Blob" → "Continue".
3. Give it any name (e.g. `bazaar-brief-storage`) → "Create".
4. When asked which project to connect it to, select `bazaar-brief`.

This automatically adds a `BLOB_READ_WRITE_TOKEN` environment variable
to your project — you don't need to copy or type anything.

5. Go to Deployments → "..." on the latest deployment → Redeploy, so
   the new environment variable takes effect.

### 5. Trigger the first refresh

Your site will be empty until the first refresh runs. Vercel Cron will
fire automatically at the next scheduled time (6:00 AM UTC / 11:30 AM
IST), but to see content immediately:

1. In your Vercel project, go to Settings → Cron Jobs, find `/api/cron`,
   and click "Run now" (Vercel's dashboard supports manually triggering
   a cron job).
2. Refresh your live site URL — stories should appear.

## Day-to-day

You don't need to do anything. The site refreshes itself once a day
automatically. If you ever want to change the time it refreshes, edit
the `schedule` line in `vercel.json` (standard cron syntax, e.g.
`0 6 * * *` = 6:00 AM UTC daily). Hobby/free accounts are limited to
once-daily cron jobs — more frequent schedules require Vercel Pro.

## Cost expectations

- Currents API: free tier, no card required.
- Groq API: free tier, no card required, no service account setup.
  At a once-daily refresh (~8 summaries/day) you stay far under the
  free rate limits.
- Vercel hosting: free tier comfortably covers a small personal site.

This setup has effectively zero running cost for a pilot. If you
later want higher-quality summaries at scale, you can swap in a paid
model (Claude or GPT) later — only `lib/summarize.js` would need to
change; nothing else in the architecture depends on which AI you use.

## If something breaks

Check Vercel's "Logs" tab for your project — errors from the refresh
script (e.g. an expired API key) will show up there with a clear
message, and the site will keep serving the last successful data
rather than going blank.
