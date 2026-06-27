// scripts/refresh-news.js
//
// This is the ONLY place that talks to Currents API and Groq.
// Run on a schedule (Vercel Cron calls /api/cron, which calls this same
// logic) — never triggered by a visitor loading the page.
//
// Output: written to Vercel Blob storage at a fixed path, which the
// frontend reads on each page load. We use Blob (not a local file)
// because Vercel's serverless functions run on a read-only filesystem
// in production — writing to disk only works in local development.
// No database, no user input accepted anywhere.

const { put } = require("@vercel/blob");
const { fetchLatestFinanceNews } = require("../lib/fetchNews");
const { summarizeArticles } = require("../lib/summarize");

const BLOB_PATHNAME = "news.json";

async function run() {
  console.log("[refresh-news] starting fetch...");
  const articles = await fetchLatestFinanceNews({ limit: 8 });
  console.log(`[refresh-news] fetched ${articles.length} candidate articles`);

  console.log("[refresh-news] summarizing with Groq...");
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

  await put(BLOB_PATHNAME, JSON.stringify(payload, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  console.log(`[refresh-news] wrote ${payload.stories.length} stories to Blob storage`);
}

module.exports = { run, BLOB_PATHNAME };
