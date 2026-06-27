// scripts/refresh-news.js
//
// This is the ONLY place that talks to Currents API and Claude.
// Run on a schedule (Vercel Cron calls /api/cron, which calls this same
// logic) — never triggered by a visitor loading the page.
//
// Output: data/news.json — a static file the frontend reads. No database,
// no live API calls from the browser, no user input accepted anywhere.

const fs = require("fs");
const path = require("path");
const { fetchLatestFinanceNews } = require("../lib/fetchNews");
const { summarizeArticles } = require("../lib/summarize");

const OUTPUT_PATH = path.join(__dirname, "..", "data", "news.json");

async function run() {
  console.log("[refresh-news] starting fetch...");
  const articles = await fetchLatestFinanceNews({ limit: 8 });
  console.log(`[refresh-news] fetched ${articles.length} candidate articles`);

  console.log("[refresh-news] summarizing with Claude...");
  const summarized = await summarizeArticles(articles);

  const payload = {
    updatedAt: new Date().toISOString(),
    stories: summarized.map((a) => ({
      title: a.title,
      summary: a.summary,
      category: a.category,
      sourceName: a.sourceName,
      sourceUrl: a.sourceUrl,
      publishedAt: a.publishedAt,
    })),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`[refresh-news] wrote ${payload.stories.length} stories to ${OUTPUT_PATH}`);
}

// Allow running directly (npm run refresh-news) and also being imported
// by the API route handler.
if (require.main === module) {
  run().catch((err) => {
    console.error("[refresh-news] FAILED:", err);
    process.exit(1);
  });
}

module.exports = { run };
