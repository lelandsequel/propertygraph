"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export default function EntityNode({ data }: NodeProps) {
  const d = data as { label: string; sublabel?: string; entityType?: string; signals?: { signal_type: string; description: string; confidence: number }[] };

  return (
    <div className="bg-[#1a1408] border border-amber/40 px-4 py-3 min-w-[200px] shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-shadow cursor-pointer">
      <Handle type="target" position={Position.Left} style={{ background: "#F59E0B", border: "none", width: 6, height: 6 }} />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-amber" />
        <span className="text-[10px] text-amber uppercase tracking-widest">{d.entityType ?? "Entity"}</span>
      </div>
      <div className="text-xs text-white font-bold">{d.label}</div>
      {d.sublabel && <div className="text-[10px] text-zinc-500 mt-0.5">{d.sublabel}</div>}
      {d.signals && d.signals.length > 0 && (
        <div className="mt-2 space-y-1">
          {d.signals.map((s, i) => (
            <div
              key={i}
              className="text-[9px] text-signal-red border border-signal-red/30 bg-signal-red/5 px-1.5 py-0.5 signal-badge"
            >
              ⚡ {s.signal_type.replace(/_/g, " ").toUpperCase()}
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: "#F59E0B", border: "none", width: 6, height: 6 }} />
    </div>
  );
}
