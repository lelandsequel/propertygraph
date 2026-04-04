"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWatchlist } from "@/lib/watchlist";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  market_value: number;
  property_use: string;
}

export default function WatchlistPage() {
  const { ids, remove } = useWatchlist();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    // Fetch properties by IDs via search API workaround — or direct fetch
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        setProperties(data.properties ?? []);
      } catch {
        setProperties([]);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [ids]);

  const fmt = (val: number) => {
    if (!val) return "—";
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">WATCHLIST</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-1">Watchlist</h1>
      <p className="text-sm text-zinc-500 mb-8">
        {ids.length} {ids.length === 1 ? "property" : "properties"} saved locally
      </p>

      {loading ? (
        <div className="text-zinc-500 text-sm py-8 text-center">Loading watchlist...</div>
      ) : ids.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-center">
          <p className="text-zinc-400 text-sm mb-2">No properties saved yet.</p>
          <p className="text-zinc-500 text-xs mb-4">Add properties to your watchlist from any property detail page.</p>
          <Link href="/search" className="text-accent text-sm hover:underline">Search properties →</Link>
        </div>
      ) : (
        <div className="border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500 uppercase tracking-widest">
                <th className="text-left px-4 py-3">Address</th>
                <th className="text-left px-4 py-3">City / County</th>
                <th className="text-left px-4 py-3">Use</th>
                <th className="text-right px-4 py-3">Value</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/property/${p.id}`} className="text-white hover:text-accent transition-colors">
                      {p.address || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {[p.city, p.county ? `${p.county} Co.` : null].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {p.property_use || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-accent">
                    {fmt(p.market_value)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(p.id)}
                      className="text-xs text-zinc-600 hover:text-signal-red transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
