/**
 * PROPERTYGRAPH INGEST PIPELINE
 * 
 * Full pipeline: scrape → resolve → signal → upload to Supabase
 * 
 * Usage:
 *   npx tsx scripts/ingest/ingest.ts --count 5000 --env production
 */

import { createClient } from "@supabase/supabase-js";
import { runCosmicPipeline } from "./cosmic_resolver";
import { scrapeRealHarrisCounty } from "./harris_real_scraper";

const supabaseUrl = process.env.SUPABASE_URL || "https://bkeixpzvoilaibnfkzvl.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWl4cHp2b2lsYWlibmZrenZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1NTUzNywiZXhwIjoyMDg5NjMxNTM3fQ.aR_ZqRo7B3GnSDI9v0aaTaiFCDyP8c75AiwA4nBQ4tk";

interface ScrapedProperty {
  account_number: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  owner_name: string;
  owner_address: string;
  estimated_value: number;
  property_type: string;
}

/**
 * Scrape Harris County (uses real data generator)
 */
async function scrapeHarrisCounty(limit: number): Promise<ScrapedProperty[]> {
  return await scrapeRealHarrisCounty(limit, false);
}

/**
 * Ingest all data into Supabase
 */
async function ingestToSupabase(properties: ScrapedProperty[], cosmicResult: any) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("\n📤 Uploading to Supabase...\n");

  // ─── Properties ──────────────────────────────────────
  console.log(`  Properties: inserting ${properties.length}...`);

  const propertyBatches = [];
  for (let i = 0; i < properties.length; i += 100) {
    propertyBatches.push(properties.slice(i, i + 100));
  }

  for (let batch = 0; batch < propertyBatches.length; batch++) {
    const { error } = await supabase.from("properties").insert(
      propertyBatches[batch].map((p) => ({
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        lat: p.latitude,
        lng: p.longitude,
        estimated_value: p.estimated_value,
      }))
    );

    if (error) {
      console.error(`    ⚠ Batch ${batch} failed:`, error);
    } else {
      console.log(`    ✓ Batch ${batch + 1}/${propertyBatches.length} uploaded`);
    }
  }

  // ─── Entities ────────────────────────────────────────
  console.log(`  Entities: inserting ${cosmicResult.entities.length}...`);

  const { error: entityError } = await supabase
    .from("entities")
    .insert(
      cosmicResult.entities.map((e: any) => ({
        id: e.id,
        name: e.canonical_name,
        type: e.type,
        registered_state: e.registered_state,
      }))
    );

  if (entityError) {
    console.error("    ⚠ Entity insert failed:", entityError);
  } else {
    console.log("    ✓ Entities uploaded");
  }

  // ─── Ownership Links (match properties to entities) ──
  console.log("  Ownership Links: building relationships...");

  const ownershipLinks = [];
  const entityMap = new Map(
    cosmicResult.entities.map((e: any) => [e.canonical_name, e.id])
  );

  for (const prop of properties) {
    const entityId = entityMap.get(prop.owner_name);
    if (entityId) {
      ownershipLinks.push({
        property_address: prop.address,
        entity_id: entityId,
        ownership_pct: 100,
      });
    }
  }

  // Batch insert ownership links by entity
  const linkBatches = [];
  for (let i = 0; i < ownershipLinks.length; i += 100) {
    linkBatches.push(ownershipLinks.slice(i, i + 100));
  }

  for (let batch = 0; batch < linkBatches.length; batch++) {
    const { error } = await supabase
      .from("ownership_links")
      .insert(
        linkBatches[batch].map((link) => ({
          property_address: link.property_address,
          entity_id: link.entity_id,
          ownership_pct: link.ownership_pct,
        }))
      );

    if (error) {
      console.warn(`    ⚠ Link batch ${batch} failed (may already exist)`);
    } else {
      console.log(`    ✓ Link batch ${batch + 1}/${linkBatches.length} uploaded`);
    }
  }

  // ─── Signals ─────────────────────────────────────────
  console.log(`  Signals: inserting ${cosmicResult.signals.length}...`);

  const { error: signalError } = await supabase
    .from("signals")
    .insert(
      cosmicResult.signals.map((s: any) => ({
        entity_id: s.entity_id,
        signal_type: s.signal_type,
        description: s.description,
        confidence: s.confidence,
      }))
    );

  if (signalError) {
    console.warn("    ⚠ Signal insert failed:", signalError);
  } else {
    console.log("    ✓ Signals uploaded");
  }

  console.log("\n✅ Ingest complete!");
}

/**
 * Main ingest pipeline
 */
async function main() {
  const count = parseInt(process.argv[2] || "1000");

  console.log("\n═══════════════════════════════════════════");
  console.log("  PROPERTYGRAPH INGEST PIPELINE");
  console.log("═══════════════════════════════════════════\n");

  // Step 1: Scrape
  console.log(`📍 Step 1: Scraping Harris County (${count} properties)...`);
  const properties = await scrapeHarrisCounty(count);
  console.log(`  ✓ ${properties.length} properties scraped\n`);

  // Step 2: COSMIC resolution
  console.log("🔬 Step 2: Running COSMIC pipeline...");
  const cosmicResult = await runCosmicPipeline(properties);
  console.log(`  ✓ ${cosmicResult.entities.length} entities resolved`);
  console.log(`  ✓ ${cosmicResult.signals.length} signals generated\n`);

  // Step 3: Ingest to Supabase
  console.log("📤 Step 3: Uploading to Supabase...");
  await ingestToSupabase(properties, cosmicResult);

  console.log("\n✅ Full pipeline complete!");
  console.log(`   - Properties: ${properties.length}`);
  console.log(`   - Entities: ${cosmicResult.entities.length}`);
  console.log(`   - Signals: ${cosmicResult.signals.length}`);
  console.log(`\n   Next: npm run dev (start local dev server)\n`);
}

main().catch((err) => {
  console.error("\n❌ Pipeline failed:", err);
  process.exit(1);
});
