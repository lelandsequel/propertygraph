import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!property) notFound();

  const { data: ownerships } = await supabase
    .from("ownership_links")
    .select("entity_id, ownership_pct")
    .eq("property_id", params.id);

  const entityIds = ownerships?.map((o) => o.entity_id) ?? [];
  const { data: entities } = entityIds.length > 0
    ? await supabase.from("entities").select("id, name, type").in("id", entityIds)
    : { data: [] };

  const ownerMap = new Map(entities?.map((e) => [e.id, e]) ?? []);

  const formatValue = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">PROPERTY</span>
      </div>

      {/* Property card */}
      <div className="border border-border bg-surface p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{property.address}</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Est. Value</div>
            <div className="text-xl font-bold text-accent font-mono">
              {formatValue(property.estimated_value)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Coordinates</div>
            <div className="text-sm font-mono text-zinc-300">
              {property.lat.toFixed(4)}, {property.lng.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">ZIP Code</div>
            <div className="text-sm font-mono text-zinc-300">{property.zip}</div>
          </div>
        </div>
      </div>

      {/* Ownership */}
      <div className="border border-border bg-surface p-6">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Ownership</h2>
        {ownerships && ownerships.length > 0 ? (
          <div className="space-y-3">
            {ownerships.map((o) => {
              const entity = ownerMap.get(o.entity_id);
              if (!entity) return null;
              return (
                <div key={o.entity_id} className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 ${entity.type === "Individual" ? "bg-purple" : "bg-amber"}`}
                    />
                    <div>
                      <Link
                        href={`/entity/${entity.id}`}
                        className="text-sm text-white hover:text-accent transition-colors"
                      >
                        {entity.name}
                      </Link>
                      <div className="text-xs text-zinc-500">{entity.type}</div>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-zinc-400">
                    {o.ownership_pct}%
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No ownership records found</p>
        )}

        {ownerships && ownerships.length > 0 && (
          <Link
            href={`/graph/${ownerships[0].entity_id}`}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-sm hover:bg-accent/20 transition-colors"
          >
            View Ownership Graph →
          </Link>
        )}
      </div>
    </div>
  );
}
