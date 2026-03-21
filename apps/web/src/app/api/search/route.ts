import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ properties: [], entities: [] });
  }

  const pattern = `%${q}%`;

  const [propertiesRes, entitiesRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id, address, city, state, zip, estimated_value")
      .ilike("address", pattern)
      .limit(8),
    supabase
      .from("entities")
      .select("id, name, type")
      .ilike("name", pattern)
      .limit(8),
  ]);

  return NextResponse.json({
    properties: propertiesRes.data ?? [],
    entities: entitiesRes.data ?? [],
  });
}
