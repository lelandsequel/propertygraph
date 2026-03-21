"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export default function PropertyNode({ data }: NodeProps) {
  const d = data as { label: string; sublabel?: string; value?: number };
  const formatValue = (val: number) =>
    val >= 1_000_000 ? `$${(val / 1_000_000).toFixed(1)}M` : `$${(val / 1_000).toFixed(0)}K`;

  return (
    <div className="bg-[#0c1829] border border-accent/40 px-4 py-3 min-w-[180px] shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-shadow cursor-pointer">
      <Handle type="target" position={Position.Left} style={{ background: "#3B82F6", border: "none", width: 6, height: 6 }} />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-accent" />
        <span className="text-[10px] text-accent uppercase tracking-widest">Property</span>
      </div>
      <div className="text-xs text-white font-bold">{d.label}</div>
      {d.sublabel && <div className="text-[10px] text-zinc-500 mt-0.5">{d.sublabel}</div>}
      {d.value && (
        <div className="text-xs font-mono text-accent mt-1">{formatValue(d.value)}</div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: "#3B82F6", border: "none", width: 6, height: 6 }} />
    </div>
  );
}
