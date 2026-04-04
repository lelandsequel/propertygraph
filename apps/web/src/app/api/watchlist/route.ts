import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ids: string[] = body.ids ?? [];

  if (ids.length === 0) {
    return NextResponse.json({ properties: [] });
  }

  const { data } = await supabase
    .from("properties")
    .select("id, address, city, state, zip, county, market_value, estimated_value, property_use")
    .in("id", ids.slice(0, 100));

  const properties = (data ?? []).map((p) => ({
    ...p,
    market_value: p.market_value || p.estimated_value || 0,
  }));

  return NextResponse.json({ properties });
}
