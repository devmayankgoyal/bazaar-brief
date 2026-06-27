// lib/fetchNews.js
//
// Server-side only. Never import this into a client component —
// it uses CURRENTS_API_KEY, which must stay off the browser entirely.

const CURRENTS_ENDPOINT = "https://api.currentsapi.services/v1/latest-news";

// This site covers ONLY macro/market-moving financial news — the kind
// of thing that actually moves oil, gold, major indices, or currencies.
// It does NOT cover: individual company earnings, M&A, startup funding,
// IPOs of single companies, social/political reform, crime, or fashion.
//
// MACRO_KEYWORDS: at least one of these must appear for a story to pass.
const MACRO_KEYWORDS = [
  // Commodities
  "oil price", "crude oil", "brent", "wti", "opec", "gold price", "gold rallies",
  "gold falls", "natural gas price", "commodity prices",
  // Indices / markets (broad market moves, not single-stock moves)
  "sensex", "nifty", "s&p 500", "sp500", "dow jones", "nasdaq", "ftse",
  "stock market", "share market", "market crash", "market rally", "bear market",
  "bull market", "global markets", "wall street",
  // Central banks / monetary policy
  "federal reserve", "fed rate", "interest rate", "rbi", "ecb", "rate hike",
  "rate cut", "monetary policy", "repo rate", "central bank",
  // Macro data / indicators
  "inflation", "cpi data", "gdp growth", "gdp data", "unemployment rate",
  "jobs report", "trade deficit", "trade surplus", "current account",
  "fiscal deficit", "recession",
  // Currencies
  "rupee", "dollar index", "currency market", "forex", "yen weakens",
  "euro falls", "exchange rate",
  // Geopolitical/supply shocks that move macro markets
  "oil supply", "sanctions on oil", "opec+ cuts", "supply chain disruption",
];

// EXCLUDE_KEYWORDS: if any of these appear, drop the story even if a
// macro keyword matched — keeps out single-company news, social/crime
// topics, and other non-macro noise that uses similar vocabulary.
const EXCLUDE_KEYWORDS = [
  "earnings", "quarterly results", "q1 results", "q2 results", "q3 results",
  "q4 results", "ipo", "merger", "acquisition", "startup", "funding round",
  "ceo", "layoffs at", "lawsuit", "arrested", "crime", "murder", "celebrity",
  "fashion", "wedding", "election campaign", "protest",
];

function looksRelevant(article) {
  const haystack = `${article.title} ${article.description || ""}`.toLowerCase();
  const hasMacroSignal = MACRO_KEYWORDS.some((kw) => haystack.includes(kw));
  if (!hasMacroSignal) return false;
  const hasExcludedSignal = EXCLUDE_KEYWORDS.some((kw) => haystack.includes(kw));
  return !hasExcludedSignal;
}

// Tags a story with a display category based on which keyword bucket
// matched. Order matters — checked top to bottom, first match wins.
const CATEGORY_BUCKETS = [
  { label: "Oil & Gold", keywords: ["oil", "crude", "brent", "wti", "opec", "gold", "natural gas", "commodity"] },
  { label: "Rates & Inflation", keywords: ["fed", "rbi", "ecb", "rate", "inflation", "cpi", "gdp", "monetary policy", "recession", "unemployment", "jobs report", "deficit"] },
  { label: "Currencies", keywords: ["rupee", "dollar", "currency", "forex", "yen", "euro", "exchange rate"] },
  { label: "Indices", keywords: ["sensex", "nifty", "s&p", "sp500", "dow", "nasdaq", "ftse", "stock market", "share market", "wall street", "market crash", "market rally", "bull market", "bear market"] },
];

function categorize(article) {
  const haystack = `${article.title} ${article.description || ""}`.toLowerCase();
  for (const bucket of CATEGORY_BUCKETS) {
    if (bucket.keywords.some((kw) => haystack.includes(kw))) return bucket.label;
  }
  return "Macro";
}

/**
 * Fetches latest headlines from Currents API and filters down to
 * macro-financial stories only (oil, gold, indices, rates, inflation,
 * currencies). Returns a normalized array:
 * { title, rawDescription, sourceUrl, sourceName, publishedAt, category }
 *
 * Pulls from two angles and merges them, since macro stories don't
 * always land neatly in the "business" category on an aggregator:
 *   1. The "business" category feed (broad candidate pool)
 *   2. A direct keyword search for "oil OR gold OR inflation OR
 *      interest rate" (catches macro stories tagged under other
 *      categories, e.g. "world" or "politics")
 *
 * If fewer than `limit` macro stories are found after filtering,
 * returns however many passed rather than backfilling with off-topic
 * stories — a quiet macro day means a shorter front page, not a
 * diluted one.
 *
 * Throws on network/HTTP failure — caller decides fallback behavior
 * (e.g. keep serving last-known-good data.json rather than crash the site).
 */
async function fetchLatestFinanceNews({ limit = 8 } = {}) {
  const apiKey = process.env.CURRENTS_API_KEY;
  if (!apiKey) {
    throw new Error("CURRENTS_API_KEY is not set in the environment.");
  }

  const categoryUrl = new URL(CURRENTS_ENDPOINT);
  categoryUrl.searchParams.set("apiKey", apiKey);
  categoryUrl.searchParams.set("category", "business");
  categoryUrl.searchParams.set("language", "en");

  const searchUrl = new URL("https://api.currentsapi.services/v1/search");
  searchUrl.searchParams.set("apiKey", apiKey);
  searchUrl.searchParams.set("language", "en");
  searchUrl.searchParams.set(
    "keywords",
    "oil price OR gold price OR inflation OR interest rate OR federal reserve OR stock market"
  );

  const fetchJson = async (url) => {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Currents API request failed: ${res.status} ${body}`);
    }
    return res.json();
  };

  // Run both pulls. If the search endpoint fails for any reason, fall
  // back to category results alone rather than failing the whole refresh.
  const [categoryData, searchData] = await Promise.all([
    fetchJson(categoryUrl),
    fetchJson(searchUrl).catch((err) => {
      console.error("[fetchNews] keyword search pull failed, continuing with category feed only:", err.message);
      return { news: [] };
    }),
  ]);

  const categoryArticles = Array.isArray(categoryData.news) ? categoryData.news : [];
  const searchArticles = Array.isArray(searchData.news) ? searchData.news : [];

  // Merge and de-dupe by URL.
  const seen = new Set();
  const merged = [...categoryArticles, ...searchArticles].filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  const macroOnly = merged.filter(looksRelevant);
  const chosen = macroOnly.slice(0, limit);

  return chosen.map((a) => ({
    title: a.title?.trim() || "Untitled",
    // We intentionally do NOT store/forward full article body text anywhere.
    // Only title + a short author-provided description (if present) go to
    // the summarizer as raw material — never rendered directly on the site.
    rawDescription: a.description?.trim() || "",
    sourceUrl: a.url,
    sourceName: a.author || new URL(a.url).hostname.replace(/^www\./, ""),
    publishedAt: a.published,
    category: categorize(a),
  }));
}

module.exports = { fetchLatestFinanceNews };
