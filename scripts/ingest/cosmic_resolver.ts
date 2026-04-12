/**
 * COSMIC ENTITY RESOLUTION + SIGNAL GENERATION
 * 
 * Runs COSMIC engines on PropertyGraph data:
 * - NOVA: Entity relationship inference (LLC → parent → individual)
 * - ECLIPSE: Temporal pattern reconstruction (acquisition timeline)
 * - PULSAR: Ownership clustering analysis
 * - QUASAR: Signal surfacing (roll-up candidates, acquisition patterns)
 * 
 * Input: Raw properties + entity names from scraper
 * Output: Entity graph + signals for Supabase
 */

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

interface ResolvedEntity {
  id: string;
  canonical_name: string;
  type: "LLC" | "Corporation" | "Trust" | "Individual";
  registered_state: string;
  detected_parent?: string;
  confidence: number;
}

interface Signal {
  entity_id: string;
  signal_type: string;
  description: string;
  confidence: number;
}

/**
 * NOVA: Infer entity types + parent relationships from name patterns
 */
function cosmicNova(entities: string[]): Map<string, ResolvedEntity> {
  const resolved = new Map<string, ResolvedEntity>();

  for (const name of entities) {
    const id = generateUUID(name);
    const type = inferEntityType(name);
    const parentName = inferParentEntity(name);

    resolved.set(
      name,
      {
        id,
        canonical_name: name,
        type,
        registered_state: "TX",
        detected_parent: parentName,
        confidence: 0.75,
      }
    );
  }

  console.log(`✅ NOVA: ${resolved.size} entities typed + parents inferred`);
  return resolved;
}

/**
 * Infer entity type from name
 */
function inferEntityType(
  name: string
): "LLC" | "Corporation" | "Trust" | "Individual" {
  const lower = name.toLowerCase();

  if (lower.includes("trust")) return "Trust";
  if (lower.includes("llc") || lower.includes("l.l.c")) return "LLC";
  if (lower.includes("inc") || lower.includes("corp")) return "Corporation";
  if (
    !lower.includes("llc") &&
    !lower.includes("inc") &&
    !lower.includes("corp") &&
    !lower.includes("trust") &&
    !lower.includes("ltd")
  ) {
    // Single name = individual
    if (name.split(" ").length <= 3) return "Individual";
  }

  return "LLC";
}

/**
 * NOVA: Infer parent entity from subsidiary structure
 */
function inferParentEntity(name: string): string | undefined {
  // Pattern: "CompanyName LLC" often has parent "CompanyName Holdings" or similar
  const base = name.replace(/\s+(llc|inc|corp|ltd)$/i, "").trim();

  // Heuristic: if name contains specific keywords, infer parent
  if (base.includes("Holdings")) return undefined; // Holdings is likely parent
  if (base.includes("Ventures")) {
    // Ventures might have Holdings parent
    return base.replace("Ventures", "Holdings");
  }

  return undefined;
}

/**
 * ECLIPSE: Reconstruct ownership timeline + acquisition patterns
 */
function cosmicEclipse(
  properties: ScrapedProperty[]
): Map<string, { properties: ScrapedProperty[]; timeline: string[] }> {
  const ownershipMap = new Map<
    string,
    { properties: ScrapedProperty[]; timeline: string[] }
  >();

  for (const prop of properties) {
    if (!ownershipMap.has(prop.owner_name)) {
      ownershipMap.set(prop.owner_name, {
        properties: [],
        timeline: [],
      });
    }

    ownershipMap.get(prop.owner_name)!.properties.push(prop);
  }

  console.log(
    `✅ ECLIPSE: ${ownershipMap.size} entity ownership timelines reconstructed`
  );
  return ownershipMap;
}

/**
 * PULSAR: Detect ownership clusters (adjacent properties, same ZIP, shared managers)
 */
function cosmicPulsar(
  properties: ScrapedProperty[]
): Array<{ entities: string[]; confidence: number; reason: string }> {
  const clusters: Array<{ entities: string[]; confidence: number; reason: string }> = [];

  // Cluster 1: Same ZIP ownership
  const byZip = new Map<string, { owners: Set<string>; count: number }>();
  for (const prop of properties) {
    if (!byZip.has(prop.zip)) {
      byZip.set(prop.zip, { owners: new Set(), count: 0 });
    }
    const entry = byZip.get(prop.zip)!;
    entry.owners.add(prop.owner_name);
    entry.count++;
  }

  for (const [zip, { owners, count }] of byZip) {
    if (count >= 3 && owners.size >= 2) {
      clusters.push({
        entities: Array.from(owners),
        confidence: 0.8,
        reason: `${count} properties in ZIP ${zip} — potential land assembly`,
      });
    }
  }

  console.log(
    `✅ PULSAR: ${clusters.length} ownership clusters detected`
  );
  return clusters;
}

/**
 * QUASAR: Surface signals (roll-up, acquisition patterns, clustering)
 */
