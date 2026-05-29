import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_TABLES = new Set(["properties", "properties_clean", "entities", "signals"]);
const FALLBACK_SUPABASE_URL = "https://bkeixpzvoilaibnfkzvl.supabase.co";
const MAX_LIMIT = 1000;

const TABLE_COLUMNS: Record<string, Set<string>> = {
  properties: new Set([
    "id",
    "address",
    "city",
    "county",
    "state",
    "lat",
    "lng",
    "total_appraised_value",
    "land_value",
    "improvement_value",
    "owner_name",
    "property_use",
    "year_built",
    "cad_source",
    "acct_number",
    "raw_data",
  ]),
  properties_clean: new Set([
    "id",
    "address",
    "city",
    "county",
    "state",
    "zip",
    "lat",
    "lng",
    "market_value",
    "estimated_value",
    "total_appraised_value",
    "land_value",
    "improvement_value",
    "owner_name",
    "property_use",
    "year_built",
    "raw_data",
  ]),
  entities: new Set(["id", "name", "type"]),
  signals: new Set(["id", "property_id", "signal_type", "score", "verdict", "created_at"]),
};

function normalizeSelect(table: string, select: string | null) {
  const allowed = TABLE_COLUMNS[table];
  if (!select) return Array.from(allowed).join(",");

  const columns = select.split(",").map((column) => column.trim()).filter(Boolean);
  const hasUnsafeShape = columns.some((column) => !/^[a-zA-Z0-9_]+$/.test(column));
  if (hasUnsafeShape || columns.some((column) => !allowed.has(column))) return null;

  return columns.join(",");
}

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL).replace(/\/$/, "");
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

export async function GET(req: NextRequest, { params }: { params: { table: string } }) {
  const table = params.table;
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Unsupported PropertyGraph table" }, { status: 404 });
  }

  const key = getSupabaseKey();
  if (!key) {
    return NextResponse.json({ error: "PropertyGraph data layer is not configured" }, { status: 500 });
  }

  const safeSelect = normalizeSelect(table, req.nextUrl.searchParams.get("select"));
  if (!safeSelect) {
    return NextResponse.json({ error: "Unsupported PropertyGraph column selection" }, { status: 400 });
  }

  const upstream = new URL(`${getSupabaseUrl()}/rest/v1/${table}`);
  req.nextUrl.searchParams.forEach((value, name) => {
    if (name === "select") return;
    if (name === "limit") {
      const limit = Math.min(Math.max(Number(value) || 100, 1), MAX_LIMIT);
      upstream.searchParams.set(name, String(limit));
      return;
    }
    upstream.searchParams.set(name, value);
  });
  upstream.searchParams.set("select", safeSelect);
  if (!upstream.searchParams.has("limit")) upstream.searchParams.set("limit", "100");

  const res = await fetch(upstream, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
    },
    next: { revalidate: 60 },
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
      "cache-control": "public, max-age=30, stale-while-revalidate=120",
    },
  });
}
