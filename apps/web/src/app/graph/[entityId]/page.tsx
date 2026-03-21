"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), { ssr: false });

export default function GraphPage() {
  const params = useParams();
  const entityId = params.entityId as string;
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/graph/${entityId}`)
      .then((r) => r.json())
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entityId]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="h-[calc(100vh-48px)] w-full relative bg-[#050508]">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-[#050508] to-transparent">
        <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← BACK
        </Link>
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
          Network Graph — Entity {entityId.slice(0, 8)}...
        </span>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent inline-block" /> Property
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-amber inline-block" /> Entity
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple inline-block" /> Individual
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-zinc-500 text-sm animate-pulse">Loading graph...</div>
        </div>
      ) : graphData ? (
        <GraphCanvas
          nodes={graphData.nodes}
          edges={graphData.edges}
          onNodeClick={handleNodeClick}
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-zinc-500 text-sm">Failed to load graph data</div>
        </div>
      )}

      {/* Selection panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-surface border border-border p-4 w-80">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">{selectedNode.data.label}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          {selectedNode.data.sublabel && (
            <p className="text-xs text-zinc-500 mb-2">{selectedNode.data.sublabel}</p>
          )}
          {selectedNode.data.value && (
            <p className="text-sm font-mono text-accent mb-2">
              ${(selectedNode.data.value / 1_000_000).toFixed(1)}M
            </p>
          )}
          {selectedNode.data.signals?.length > 0 && (
            <div className="mt-2 space-y-1">
              {selectedNode.data.signals.map((s: any, i: number) => (
                <div key={i} className="text-[10px] text-signal-red border border-signal-red/30 bg-signal-red/10 px-2 py-1 signal-badge">
                  ⚡ {s.description.slice(0, 80)}...
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {selectedNode.type === "property" ? (
              <Link
                href={`/property/${selectedNode.id}`}
                className="text-[10px] text-accent hover:underline"
              >
                View Property →
              </Link>
            ) : (
              <>
                <Link
                  href={`/entity/${selectedNode.id}`}
                  className="text-[10px] text-accent hover:underline"
                >
                  View Entity →
                </Link>
                <Link
                  href={`/graph/${selectedNode.id}`}
                  className="text-[10px] text-amber hover:underline"
                >
                  Expand Network →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
