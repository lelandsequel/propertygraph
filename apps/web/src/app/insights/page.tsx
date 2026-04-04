import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 3600;

interface EntityInsight {
  id: string;
  name: string;
  type: string;
  property_count: number;
  total_value: number;
  signal_count: number;
}

export default async function InsightsPage() {
  // Get entities with their portfolio stats
  const { data: links } = await supabase
    .from("ownership_links")
    .select("entity_id, property_id");

  const entities: EntityInsight[] = [];

  if (links && links.length > 0) {
    // Group by entity
    const entityPropertyMap = new Map<string, string[]>();
    for (const l of links) {
      const arr = entityPropertyMap.get(l.entity_id) || [];
      arr.push(l.property_id);
      entityPropertyMap.set(l.entity_id, arr);
    }

    const entityIds = Array.from(entityPropertyMap.keys());
    const propertyIds = Array.from(new Set(links.map((l) => l.property_id)));

    const [entitiesRes, propertiesRes, signalsRes] = await Promise.all([
      supabase.from("entities").select("id, name, type").in("id", entityIds),
      supabase.from("properties").select("id, market_value").in("id", propertyIds),
      supabase.from("signals").select("entity_id").in("entity_id", entityIds),
    ]);

    const propertyValueMap = new Map<string, number>();
    for (const p of propertiesRes.data ?? []) {
      propertyValueMap.set(p.id, p.market_value || 0);
    }

    const signalCountMap = new Map<string, number>();
    for (const s of signalsRes.data ?? []) {
      signalCountMap.set(s.entity_id, (signalCountMap.get(s.entity_id) || 0) + 1);
    }

    const entityInfoMap = new Map((entitiesRes.data ?? []).map((e) => [e.id, e]));

    for (const [entityId, propIds] of Array.from(entityPropertyMap.entries())) {
      const info = entityInfoMap.get(entityId);
      if (!info) continue;
      const totalValue = propIds.reduce((sum, pid) => sum + (propertyValueMap.get(pid) || 0), 0);
      entities.push({
        id: entityId,
        name: info.name,
        type: info.type,
        property_count: propIds.length,
        total_value: totalValue,
        signal_count: signalCountMap.get(entityId) || 0,
      });
    }

    entities.sort((a, b) => b.total_value - a.total_value);
  }

  const fmt = (val: number) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Individual: "text-purple bg-purple/10",
      LLC: "text-amber bg-amber/10",
      Trust: "text-signal-green bg-signal-green/10",
      Corporation: "text-accent bg-accent/10",
    };
    return colors[type] || "text-zinc-400 bg-zinc-400/10";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">INSIGHTS</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-1">Acquisition Intelligence</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Top ownership concentrations ranked by estimated exposure
      </p>

      {entities.length > 0 ? (
        <div className="border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500 uppercase tracking-widest">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">Entity</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Properties</th>
                <th className="text-right px-4 py-3">Est. Exposure</th>
                <th className="text-right px-4 py-3">Signals</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e, i) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                  <td className="px-4 py-3 text-zinc-600 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/entity/${e.id}`}
                      className="text-white hover:text-accent transition-colors font-medium"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${typeBadge(e.type)}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300">{e.property_count}</td>
                  <td className="px-4 py-3 text-right font-mono text-accent">{fmt(e.total_value)}</td>
                  <td className="px-4 py-3 text-right">
                    {e.signal_count > 0 ? (
                      <span className="text-signal-red text-xs font-mono">{e.signal_count} active</span>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-border bg-surface p-8 text-center">
          <p className="text-zinc-500 text-sm">No ownership data linked yet. Entity-property relationships are being mapped.</p>
        </div>
      )}
    </div>
  );
}
