import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PropertyActions } from "@/components/PropertyActions";

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

  const formatValue = (val: number | null) => {
    if (!val) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const formatSqft = (val: number | null) => {
    if (!val) return "—";
    return val.toLocaleString("en-US") + " sqft";
  };

  const ownerName = property.owner_name
    || (property.raw_data as Record<string, unknown>)?.OWNER
    || null;

  const hasValues = property.market_value || property.land_value || property.improvement_value || property.total_appraised_value;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <Link href="/search" className="hover:text-white transition-colors">SEARCH</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">PROPERTY</span>
      </div>

      {/* Header */}
      <div className="border border-border bg-surface p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{property.address || "Property Record"}</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {[property.city, property.state, property.zip].filter(Boolean).join(", ")}
            </p>
            {property.county && (
              <p className="text-zinc-500 text-xs mt-1">
                <Link href={`/search?county=${encodeURIComponent(property.county)}&state=${encodeURIComponent(property.state || "")}`} className="hover:text-accent transition-colors">
                  {property.county} County
                </Link>
                {property.acct_number && <span className="ml-2">Acct: {property.acct_number}</span>}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Market Value</div>
            <div className="text-xl font-bold text-accent font-mono">
              {formatValue(property.market_value || property.estimated_value)}
            </div>
          </div>
        </div>
      </div>

      {/* Values Grid */}
      {hasValues && (
        <div className="border border-border bg-surface p-6 mb-4">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Valuation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Market Value</div>
              <div className="text-sm font-mono text-zinc-200">{formatValue(property.market_value)}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Land Value</div>
              <div className="text-sm font-mono text-zinc-200">{formatValue(property.land_value)}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Improvement Value</div>
              <div className="text-sm font-mono text-zinc-200">{formatValue(property.improvement_value)}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Total Appraised</div>
              <div className="text-sm font-mono text-zinc-200">{formatValue(property.total_appraised_value)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Parcel Details */}
      <div className="border border-border bg-surface p-6 mb-4">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Parcel Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Property Use</div>
            <div className="text-sm text-zinc-200">{property.property_use || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Lot Size</div>
            <div className="text-sm font-mono text-zinc-200">{formatSqft(property.lot_sqft)}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Building Size</div>
            <div className="text-sm font-mono text-zinc-200">{formatSqft(property.building_sqft)}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Year Built</div>
            <div className="text-sm font-mono text-zinc-200">{property.year_built || "—"}</div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="border border-border bg-surface p-6 mb-4">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Location</h2>
        {property.lat && property.lng ? (
          <div className="flex items-center gap-4">
            <div className="w-full h-32 bg-bg border border-border flex items-center justify-center">
              <span className="text-sm font-mono text-zinc-400">
                {Number(property.lat).toFixed(6)}, {Number(property.lng).toFixed(6)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Location: {property.county ? `${property.county} County` : "Unknown"} — coordinates pending
          </p>
        )}
      </div>

      {/* Owner */}
      <div className="border border-border bg-surface p-6 mb-4">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Ownership</h2>

        {ownerships && ownerships.length > 0 ? (
          <div className="space-y-3">
            {ownerships.map((o) => {
              const entity = ownerMap.get(o.entity_id);
              if (!entity) return null;
              return (
                <div key={o.entity_id} className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${entity.type === "Individual" ? "bg-purple" : "bg-amber"}`} />
                    <div>
                      <Link href={`/entity/${entity.id}`} className="text-sm text-white hover:text-accent transition-colors">
                        {entity.name}
                      </Link>
                      <div className="text-xs text-zinc-500">{entity.type}</div>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-zinc-400">{o.ownership_pct}%</div>
                </div>
              );
            })}
          </div>
        ) : ownerName ? (
          <p className="text-sm text-zinc-300">{ownerName as string}</p>
        ) : (
          <p className="text-sm text-zinc-600">No ownership records on file</p>
        )}
      </div>

      {/* Deed Info */}
      {property.deed_date && (
        <div className="border border-border bg-surface p-6 mb-4">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Deed Information</h2>
          <div className="text-sm text-zinc-300">
            Deed recorded: <span className="font-mono">{property.deed_date}</span>
          </div>
        </div>
      )}

      {/* Source strip */}
      <div className="flex items-center justify-between text-xs text-zinc-600 px-1 mb-6">
        <span>
          {property.cad_source && `Data source: ${property.cad_source}`}
          {property.appraisal_year && ` | Appraisal year: ${property.appraisal_year}`}
        </span>
        <span>ID: {property.id.slice(0, 8)}</span>
      </div>

      {/* Actions */}
      <PropertyActions
        propertyId={params.id}
        entityId={ownerships?.[0]?.entity_id}
      />
    </div>
  );
}
