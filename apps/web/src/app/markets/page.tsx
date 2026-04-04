import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface MarketRow {
  county: string;
  state: string;
  count: number;
  avg_value: number;
  total_value: number;
}

export const revalidate = 3600;

export default async function MarketsPage() {
  const { data, error } = await supabase.rpc("get_market_stats").select("*");

  // Fallback: direct query if RPC doesn't exist
  let markets: MarketRow[] = [];
  if (error || !data) {
    const { data: raw } = await supabase
      .from("properties")
      .select("county, state, market_value")
      .not("county", "is", null)
      .gt("market_value", 0)
      .limit(50000);

    if (raw && raw.length > 0) {
      const grouped = new Map<string, { county: string; state: string; count: number; sum: number }>();
      for (const r of raw) {
        const key = `${r.county}|${r.state}`;
        const g = grouped.get(key) || { county: r.county, state: r.state, count: 0, sum: 0 };
        g.count++;
        g.sum += r.market_value || 0;
        grouped.set(key, g);
      }
      markets = Array.from(grouped.values())
        .map((g) => ({
          county: g.county,
          state: g.state,
          count: g.count,
          avg_value: g.count > 0 ? g.sum / g.count : 0,
          total_value: g.sum,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }
  } else {
    markets = data as MarketRow[];
  }

  const fmt = (val: number) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const fmtCount = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">MARKETS</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-1">Market Overview</h1>
      <p className="text-sm text-zinc-500 mb-8">
        County-level property intelligence across {markets.length} active markets
      </p>

      {markets.length > 0 ? (
        <div className="border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500 uppercase tracking-widest">
                <th className="text-left px-4 py-3">Market</th>
                <th className="text-right px-4 py-3">Properties</th>
                <th className="text-right px-4 py-3">Avg Value</th>
                <th className="text-right px-4 py-3">Total Estimated Value</th>
                <th className="text-right px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr key={`${m.county}-${m.state}`} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/search?county=${encodeURIComponent(m.county)}&state=${encodeURIComponent(m.state)}`}
                      className="text-white hover:text-accent transition-colors font-medium"
                    >
                      {m.county} County
                    </Link>
                    <span className="text-zinc-500 ml-2">{m.state}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300">
                    {fmtCount(m.count)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300">
                    {fmt(m.avg_value)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-accent">
                    {fmt(m.total_value)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs text-signal-green">
                      <span className="w-1.5 h-1.5 rounded-full bg-signal-green" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-border bg-surface p-8 text-center">
          <p className="text-zinc-500 text-sm">No market data available. Property records are being indexed.</p>
        </div>
      )}
    </div>
  );
}
