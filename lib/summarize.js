// lib/summarize.js
//
// Server-side only. Uses GROQ_API_KEY — must never reach the browser.
// Uses Groq's free tier (Llama 3.3 70B) — no credit card required, no
// service account setup, no billing console. Free limits are roughly
// 30 requests/minute and several thousand requests/day, which is far
// more than this site needs at ~8 summaries/day on a daily cron.
//
// This only ever runs on the scheduled cron job (not per visitor), so
// usage stays flat and well under the free quota regardless of traffic.

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write short, original summaries for a macro-financial markets brief.

This site covers ONLY macro market-moving news: oil and gold prices,
major stock indices (Nifty, Sensex, S&P 500, Dow, Nasdaq), central bank
rate decisions, inflation/GDP data, and currency moves. It does not
cover individual company news, earnings, IPOs, or non-financial topics.

Rules you must follow exactly:
- Write 1-2 plain sentences (max ~40 words) capturing the core fact of the story.
- Use entirely your own wording. Do not copy or closely mirror phrases from the input.
- State facts neutrally. No opinion, no speculation beyond what's given.
- Do not fabricate numbers, names, or details not present in the input.
- Where relevant, make the macro angle explicit (e.g. what it means for
  rates, oil, gold, or index direction) — but only using facts given,
  never invented context.
- Output ONLY the summary text. No preamble, no quotation marks, no labels.`;

async function summarizeOne(article) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in the environment.");
  }

  const userContent = [
    `Headline: ${article.title}`,
    article.rawDescription ? `Source note: ${article.rawDescription}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 120,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text || "Summary unavailable.";
}

/**
 * Summarizes a batch of articles sequentially (not parallel) to stay
 * gentle on rate limits during a single cron run.
 */
async function summarizeArticles(articles) {
  const results = [];
  for (const article of articles) {
    try {
      const summary = await summarizeOne(article);
      results.push({ ...article, summary });
    } catch (err) {
      // One failed summary shouldn't take down the whole refresh.
      // Fall back to the plain headline so the site still has content.
      console.error(`Summarization failed for "${article.title}":`, err.message);
      results.push({ ...article, summary: article.title });
    }
  }
  return results;
}

module.exports = { summarizeArticles };
