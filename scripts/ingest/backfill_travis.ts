/**
 * BACKFILL: Travis County market_value, owner_name, zip
 *
 * Fixes ~4M Travis records where market_value=0 by parsing
 * raw_data->appraised_val (zero-padded string like "000000000909824" = $909,824).
 * Also backfills owner_name from raw_data->appr_owner_name and zip from raw_data->situs_zip.
 *
 * Run: npx tsx scripts/ingest/backfill_travis.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bkeixpzvoilaibnfkzvl.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is required");
}

const BATCH_SIZE = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseAppraisedVal(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = parseInt(raw.replace(/^0+/, "") || "0", 10);
  return isNaN(n) ? 0 : n;
}

async function backfillMarketValue() {
  console.log("=== Travis County Backfill: market_value ===");
  let totalUpdated = 0;
  let batch = 0;
  let lastId = "00000000-0000-0000-0000-000000000000";

  while (true) {
    batch++;
    const { data, error } = await supabase
      .from("properties")
      .select("id, raw_data, market_value")
      .eq("county", "Travis")
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!data || data.length === 0) {
      console.log("No more market_value=0 records.");
      break;
    }

    const updates = data
      .map((row) => {
        const rd = row.raw_data as Record<string, any> | null;
        const mv = parseAppraisedVal(rd?.appraised_val);
        if (mv === 0) return null; // skip if still 0
        return { id: row.id, market_value: mv };
      })
      .filter(Boolean) as { id: string; market_value: number }[];

    if (updates.length === 0) {
      // All rows in this batch had no usable appraised_val — skip them by setting market_value=-1 as sentinel
      // Actually, just break to avoid infinite loop on un-parseable rows
      console.log(`Batch ${batch}: all ${data.length} rows have no parseable appraised_val, skipping.`);
      // Mark them so we don't re-fetch forever
      const ids = data.map((r) => r.id);
      await supabase.from("properties").update({ market_value: -1 }).in("id", ids);
      totalUpdated += data.length;
      continue;
    }

    // Upsert in bulk
    const { error: upsertErr } = await supabase
      .from("properties")
      .upsert(updates, { onConflict: "id" });

    if (upsertErr) {
      console.error(`Batch ${batch} upsert error:`, upsertErr.message);
      break;
    }

    totalUpdated += updates.length;
    lastId = data[data.length - 1].id;
    console.log(`Batch ${batch}: updated ${updates.length} market_value records (total: ${totalUpdated}) cursor: ${lastId}`);

    if (data.length < BATCH_SIZE) break;
  }

  console.log(`market_value backfill complete. Total: ${totalUpdated}\n`);
  return totalUpdated;
}

async function backfillOwnerName() {
  console.log("=== Travis County Backfill: owner_name ===");
  let totalUpdated = 0;
  let batch = 0;

  while (true) {
    batch++;
    const { data, error } = await supabase
      .from("properties")
      .select("id, raw_data")
      .eq("county", "Travis")
      .is("owner_name", null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!data || data.length === 0) {
      console.log("No more owner_name=null records.");
      break;
    }

    const updates = data
      .map((row) => {
        const rd = row.raw_data as Record<string, any> | null;
        const name = rd?.appr_owner_name?.trim();
        if (!name) return null;
        return { id: row.id, owner_name: name };
      })
      .filter(Boolean) as { id: string; owner_name: string }[];

    if (updates.length === 0) {
      console.log(`Batch ${batch}: no parseable owner names in ${data.length} rows, done.`);
      break;
    }

    const { error: upsertErr } = await supabase
      .from("properties")
      .upsert(updates, { onConflict: "id" });

    if (upsertErr) {
      console.error(`Batch ${batch} upsert error:`, upsertErr.message);
      break;
    }

    totalUpdated += updates.length;
    console.log(`Batch ${batch}: updated ${updates.length} owner_name records (total: ${totalUpdated})`);
  }

  console.log(`owner_name backfill complete. Total: ${totalUpdated}\n`);
  return totalUpdated;
}

async function backfillZip() {
  console.log("=== Travis County Backfill: zip ===");
  let totalUpdated = 0;
  let batch = 0;

  while (true) {
    batch++;
    const { data, error } = await supabase
      .from("properties")
      .select("id, raw_data")
      .eq("county", "Travis")
      .is("zip", null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!data || data.length === 0) {
      console.log("No more zip=null records.");
      break;
    }

    const updates = data
      .map((row) => {
        const rd = row.raw_data as Record<string, any> | null;
        const zip = rd?.situs_zip?.trim();
        if (!zip) return null;
        return { id: row.id, zip };
      })
      .filter(Boolean) as { id: string; zip: string }[];

    if (updates.length === 0) {
      console.log(`Batch ${batch}: no parseable zips in ${data.length} rows, done.`);
      break;
    }

    const { error: upsertErr } = await supabase
      .from("properties")
      .upsert(updates, { onConflict: "id" });

    if (upsertErr) {
      console.error(`Batch ${batch} upsert error:`, upsertErr.message);
      break;
    }

    totalUpdated += updates.length;
    console.log(`Batch ${batch}: updated ${updates.length} zip records (total: ${totalUpdated})`);
  }

  console.log(`zip backfill complete. Total: ${totalUpdated}\n`);
  return totalUpdated;
}

async function main() {
  console.log("Starting Travis County backfill...\n");
  const start = Date.now();

  const mvCount = await backfillMarketValue();
  const ownerCount = await backfillOwnerName();
  const zipCount = await backfillZip();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("=== BACKFILL COMPLETE ===");
  console.log(`market_value: ${mvCount}`);
  console.log(`owner_name:   ${ownerCount}`);
  console.log(`zip:          ${zipCount}`);
  console.log(`Elapsed:      ${elapsed}s`);
}

main().catch(console.error);
