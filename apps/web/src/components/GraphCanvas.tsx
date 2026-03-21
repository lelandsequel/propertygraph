"use client";

import React, { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
}

/**
 * Custom node component for PropertyGraph
 */
const PropertyNode = ({ data }: { data: any }) => (
  <div className="px-3 py-2 bg-surface border border-border rounded text-white text-xs font-medium min-w-[120px]">
    <div className="truncate">{data.label}</div>
    {data.sublabel && (
      <div className="text-[10px] text-zinc-500 truncate">{data.sublabel}</div>
    )}
    {data.value && (
      <div className="text-[10px] text-accent mt-1 font-mono">
        ${(data.value / 1_000_000).toFixed(1)}M
      </div>
    )}
  </div>
);

const EntityNode = ({ data }: { data: any }) => (
  <div className="px-3 py-2 bg-amber/10 border border-amber rounded text-white text-xs font-medium min-w-[120px]">
    <div className="truncate font-bold">{data.label}</div>
    {data.sublabel && (
      <div className="text-[10px] text-zinc-400 truncate">{data.sublabel}</div>
    )}
  </div>
);

const IndividualNode = ({ data }: { data: any }) => (
  <div className="px-3 py-2 bg-purple/10 border border-purple rounded text-white text-xs font-medium min-w-[120px]">
    <div className="truncate">{data.label}</div>
    {data.sublabel && (
      <div className="text-[10px] text-zinc-400 truncate">{data.sublabel}</div>
    )}
  </div>
);

const nodeTypes: NodeTypes = {
  property: PropertyNode,
  entity: EntityNode,
  individual: IndividualNode,
};

export default function GraphCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node);

      // Optional: Expand node on double-click
      if (event.detail === 2) {
        if (!expanded.has(node.id)) {
          setExpanded((prev) => new Set(prev).add(node.id));
          // Could fetch more data here
        }
      }
    },
    [onNodeClick, expanded]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
    >
      <Background color="#27272a" gap={16} size={0.5} />
      <Controls />
      <MiniMap
        nodeColor={(node) => {
          if (node.type === "property") return "#f97316";
          if (node.type === "individual") return "#a855f7";
          return "#fbbf24";
        }}
        maskColor="rgba(5, 5, 8, 0.9)"
      />
    </ReactFlow>
  );
}
