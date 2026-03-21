"use client";

import { useState, useEffect, useRef } from "react";

interface SearchResult {
  properties: { id: string; address: string; city: string; state: string; zip: string; estimated_value: number }[];
  entities: { id: string; name: string; type: string }[];
}

interface Signal {
  id: string;
  entity_id: string;
  signal_type: string;
  description: string;
  confidence: number;
  entity_name?: string;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/signals")
      .then((r) => r.json())
      .then(setSignals)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data);
          setShowResults(true);
        });
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const formatValue = (val: number) =>
    val >= 1_000_000
      ? `$${(val / 1_000_000).toFixed(1)}M`
      : `$${(val / 1_000).toFixed(0)}K`;

  const signalColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-signal-red border-signal-red";
    if (confidence >= 0.7) return "text-signal-amber border-signal-amber";
    return "text-signal-green border-signal-green";
  };

  const signalBg = (confidence: number) => {
    if (confidence >= 0.85) return "bg-signal-red/10";
    if (confidence >= 0.7) return "bg-signal-amber/10";
    return "bg-signal-green/10";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero search */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <h1 className="text-4xl font-bold tracking-tight mb-2">PROPERTYGRAPH</h1>
        <p className="text-zinc-500 text-sm mb-8 tracking-wide">
          COMMERCIAL REAL ESTATE INTELLIGENCE — HARRIS COUNTY TX
        </p>

        <div className="w-full max-w-2xl relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search address or entity name..."
            className="w-full bg-surface border border-border text-white px-4 py-3 text-sm
              focus:outline-none focus:border-accent transition-colors
              placeholder:text-zinc-600"
          />
          <div className="absolute right-3 top-3 text-zinc-600 text-xs">⌘K</div>

          {showResults && results && (results.properties.length > 0 || results.entities.length > 0) && (
            <div className="absolute top-full left-0 right-0 bg-surface border border-border border-t-0 z-50 max-h-96 overflow-y-auto">
              {results.properties.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] text-zinc-500 uppercase tracking-widest bg-bg">
                    Properties
                  </div>
                  {results.properties.map((p) => (
                    <a
                      key={p.id}
                      href={`/property/${p.id}`}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/10 transition-colors border-b border-border/50"
                    >
                      <div>
                        <div className="text-sm text-white">{p.address}</div>
                        <div className="text-xs text-zinc-500">
                          {p.city}, {p.state} {p.zip}
                        </div>
                      </div>
                      <div className="text-xs text-accent font-mono">
                        {formatValue(p.estimated_value)}
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {results.entities.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] text-zinc-500 uppercase tracking-widest bg-bg">
                    Entities
                  </div>
                  {results.entities.map((e) => (
                    <a
                      key={e.id}
                      href={`/entity/${e.id}`}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-amber/10 transition-colors border-b border-border/50"
                    >
                      <div>
                        <div className="text-sm text-white">{e.name}</div>
                        <div className="text-xs text-zinc-500">{e.type}</div>
                      </div>
                      <div className="text-xs text-amber font-mono">ENTITY</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signals panel */}
      <div className="max-w-4xl mx-auto w-full px-4 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Active Signals</span>
          <span className="w-1.5 h-1.5 rounded-full bg-signal-red glow-pulse" />
        </div>
        <div className="grid gap-2">
          {signals.map((s, i) => (
            <a
              key={i}
              href={`/entity/${s.entity_id}`}
              className={`border ${signalColor(s.confidence)} ${signalBg(s.confidence)} p-4 signal-badge transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold">⚡ {s.signal_type.replace(/_/g, " ").toUpperCase()}</span>
                    <span className="text-[10px] text-zinc-500">
                      {(s.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300">{s.description}</p>
                  {s.entity_name && (
                    <p className="text-xs text-zinc-500 mt-1">→ {s.entity_name}</p>
                  )}
                </div>
                <div className="text-xs text-zinc-600">VIEW →</div>
              </div>
            </a>
          ))}
          {signals.length === 0 && (
            <div className="text-zinc-600 text-sm text-center py-8">
              Connect to Supabase to load signals
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
