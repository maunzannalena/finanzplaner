import { NextResponse } from "next/server";

/**
 * Keep-alive ping for the Supabase free tier, which pauses a project after
 * 7 days without any API activity. Vercel calls this route once a day (see
 * vercel.json → crons); it performs one tiny read-only query through the
 * public REST API, which counts as activity. No data is ever written.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET env
 * var is set on the project; then only the cron may trigger it.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, reason: "supabase not configured (demo mode)" }, { status: 503 });
  }

  try {
    const res = await fetch(`${url}/rest/v1/settings?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const body = { ok: res.ok, status: res.status, at: new Date().toISOString() };
    return NextResponse.json(body, { status: res.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
