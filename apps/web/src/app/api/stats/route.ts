import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CORE_MARKETS = [
  { county: "Harris", state: "TX", label: "Harris TX (Houston)" },
  { county: "Travis", state: "TX", label: "Travis TX (Austin)" },
  { county: "Suffolk", state: "MA", label: "Suffolk MA (Boston)" },
];

export async function GET() {
  const [propertiesRes, signalsRes, marketsRes, ...countyRes] = await Promise.all([
    // properties_clean = verified real data only (migrated 2026-04-06)
    supabase.from("properties_clean").select("id", { count: "planned", head: true }),
    supabase.from("signals").select("id", { count: "planned", head: true }),
    supabase
      .from("properties_clean")
      .select("county, state, market_value")
      .not("county", "is", null)
      .gt("market_value", 0)
      .limit(50000),
    ...CORE_MARKETS.map((market) =>
      supabase
        .from("properties_clean")
        .select("id", { count: "planned", head: true })
        .eq("county", market.county)
        .eq("state", market.state),
    ),
  ]);

  // Aggregate markets
  const grouped = new Map<string, { county: string; state: string; count: number; total_value: number }>();
  for (const r of marketsRes.data ?? []) {
    const key = `${r.county}|${r.state}`;
    const g = grouped.get(key) || { county: r.county, state: r.state, count: 0, total_value: 0 };
    g.count++;
    g.total_value += r.market_value || 0;
    grouped.set(key, g);
  }

  const marketCards = Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const countyCounts = CORE_MARKETS.map((market, index) => ({
    ...market,
    count: countyRes[index]?.count ?? null,
  }));

  return NextResponse.json(
    {
      properties: propertiesRes.count ?? 0,
      markets: grouped.size,
      signals: signalsRes.count ?? 0,
      marketCards,
      countyCounts,
      source: "properties_clean",
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
