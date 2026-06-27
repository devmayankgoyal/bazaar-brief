// app/api/cron/route.js
//
// This is the ONLY endpoint on the entire site that triggers outbound
// API calls (to Currents + Groq). It is protected by a secret token
// so random visitors or bots can't spam it and burn through API quota.
//
// Vercel Cron calls this automatically on the schedule defined in
// vercel.json, attaching the CRON_SECRET as a bearer token.

import { run } from "../../../scripts/refresh-news";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — generous enough for ~8 sequential Claude calls

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await run();
    return Response.json({ ok: true, refreshedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[api/cron] refresh failed:", err);
    return Response.json({ ok: false, error: "Refresh failed" }, { status: 500 });
  }
}
