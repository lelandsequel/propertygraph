"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PropertyNode from "./nodes/PropertyNode";
import EntityNode from "./nodes/EntityNode";
import IndividualNode from "./nodes/IndividualNode";

interface GraphCanvasProps {
  nodes: any[];
  edges: any[];
  onNodeClick: (node: any) => void;
}

export default function GraphCanvas({ nodes: initialNodes, edges: initialEdges, onNodeClick }: GraphCanvasProps) {
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      property: PropertyNode,
      entity: EntityNode,
      individual: IndividualNode,
    }),
    []
  );

  const mappedNodes: Node[] = useMemo(
    () =>
      initialNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
    [initialNodes]
  );

  const mappedEdges: Edge[] = useMemo(
    () =>
      initialEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated ?? false,
        style: { stroke: e.animated ? "#3B82F6" : "#333", strokeWidth: 1.5 },
        labelStyle: { fill: "#666", fontSize: 10, fontFamily: "monospace" },
        markerEnd: { type: MarkerType.ArrowClosed, color: e.animated ? "#3B82F6" : "#333" },
      })),
    [initialEdges]
  );

  const [nodes, , onNodesChange] = useNodesState(mappedNodes);
  const [edges, , onEdgesChange] = useEdgesState(mappedEdges);

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      const original = initialNodes.find((n) => n.id === node.id);
      if (original) onNodeClick(original);
    },
    [initialNodes, onNodeClick]
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
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a1a" />
      <Controls
        showInteractive={false}
        style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 0 }}
      />
      <MiniMap
        nodeColor={(n) => {
          if (n.type === "property") return "#3B82F6";
          if (n.type === "individual") return "#8B5CF6";
          return "#F59E0B";
        }}
        maskColor="rgba(0,0,0,0.8)"
        style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 0 }}
      />
    </ReactFlow>
  );
}
