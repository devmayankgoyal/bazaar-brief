# Bazaar Brief — setup guide

A static business/finance news site. Headlines come from Currents API
(free), summaries are written by Claude, and the whole thing refreshes
every 30 minutes on a schedule — never on a visitor's request.

## Why it's secure

- **No database.** The site reads one file, `data/news.json`. Nothing
  is written by visitors, so there's no SQL/NoSQL injection surface.
- **No API keys in the browser.** Currents API and the Claude API are
  only ever called from `scripts/refresh-news.js`, which runs on
  Vercel's servers, never in anyone's browser.
- **One controlled endpoint.** `/api/cron` is the only route that can
  trigger outbound API calls, and it's locked behind a secret token
  (`CRON_SECRET`) that only you and Vercel's scheduler know.
- **Fixed request volume.** Because refreshes run on a timer (every 30
  min) rather than per visitor, your API usage is the same whether you
  get 1 visitor or 100,000 — there's no way for traffic (or an
  attacker hitting refresh) to burn through your free API quota.
- **Security headers** are set in `next.config.js` to block clickjacking
  and other common browser-based attacks.

## Step-by-step setup

### 1. Get your two free API keys

**Currents API (free, headlines):**
1. Go to https://currentsapi.services/en and sign up — no credit card needed.
2. Copy your API key from the dashboard.

**Google Gemini API (free, summaries):**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account and click "Create API key" — no credit
   card needed.
3. Copy the key.

This gives you 1,500 free requests/day, no expiry. At a 30-minute
refresh schedule pulling ~8 stories per run, this site uses roughly
384 requests/day — well within the free quota with room to spare.

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
   - `GEMINI_API_KEY` → paste your Gemini key
   - `CRON_SECRET` → make up a long random password (e.g. mash your
     keyboard for 30+ characters, or ask any password generator site)
4. Click Deploy.

Vercel will automatically read `vercel.json` and set up the 30-minute
schedule for you — no extra steps needed.

### 4. Trigger the first refresh

Your site will be empty until the first refresh runs. Vercel Cron will
fire automatically within the first 30 minutes, but to see content
immediately:

1. In your Vercel project, go to Settings → Cron Jobs, find `/api/cron`,
   and click "Run now" (Vercel's dashboard supports manually triggering
   a cron job).
2. Refresh your live site URL — stories should appear.

## Day-to-day

You don't need to do anything. The site refreshes itself every 30
minutes. If you ever want to change the refresh frequency, edit the
`schedule` line in `vercel.json` (it uses standard cron syntax).

## Cost expectations

- Currents API: free tier, no card required.
- Gemini API: free tier, no card required. At a 30-min refresh
  schedule (~384 summaries/day) you stay well under the 1,500/day
  free quota — total cost is $0 for a pilot at this scale.
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
