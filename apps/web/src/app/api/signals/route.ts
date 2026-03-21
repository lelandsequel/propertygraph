import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: signals } = await supabase
    .from("signals")
    .select("id, entity_id, signal_type, description, confidence")
    .order("confidence", { ascending: false });

  if (!signals || signals.length === 0) {
    return NextResponse.json([]);
  }

  // Enrich with entity names
  const entityIds = Array.from(new Set(signals.map((s) => s.entity_id)));
  const { data: entities } = await supabase
    .from("entities")
    .select("id, name")
    .in("id", entityIds);

  const entityMap = new Map(entities?.map((e) => [e.id, e.name]) ?? []);

  const enriched = signals.map((s) => ({
    ...s,
    entity_name: entityMap.get(s.entity_id) ?? null,
  }));

  return NextResponse.json(enriched);
}