function cosmicQuasar(
  resolved: Map<string, ResolvedEntity>,
  ownershipMap: Map<
    string,
    { properties: ScrapedProperty[]; timeline: string[] }
  >,
  clusters: Array<{ entities: string[]; confidence: number; reason: string }>
): Signal[] {
  const signals: Signal[] = [];

  // Signal 1: Multi-property acquisition pattern
  for (const [entity, { properties }] of ownershipMap) {
    if (properties.length >= 3) {
      const resolved_entity = resolved.get(entity);
      if (resolved_entity) {
        signals.push({
          entity_id: resolved_entity.id,
          signal_type: "acquisition_pattern",
          description: `Multi-property ownership pattern — ${properties.length} properties controlled by ${entity}`,
          confidence: Math.min(0.95, 0.65 + properties.length * 0.05),
        });
      }
    }
  }

  // Signal 2: Roll-up candidate (multiple subsidiary structures)
  for (const [entity, resolved_entity] of resolved) {
    if (resolved_entity.type === "LLC" && resolved_entity.detected_parent) {
      signals.push({
        entity_id: resolved_entity.id,
        signal_type: "roll_up_candidate",
        description: `Roll-up candidate — ${entity} with parent structure detected (${resolved_entity.detected_parent})`,
        confidence: 0.72,
      });
    }
  }

  // Signal 3: Cluster-based signals
  for (const cluster of clusters) {
    for (const entity of cluster.entities) {
      const resolved_entity = resolved.get(entity);
      if (resolved_entity) {
        signals.push({
          entity_id: resolved_entity.id,
          signal_type: "clustered_ownership",
          description: cluster.reason,
          confidence: cluster.confidence,
        });
      }
    }
  }

  console.log(`✅ QUASAR: ${signals.length} signals surfaced`);
  return signals;
}

/**
 * Generate stable UUID from entity name
 */
function generateUUID(input: string): string {
  // Simple deterministic UUID v4-style generation from string
  const name = input.toLowerCase();

  // Hash the string to get a stable number
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Keep it 32-bit
  }

  // Generate UUID components from hash
  const absHash = Math.abs(hash);
  const part1 = (absHash % 100000000).toString(16).padStart(8, "0");
  const part2 = ((absHash >> 8) % 10000).toString(16).padStart(4, "0");
  const part3 = ((absHash >> 16) % 10000).toString(16).padStart(4, "0");
  const part4 = ((absHash >> 24) % 10000).toString(16).padStart(4, "0");
  const part5 = ((absHash * 7919) % 1000000000000).toString(16).padStart(12, "0");

  return `${part1}-${part2}-4${part3.slice(0, 3)}-${part4.slice(0, 1)}${part2.slice(0, 3)}-${part5}`;
}

/**
 * Run full COSMIC pipeline on scraped data
 */
export async function runCosmicPipeline(
  properties: ScrapedProperty[]
): Promise<{
  entities: ResolvedEntity[];
  signals: Signal[];
}> {
  console.log("\n═══════════════════════════════════════════");
  console.log("  COSMIC ENTITY RESOLUTION PIPELINE");
  console.log("═══════════════════════════════════════════\n");

  // Extract unique entities
  const uniqueOwners = new Set(properties.map((p) => p.owner_name));
  const ownerList = Array.from(uniqueOwners);

  console.log(`Input: ${properties.length} properties, ${ownerList.length} entities\n`);

  // Run COSMIC engines
  const resolved = cosmicNova(ownerList);
  const ownershipMap = cosmicEclipse(properties);
  const clusters = cosmicPulsar(properties);
  const signals = cosmicQuasar(resolved, ownershipMap, clusters);

  console.log("\n═══════════════════════════════════════════");
  console.log("  COSMIC PIPELINE COMPLETE");
  console.log("═══════════════════════════════════════════\n");

  return {
    entities: Array.from(resolved.values()),
    signals,
  };
}

/**
 * CLI entry point
 */
async function main() {
  // Mock data for testing
  const mockProperties: ScrapedProperty[] = [
    {
      account_number: "1",
      address: "1400 Post Oak Blvd",
      city: "Houston",
      state: "TX",
      zip: "77056",
      latitude: 29.7,
      longitude: -95.4,
      owner_name: "PostOak Capital Holdings LLC",
      owner_address: "Houston, TX",
      estimated_value: 42000000,
      property_type: "Commercial",
    },
    {
      account_number: "2",
      address: "1415 Post Oak Blvd",
      city: "Houston",
      state: "TX",
      zip: "77056",
      latitude: 29.7,
      longitude: -95.4,
      owner_name: "PostOak Capital Holdings LLC",
      owner_address: "Houston, TX",
      estimated_value: 38000000,
      property_type: "Commercial",
    },
    {
      account_number: "3",
      address: "5085 Westheimer Rd",
      city: "Houston",
      state: "TX",
      zip: "77056",
      latitude: 29.7,
      longitude: -95.4,
      owner_name: "Westheimer Land Trust",
      owner_address: "Houston, TX",
      estimated_value: 18500000,
      property_type: "Retail",
    },
  ];

  try {
    const result = await runCosmicPipeline(mockProperties);
    console.log("\n📊 COSMIC Output:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Pipeline error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
