import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 300;

interface Signal {
  id: string;
  entity_id: string;
  signal_type: string;
  description: string;
  confidence: number;
  entity_name?: string;
}

export default async function SignalsPage() {
  const { data: signals } = await supabase
    .from("signals")
    .select("id, entity_id, signal_type, description, confidence")
    .order("confidence", { ascending: false });

  const enriched: Signal[] = [];
  if (signals && signals.length > 0) {
    const entityIds = Array.from(new Set(signals.map((s) => s.entity_id)));
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name")
      .in("id", entityIds);
    const entityMap = new Map(entities?.map((e) => [e.id, e.name]) ?? []);
    for (const s of signals) {
      enriched.push({ ...s, entity_name: entityMap.get(s.entity_id) ?? undefined });
    }
  }

  // Group by signal_type
  const grouped = new Map<string, Signal[]>();
  for (const s of enriched) {
    const group = grouped.get(s.signal_type) || [];
    group.push(s);
    grouped.set(s.signal_type, group);
  }

  const signalColor = (c: number) => {
    if (c >= 0.85) return "text-signal-red border-signal-red bg-signal-red/10";
    if (c >= 0.7) return "text-signal-amber border-signal-amber bg-signal-amber/10";
    return "text-signal-green border-signal-green bg-signal-green/10";
  };

  const confidenceBadge = (c: number) => {
    const pct = (c * 100).toFixed(0);
    if (c >= 0.85) return <span className="text-[10px] font-bold text-signal-red bg-signal-red/20 px-1.5 py-0.5">{pct}%</span>;
    if (c >= 0.7) return <span className="text-[10px] font-bold text-signal-amber bg-signal-amber/20 px-1.5 py-0.5">{pct}%</span>;
    return <span className="text-[10px] font-bold text-signal-green bg-signal-green/20 px-1.5 py-0.5">{pct}%</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">SIGNALS</span>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold tracking-tight">Signal Intelligence</h1>
        <span className="w-2 h-2 rounded-full bg-signal-red glow-pulse" />
      </div>
      <p className="text-sm text-zinc-500 mb-8">
        {enriched.length} active signals across {grouped.size} categories
      </p>

      {grouped.size > 0 ? (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([type, sigs]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {type.replace(/_/g, " ")}
                </h2>
                <span className="text-[10px] text-zinc-600">{sigs.length} signal{sigs.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {sigs.map((s) => (
                  <Link
                    key={s.id}
                    href={`/entity/${s.entity_id}`}
                    className={`block border p-4 transition-all hover:scale-[1.005] ${signalColor(s.confidence)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {confidenceBadge(s.confidence)}
                          {s.entity_name && (
                            <span className="text-xs text-zinc-400">{s.entity_name}</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300">{s.description}</p>
                      </div>
                      <span className="text-xs text-zinc-600 shrink-0">VIEW →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-surface p-8 text-center">
          <p className="text-zinc-500 text-sm">No signals detected. The system is monitoring for ownership anomalies and high-value activity.</p>
        </div>
      )}
    </div>
  );
}
