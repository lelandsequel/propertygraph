"use client";

import Link from "next/link";
import { useWatchlist } from "@/lib/watchlist";

export function PropertyActions({ propertyId, entityId }: { propertyId: string; entityId?: string }) {
  const { has, toggle } = useWatchlist();
  const saved = has(propertyId);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggle(propertyId)}
        className={`px-4 py-2 text-sm border transition-colors ${
          saved
            ? "bg-accent/20 border-accent/50 text-accent"
            : "bg-surface border-border text-zinc-400 hover:text-white hover:border-accent/30"
        }`}
      >
        {saved ? "Saved to Watchlist" : "Add to Watchlist"}
      </button>
      {entityId && (
        <Link
          href={`/graph/${entityId}`}
          className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-sm hover:bg-accent/20 transition-colors"
        >
          View Ownership Graph →
        </Link>
      )}
    </div>
  );
}
