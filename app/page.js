import fs from "fs";
import path from "path";

export const revalidate = 0; // always read the latest written file, no Next.js page cache

function loadNews() {
  const filePath = path.join(process.cwd(), "data", "news.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function timeAgo(isoString) {
  if (!isoString) return "";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr ago`;
}

function formatSyncTime(isoString) {
  if (!isoString) return "not yet synced";
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }) + " IST";
}

export default function HomePage() {
  const news = loadNews();
  const stories = news?.stories || [];
  const [lead, ...rest] = stories;

  return (
    <main
      style={{
        background: "var(--ink-bg)",
        maxWidth: 760,
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 24px",
          borderBottom: "1px solid var(--gold-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 19,
              fontWeight: 500,
              color: "var(--text-headline)",
              letterSpacing: "0.3px",
            }}
          >
            Bazaar Brief
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--gold)",
              border: "0.5px solid var(--gold-hairline)",
              borderRadius: 3,
              padding: "2px 6px",
            }}
          >
            BETA
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--market-green)",
              display: "inline-block",
            }}
          />
          synced {formatSyncTime(news?.updatedAt)}
        </div>
      </header>

      <nav
        style={{
          padding: "4px 24px",
          borderBottom: "1px solid rgba(201,160,78,0.15)",
          display: "flex",
          gap: 20,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-muted)",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            padding: "8px 0",
            color: "var(--gold)",
            borderBottom: "1.5px solid var(--gold)",
          }}
        >
          top stories
        </span>
        <span style={{ padding: "8px 0" }}>indices</span>
        <span style={{ padding: "8px 0" }}>oil &amp; gold</span>
        <span style={{ padding: "8px 0" }}>rates &amp; inflation</span>
        <span style={{ padding: "8px 0" }}>currencies</span>
      </nav>

      {!lead && (
        <div style={{ padding: "40px 24px", color: "var(--text-muted)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7 }}>
            No macro-moving stories in the latest cycle. This brief only
            shows news that affects oil, gold, major indices, rates, or
            currencies — quieter news days mean fewer or no stories here.
            Check back at the next refresh.
          </p>
        </div>
      )}

      {lead && (
        <section style={{ padding: "20px 24px 8px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "1px",
                color: "var(--gold)",
                textTransform: "uppercase",
              }}
            >
              Lead story
            </span>
            <span
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}
            >
              {lead.sourceName} · {timeAgo(lead.publishedAt)}
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--text-headline)",
              margin: "6px 0 8px",
              lineHeight: 1.3,
            }}
          >
            {lead.title}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-body)",
              lineHeight: 1.6,
              margin: "0 0 10px",
              maxWidth: 560,
            }}
          >
            {lead.summary}
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-muted)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                borderRadius: 3,
                padding: "2px 7px",
              }}
            >
              AI summary
            </span>
            <a
              href={lead.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}
            >
              Read original ↗
            </a>
          </div>
        </section>
      )}

      {lead && <div style={{ borderTop: "1px solid var(--hairline)", margin: "16px 24px 0" }} />}

      <section style={{ padding: "4px 24px 8px" }}>
        {rest.map((story, i) => (
          <div
            key={story.sourceUrl || i}
            style={{
              padding: "14px 0",
              borderBottom: i < rest.length - 1 ? "1px solid var(--hairline)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.5px",
                  color: "#8fa3d6",
                  textTransform: "uppercase",
                }}
              >
                {story.category || "Macro"}
              </span>
              <span
                style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}
              >
                {story.sourceName} · {timeAgo(story.publishedAt)}
              </span>
            </div>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 16,
                fontWeight: 500,
                color: "#edeae0",
                margin: "0 0 6px",
                lineHeight: 1.4,
              }}
            >
              {story.title}
            </h3>
            <p style={{ fontSize: 13, color: "#9aa1b0", lineHeight: 1.6, margin: "0 0 6px" }}>
              {story.summary}
            </p>
            <a
              href={story.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none" }}
            >
              Read original ↗
            </a>
          </div>
        ))}
      </section>

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 24px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-faint)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          marginTop: 4,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>summaries generated by AI · not a substitute for the original report</span>
        <span>refreshes every 30 min</span>
      </footer>
    </main>
  );
}
