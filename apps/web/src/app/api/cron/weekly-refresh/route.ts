import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CORE_COUNTIES = [
  { county: "Harris", state: "TX", source: "HCAD" },
  { county: "Travis", state: "TX", source: "TCAD" },
  { county: "Suffolk", state: "MA", source: "Boston/Suffolk source index" },
];

async function countCounty(county: string, state: string) {
  const { count, error } = await supabase
    .from("properties_clean")
    .select("id", { count: "planned", head: true })
    .eq("county", county)
    .eq("state", state);

  return { count: count ?? 0, error: error?.message ?? null };
}

async function triggerWorker(runId: string) {
  const workerUrl = process.env.PROPERTYGRAPH_REFRESH_WORKER_URL;
  if (!workerUrl) {
    return {
      triggered: false,
      reason: "PROPERTYGRAPH_REFRESH_WORKER_URL is not configured",
    };
  }

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.PROPERTYGRAPH_REFRESH_WORKER_TOKEN
        ? { authorization: `Bearer ${process.env.PROPERTYGRAPH_REFRESH_WORKER_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      runId,
      cadence: "weekly",
      counties: CORE_COUNTIES,
    }),
  });

  if (!response.ok) {
    return {
      triggered: false,
      reason: `refresh worker returned ${response.status}`,
    };
  }

  return { triggered: true, reason: "refresh worker accepted weekly job" };
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, refused: true, reason: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, refused: true, reason: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const countyCounts = await Promise.all(
    CORE_COUNTIES.map(async (entry) => ({
      ...entry,
      ...(await countCounty(entry.county, entry.state)),
    })),
  );
  const totalIndexed = countyCounts.reduce((sum, entry) => sum + (entry.count ?? 0), 0);

  const { data: logRow } = await supabase
    .from("ingest_log")
    .insert({
      source: "propertygraph_weekly_refresh",
      county: "ALL",
      records_ingested: totalIndexed,
      status: "running",
    })
    .select("id")
    .single();

  const runId = logRow?.id || randomUUID();
  const worker = await triggerWorker(runId);
  const status = worker.triggered ? "triggered" : "refused";
  const completedAt = new Date().toISOString();

  await supabase
    .from("ingest_log")
    .update({
      completed_at: completedAt,
      status,
      error_msg: worker.triggered ? null : worker.reason,
    })
    .eq("id", runId);

  return NextResponse.json(
    {
      ok: worker.triggered,
      status,
      runId,
      cadence: "weekly",
      startedAt,
      completedAt,
      totalIndexed,
      countyCounts,
      worker,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
