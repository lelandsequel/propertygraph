/**
 * migrate_to_clean.ts
 * PropertyGraph Data Layer Recovery — Phase 2
 * 
 * Migrates real property records from `properties` → `properties_clean`
 * 
 * Prerequisites:
 *   1. Create properties_clean table first (run supabase/migrations/20260406000000_properties_clean.sql)
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * 
 * Run: npx ts-node scripts/ingest/migrate_to_clean.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://bkeixpzvoilaibnfkzvl.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWl4cHp2b2lsYWlibmZrenZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1NTUzNywiZXhwIjoyMDg5NjMxNTM3fQ.aR_ZqRo7B3GnSDI9v0aaTaiFCDyP8c75AiwA4nBQ4tk";

const BATCH_SIZE = 500;
const LOG_EVERY = 1000;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface PropertyRow {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  acct_number: string | null;
  land_value: number | null;
  improvement_value: number | null;
  total_appraised_value: number | null;
  market_value: number | null;
  lot_sqft: number | null;
  building_sqft: number | null;
  year_built: number | null;
  lat: number | null;
  lng: number | null;
  owner_name: string | null;
  cad_source: string | null;
}

interface CleanPropertyRow {
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  parcel_id: string | null;
  land_value: number | null;
  improvement_value: number | null;
  total_appraised_value: number | null;
  market_value: number;
  lot_sqft: number | null;
  building_sqft: number | null;
  year_built: number | null;
  lat: number | null;
  lng: number | null;
  owner_name: string | null;
  source: string | null;
}

async function migrate() {
  console.log("🚀 PropertyGraph — Migrating properties → properties_clean");
  console.log(`   SUPABASE_URL: ${SUPABASE_URL}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log("");

  let offset = 0;
  let totalMigrated = 0;
  let totalErrors = 0;

  while (true) {
    // Fetch batch from properties
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id,address,city,state,zip,county,acct_number,land_value,improvement_value,total_appraised_value,market_value,lot_sqft,building_sqft,year_built,lat,lng,owner_name,cad_source"
      )
      .not("address", "is", null)
      .gt("market_value", 0)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error(`❌ Fetch error at offset ${offset}:`, error.message);
      break;
    }

    if (!data || data.length === 0) {
      console.log("✅ No more records to process.");
      break;
    }

    const rows = data as PropertyRow[];

    // Map to clean schema
    const cleanRows: CleanPropertyRow[] = rows.map((r) => ({
      address: r.address!,
      city: r.city,
      state: r.state,
      zip: r.zip,
      county: r.county,
      parcel_id: r.acct_number,
      land_value: r.land_value,
      improvement_value: r.improvement_value,
      total_appraised_value: r.total_appraised_value,
      market_value: r.market_value!,
      lot_sqft: r.lot_sqft,
      building_sqft: r.building_sqft,
      year_built: r.year_built,
      lat: r.lat,
      lng: r.lng,
      owner_name: r.owner_name,
      source: r.cad_source,
    }));

    // Insert into properties_clean
    const { error: insertError } = await supabase
      .from("properties_clean")
      .insert(cleanRows);

    if (insertError) {
      console.error(`❌ Insert error at offset ${offset}:`, insertError.message);
      totalErrors++;
    } else {
      totalMigrated += rows.length;
    }

    offset += BATCH_SIZE;

    if (totalMigrated % LOG_EVERY < BATCH_SIZE) {
      console.log(`   ⬆️  Migrated ${totalMigrated.toLocaleString()} rows so far...`);
    }

    // If we got fewer rows than batch size, we're done
    if (rows.length < BATCH_SIZE) {
      console.log("✅ Reached end of dataset.");
      break;
    }
  }

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log(`✅ Migration complete`);
  console.log(`   Rows migrated: ${totalMigrated.toLocaleString()}`);
  console.log(`   Batches with errors: ${totalErrors}`);
  console.log("═══════════════════════════════════════");
  console.log("");

  // Sanity check
  console.log("🔍 Running sanity check...");
  const { data: sample, error: sampleError } = await supabase
    .from("properties_clean")
    .select("address,city,market_value")
    .limit(5);

  if (sampleError) {
    console.error("❌ Sanity check failed:", sampleError.message);
  } else {
    console.log("Sample records from properties_clean:");
    sample?.forEach((r, i) => {
      console.log(
        `  ${i + 1}. ${r.address} | ${r.city} | $${Number(r.market_value).toLocaleString()}`
      );
    });
  }

  // Total count
  const { count, error: countError } = await supabase
    .from("properties_clean")
    .select("id", { count: "estimated", head: true });

  if (!countError) {
    console.log(`\n  Estimated row count in properties_clean: ${count?.toLocaleString()}`);
  }
}

migrate().catch(console.error);
