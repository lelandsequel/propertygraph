/**
 * BACKFILL v2 — Travis County market_value
 * Cursor-based, retry on failure, runs until done.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bkeixpzvoilaibnfkzvl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWl4cHp2b2lsYWlibmZrenZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1NTUzNywiZXhwIjoyMDg5NjMxNTM3fQ.aR_ZqRo7B3GnSDI9v0aaTaiFCDyP8c75AiwA4nBQ4tk";
const BATCH = 200;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

function parseVal(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = parseInt(raw.replace(/^0+/, "") || "0", 10);
  return isNaN(n) ? 0 : n;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try { return await fn(); }
    catch (e: any) {
      console.log(`  ${label} retry ${i+1}/${MAX_RETRIES}: ${e.message}`);
      await sleep(RETRY_DELAY * (i + 1));
    }
  }
  return null;
}

async function main() {
  let cursor = "00000000-0000-0000-0000-000000000000";
  let total = 0;
  let batchNum = 0;
  const start = Date.now();

  console.log("=== Travis market_value backfill v2 ===");

  while (true) {
    batchNum++;

    // Fresh client each batch to avoid stale connections
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const fetchResult = await withRetry(async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, raw_data, market_value")
        .eq("county", "Travis")
        .gt("id", cursor)
        .order("id", { ascending: true })
        .limit(BATCH);
      if (error) throw new Error(error.message);
      return data;
    }, `fetch batch ${batchNum}`);

    if (!fetchResult || fetchResult.length === 0) {
      console.log("Done — no more records.");
      break;
    }

    cursor = fetchResult[fetchResult.length - 1].id;

    const updates = fetchResult
      .filter(r => !r.market_value || r.market_value === 0 || r.market_value === -1)
      .map(r => {
        const rd = r.raw_data as any;
        const mv = parseVal(rd?.appraised_val);
        return mv > 0 ? { id: r.id, market_value: mv, owner_name: rd?.appr_owner_name || null, zip: rd?.situs_zip || null } : null;
      })
      .filter(Boolean) as any[];

    if (updates.length > 0) {
      const upsertResult = await withRetry(async () => {
        const supabase2 = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { error } = await supabase2.from("properties").upsert(updates, { onConflict: "id" });
        if (error) throw new Error(error.message);
        return true;
      }, `upsert batch ${batchNum}`);

      if (upsertResult) {
        total += updates.length;
      }
    }

    const elapsed = Math.round((Date.now() - start) / 1000);
    const rate = total / (elapsed || 1);
    console.log(`Batch ${batchNum}: +${updates.length} (total: ${total}) | ${rate.toFixed(0)}/s | cursor: ${cursor.slice(0,8)}`);

    if (fetchResult.length < BATCH) {
      console.log("Last batch reached — done.");
      break;
    }

    await sleep(100); // small breathe between batches
  }

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n=== DONE: ${total} records in ${elapsed}s ===`);
  
  try {
    const { execSync } = await import("child_process");
    execSync(`openclaw system event --text "Travis backfill done: ${total} records updated with real market values. PropertyGraph Austin ready." --mode now`);
  } catch(e) {}
}

main().catch(console.error);
