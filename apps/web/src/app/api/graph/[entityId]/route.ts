import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface GraphNode {
  id: string;
  type: "property" | "entity" | "individual";
  data: {
    label: string;
    sublabel?: string;
    value?: number;
    entityType?: string;
    signals?: { signal_type: string; description: string; confidence: number }[];
  };
  position: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated?: boolean;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  const { entityId } = params;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new Set<string>();

  await expandEntity(entityId, nodes, edges, visited, 0, 0);

  return NextResponse.json({ nodes, edges });
}

async function expandEntity(
  entityId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  visited: Set<string>,
  depth: number,
  yOffset: number
) {
  if (visited.has(entityId) || depth > 3) return;
  visited.add(entityId);

  // Fetch entity
  const { data: entity } = await supabase
    .from("entities")
    .select("*")
    .eq("id", entityId)
    .single();

  if (!entity) return;

  // Fetch signals for this entity
  const { data: signals } = await supabase
    .from("signals")
    .select("signal_type, description, confidence")
    .eq("entity_id", entityId);

  const nodeType = entity.type === "Individual" ? "individual" : "entity";
  const entityX = depth * 350;
  const entityY = yOffset;

  nodes.push({
    id: entityId,
    type: nodeType,
    data: {
      label: entity.name,
      sublabel: entity.type,
      entityType: entity.type,
      signals: signals ?? [],
    },
    position: { x: entityX, y: entityY },
  });

  // Fetch properties owned by this entity
  const { data: ownerships } = await supabase
    .from("ownership_links")
    .select("property_id, ownership_pct")
    .eq("entity_id", entityId);

  if (ownerships) {
    for (let i = 0; i < ownerships.length; i++) {
      const ol = ownerships[i];
      if (!visited.has(ol.property_id)) {
        visited.add(ol.property_id);

        const { data: property } = await supabase
          .from("properties")
          .select("*")
          .eq("id", ol.property_id)
          .single();

        if (property) {
          nodes.push({
            id: property.id,
            type: "property",
            data: {
              label: property.address,
              sublabel: `${property.city}, ${property.state} ${property.zip}`,
              value: property.estimated_value,
            },
            position: {
              x: entityX + 350,
              y: entityY + (i - ownerships.length / 2) * 120,
            },
          });

          const pctLabel = ol.ownership_pct < 100 ? `owns ${ol.ownership_pct}%` : "owns";
          edges.push({
            id: `${entityId}-${property.id}`,
            source: entityId,
            target: property.id,
            label: pctLabel,
            animated: true,
          });
        }
      }
    }
  }

  // Fetch parent relationships (where this entity is the child)
  const { data: parentRels } = await supabase
    .from("entity_relationships")
    .select("parent_entity_id, relationship_type")
    .eq("child_entity_id", entityId);

  if (parentRels) {
    for (let i = 0; i < parentRels.length; i++) {
      const rel = parentRels[i];
      if (!visited.has(rel.parent_entity_id)) {
        edges.push({
          id: `${rel.parent_entity_id}-${entityId}-${rel.relationship_type}`,
          source: rel.parent_entity_id,
          target: entityId,
          label: rel.relationship_type,
        });
        await expandEntity(
          rel.parent_entity_id,
          nodes,
          edges,
          visited,
          depth - 1,
          entityY + (i + 1) * 200
        );
      }
    }
  }

  // Fetch child relationships (where this entity is the parent)
  const { data: childRels } = await supabase
    .from("entity_relationships")
    .select("child_entity_id, relationship_type")
    .eq("parent_entity_id", entityId);

  if (childRels) {
    for (let i = 0; i < childRels.length; i++) {
      const rel = childRels[i];
      if (!visited.has(rel.child_entity_id)) {
        edges.push({
          id: `${entityId}-${rel.child_entity_id}-${rel.relationship_type}`,
          source: entityId,
          target: rel.child_entity_id,
          label: rel.relationship_type,
        });
        await expandEntity(
          rel.child_entity_id,
          nodes,
          edges,
          visited,
          depth + 1,
          entityY + (i + 1) * 250
        );
      }
    }
  }
}
