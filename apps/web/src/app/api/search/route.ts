import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const county = params.get("county")?.trim();
  const state = params.get("state")?.trim();
  const use = params.get("use")?.trim();
  const minValue = params.get("minValue") ? Number(params.get("minValue")) : null;
  const maxValue = params.get("maxValue") ? Number(params.get("maxValue")) : null;
  const minYear = params.get("minYear") ? Number(params.get("minYear")) : null;
  const maxYear = params.get("maxYear") ? Number(params.get("maxYear")) : null;
  const page = Math.max(1, Number(params.get("page") || "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  // If it's a simple search (from homepage autocomplete), keep original behavior
  if (q && !county && !state && !use && !minValue && !maxValue && !minYear && !maxYear && !params.has("page")) {
    const pattern = `%${q}%`;
    const [propertiesRes, entitiesRes] = await Promise.all([
      supabase
        .from("properties_clean")
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

  // Advanced search for /search page
  let query = supabase
    .from("properties_clean")
    .select("id, address, city, state, zip, county, property_use, market_value, estimated_value, year_built, owner_name, raw_data", { count: "exact" });

  if (q) query = query.ilike("address", `%${q}%`);
  if (county) query = query.ilike("county", county);
  if (state) query = query.ilike("state", state);
  if (use) query = query.ilike("property_use", `%${use}%`);
  if (minValue) query = query.gte("market_value", minValue);
  if (maxValue) query = query.lte("market_value", maxValue);
  if (minYear) query = query.gte("year_built", minYear);
  if (maxYear) query = query.lte("year_built", maxYear);

  query = query.order("market_value", { ascending: false, nullsFirst: false }).order("id", { ascending: true });
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ properties: [], total: 0, page, error: error.message });
  }

  const properties = (data ?? []).map((p) => {
    const rd = p.raw_data as Record<string, any> | null;
    const rawVal = rd?.appraised_val ? parseInt(rd.appraised_val.replace(/^0+/, "") || "0", 10) : 0;
    const effectiveValue = (p.market_value && p.market_value > 0) ? p.market_value : (p.estimated_value && p.estimated_value > 0 ? p.estimated_value : rawVal);
    return ({
    id: p.id,
    address: p.address || rd?.situs_address || null,
    city: p.city || rd?.situs_city || null,
    state: p.state,
    zip: p.zip || rd?.situs_zip || null,
    county: p.county,
    property_use: p.property_use,
    market_value: effectiveValue,
    year_built: p.year_built,
    owner_name: p.owner_name || rd?.appr_owner_name || rd?.py_owner_name || null,
  });});

  return NextResponse.json({
    properties,
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  });
}
