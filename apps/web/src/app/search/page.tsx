"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  property_use: string;
  market_value: number;
  year_built: number | null;
  owner_name: string | null;
}

interface SearchResponse {
  properties: Property[];
  total: number;
  page: number;
  pages: number;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-zinc-500 text-sm">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter state from URL
  const q = searchParams.get("q") || "";
  const county = searchParams.get("county") || "";
  const state = searchParams.get("state") || "";
  const use = searchParams.get("use") || "";
  const minValue = searchParams.get("minValue") || "";
  const maxValue = searchParams.get("maxValue") || "";
  const minYear = searchParams.get("minYear") || "";
  const maxYear = searchParams.get("maxYear") || "";
  const page = Number(searchParams.get("page") || "1");

  // Local filter state for form inputs
  const [filters, setFilters] = useState({
    q, county, state, use, minValue, maxValue, minYear, maxYear,
  });

  // Sync filters from URL on param change
  useEffect(() => {
    setFilters({ q, county, state, use, minValue, maxValue, minYear, maxYear });
  }, [q, county, state, use, minValue, maxValue, minYear, maxYear]);

  const buildUrl = useCallback((overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const merged = { q, county, state, use, minValue, maxValue, minYear, maxYear, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && String(v).trim()) params.set(k, String(v));
    }
    return `/search?${params.toString()}`;
  }, [q, county, state, use, minValue, maxValue, minYear, maxYear, page]);

  useEffect(() => {
    const hasFilters = q || county || state || use || minValue || maxValue || minYear || maxYear;
    if (!hasFilters) {
      setResults(null);
      return;
    }

    async function search() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (county) params.set("county", county);
      if (state) params.set("state", state);
      if (use) params.set("use", use);
      if (minValue) params.set("minValue", String(minValue));
      if (maxValue) params.set("maxValue", String(maxValue));
      if (minYear) params.set("minYear", String(minYear));
      if (maxYear) params.set("maxYear", String(maxYear));
      params.set("page", String(page));

      try {
        const r = await fetch(`/api/search?${params.toString()}`);
        const data = await r.json();
        setResults(data);
      } catch (e) {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [q, county, state, use, minValue, maxValue, minYear, maxYear, page]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v.trim()) params.set(k, v.trim());
    }
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({ q: "", county: "", state: "", use: "", minValue: "", maxValue: "", minYear: "", maxYear: "" });
    router.push("/search");
  };

  const fmt = (val: number) => {
    if (!val) return "—";
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const hasActiveFilters = q || county || state || use || minValue || maxValue || minYear || maxYear;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">SEARCH</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-6">Property Search</h1>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <div className="w-64 shrink-0">
          <div className="border border-border bg-surface p-4 space-y-4 sticky top-16">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Filters</div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Address</label>
              <input
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="w-full bg-bg border border-border text-sm text-white px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="Search..."
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">County</label>
              <input
                value={filters.county}
                onChange={(e) => setFilters((f) => ({ ...f, county: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="w-full bg-bg border border-border text-sm text-white px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="e.g. Suffolk"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">State</label>
              <input
                value={filters.state}
                onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="w-full bg-bg border border-border text-sm text-white px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="e.g. MA"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Property Use</label>
              <input
                value={filters.use}
                onChange={(e) => setFilters((f) => ({ ...f, use: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="w-full bg-bg border border-border text-sm text-white px-3 py-2 focus:outline-none focus:border-accent"
                placeholder="e.g. Commercial"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Value Range</label>
              <div className="flex gap-2">
                <input
                  value={filters.minValue}
                  onChange={(e) => setFilters((f) => ({ ...f, minValue: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full bg-bg border border-border text-sm text-white px-2 py-2 focus:outline-none focus:border-accent"
                  placeholder="Min"
                  type="number"
                />
                <input
                  value={filters.maxValue}
                  onChange={(e) => setFilters((f) => ({ ...f, maxValue: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full bg-bg border border-border text-sm text-white px-2 py-2 focus:outline-none focus:border-accent"
                  placeholder="Max"
                  type="number"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Year Built</label>
              <div className="flex gap-2">
                <input
                  value={filters.minYear}
                  onChange={(e) => setFilters((f) => ({ ...f, minYear: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full bg-bg border border-border text-sm text-white px-2 py-2 focus:outline-none focus:border-accent"
                  placeholder="From"
                  type="number"
                />
                <input
                  value={filters.maxYear}
                  onChange={(e) => setFilters((f) => ({ ...f, maxYear: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full bg-bg border border-border text-sm text-white px-2 py-2 focus:outline-none focus:border-accent"
                  placeholder="To"
                  type="number"
                />
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full bg-accent/10 border border-accent/30 text-accent text-sm py-2 hover:bg-accent/20 transition-colors"
            >
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full text-zinc-500 text-xs py-1 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="text-zinc-500 text-sm py-8 text-center">Searching...</div>
          )}

          {!loading && !hasActiveFilters && (
            <div className="border border-border bg-surface p-8 text-center">
              <p className="text-zinc-400 text-sm mb-2">Enter search criteria or select a market to explore properties.</p>
              <Link href="/markets" className="text-accent text-sm hover:underline">Browse markets →</Link>
            </div>
          )}

          {!loading && hasActiveFilters && results && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500">
                  {results.total.toLocaleString()} results
                  {results.pages > 1 && ` — page ${results.page} of ${results.pages}`}
                </span>
              </div>

              {results.properties.length > 0 ? (
                <div className="border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-zinc-500 uppercase tracking-widest">
                        <th className="text-left px-4 py-3">Address</th>
                        <th className="text-left px-4 py-3">City / County</th>
                        <th className="text-left px-4 py-3">Use</th>
                        <th className="text-right px-4 py-3">Value</th>
                        <th className="text-right px-4 py-3">Year</th>
                        <th className="text-left px-4 py-3">Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.properties.map((p) => (
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
                          <td className="px-4 py-3 text-right font-mono text-zinc-400">
                            {p.year_built || "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs max-w-[200px] truncate">
                            {p.owner_name || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-border bg-surface p-8 text-center">
                  <p className="text-zinc-500 text-sm">No properties match these filters. Try broadening your search.</p>
                </div>
              )}

              {/* Pagination */}
              {results.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  {results.page > 1 && (
                    <Link
                      href={buildUrl({ page: results.page - 1 })}
                      className="px-3 py-1.5 text-xs text-zinc-400 border border-border hover:text-white hover:border-accent/30 transition-colors"
                    >
                      ← Prev
                    </Link>
                  )}
                  <span className="text-xs text-zinc-500 px-3">
                    Page {results.page} of {results.pages}
                  </span>
                  {results.page < results.pages && (
                    <Link
                      href={buildUrl({ page: results.page + 1 })}
                      className="px-3 py-1.5 text-xs text-zinc-400 border border-border hover:text-white hover:border-accent/30 transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
