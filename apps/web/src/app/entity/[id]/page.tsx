import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EntityPage({ params }: { params: { id: string } }) {
  const { data: entity } = await supabase
    .from("entities")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!entity) notFound();

  // Fetch properties via ownership_links
  const { data: ownerships } = await supabase
    .from("ownership_links")
    .select("property_id, ownership_pct")
    .eq("entity_id", params.id);

  const propertyIds = ownerships?.map((o) => o.property_id) ?? [];
  const { data: properties } = propertyIds.length > 0
    ? await supabase.from("properties").select("id, address, city, state, zip, estimated_value").in("id", propertyIds)
    : { data: [] };

  const pctMap = new Map(ownerships?.map((o) => [o.property_id, o.ownership_pct]) ?? []);

  // Fetch signals
  const { data: signals } = await supabase
    .from("signals")
    .select("*")
    .eq("entity_id", params.id);

  const totalValue = (properties ?? []).reduce((sum, p) => {
    const pct = pctMap.get(p.id) ?? 100;
    return sum + (p.estimated_value * pct / 100);
  }, 0);

  const formatValue = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const typeBadgeColor = (type: string) => {
    switch (type) {
      case "Individual": return "text-purple border-purple bg-purple/10";
      case "LLC": return "text-amber border-amber bg-amber/10";
      case "Trust": return "text-signal-green border-signal-green bg-signal-green/10";
      case "Corporation": return "text-accent border-accent bg-accent/10";
      default: return "text-zinc-400 border-zinc-600 bg-zinc-800";
    }
  };

  const signalColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-signal-red border-signal-red bg-signal-red/10";
    if (confidence >= 0.7) return "text-signal-amber border-signal-amber bg-signal-amber/10";
    return "text-signal-green border-signal-green bg-signal-green/10";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">ENTITY</span>
      </div>

      {/* Entity header */}
      <div className="border border-border bg-surface p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{entity.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] px-2 py-0.5 border uppercase tracking-widest ${typeBadgeColor(entity.type)}`}>
                {entity.type}
              </span>
              <span className="text-xs text-zinc-500">Registered: {entity.registered_state}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Portfolio Value</div>
            <div className="text-xl font-bold text-accent font-mono">{formatValue(totalValue)}</div>
            <div className="text-xs text-zinc-500">{properties?.length ?? 0} properties</div>
          </div>
        </div>
      </div>

      {/* Signals */}
      {signals && signals.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            Active Signals
            <span className="w-1.5 h-1.5 rounded-full bg-signal-red glow-pulse" />
          </h2>
          {signals.map((s) => (
            <div
              key={s.id}
              className={`border p-4 signal-badge ${signalColor(s.confidence)}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold">⚡ {s.signal_type.replace(/_/g, " ").toUpperCase()}</span>
                <span className="text-[10px] text-zinc-500">{(s.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-sm text-zinc-300">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Properties */}
      <div className="border border-border bg-surface p-6 mb-6">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Portfolio</h2>
        {properties && properties.length > 0 ? (
          <div className="space-y-2">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/property/${p.id}`}
                className="flex items-center justify-between py-2.5 px-3 border-b border-border/50 hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent" />
                  <div>
                    <div className="text-sm text-white">{p.address}</div>
                    <div className="text-xs text-zinc-500">{p.city}, {p.state} {p.zip}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-accent">{formatValue(p.estimated_value)}</div>
                  <div className="text-[10px] text-zinc-500">{pctMap.get(p.id)}% owned</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No properties linked</p>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/graph/${params.id}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-sm hover:bg-accent/20 transition-colors"
      >
        View Network Graph →
      </Link>
    </div>
  );
}
