/**
 * PROPERTYGRAPH Seed Data Generator
 * Outputs SQL for Supabase SQL Editor
 * Run: npx tsx scripts/ingest/seed.ts > seed.sql
 */

// ─── STABLE UUIDs ──────────────────────────────────────────────────

const PROPERTY_IDS = {
  p1: "a0000000-0000-0000-0000-000000000001",
  p2: "a0000000-0000-0000-0000-000000000002",
  p3: "a0000000-0000-0000-0000-000000000003",
  p4: "a0000000-0000-0000-0000-000000000004",
  p5: "a0000000-0000-0000-0000-000000000005",
  p6: "a0000000-0000-0000-0000-000000000006",
  p7: "a0000000-0000-0000-0000-000000000007",
  p8: "a0000000-0000-0000-0000-000000000008",
  p9: "a0000000-0000-0000-0000-000000000009",
  p10: "a0000000-0000-0000-0000-000000000010",
  p11: "a0000000-0000-0000-0000-000000000011",
  p12: "a0000000-0000-0000-0000-000000000012",
  p13: "a0000000-0000-0000-0000-000000000013",
  p14: "a0000000-0000-0000-0000-000000000014",
  p15: "a0000000-0000-0000-0000-000000000015",
};

const ENTITY_IDS = {
  e1: "b0000000-0000-0000-0000-000000000001", // PostOak Capital Holdings LLC
  e2: "b0000000-0000-0000-0000-000000000002", // Westheimer Land Trust
  e3: "b0000000-0000-0000-0000-000000000003", // Gulf Realty Partners LLC
  e4: "b0000000-0000-0000-0000-000000000004", // Bayou Holdings Group Inc
  e5: "b0000000-0000-0000-0000-000000000005", // 610 Loop Ventures LLC
  e6: "b0000000-0000-0000-0000-000000000006", // Marcus J. Thornton (individual)
  e7: "b0000000-0000-0000-0000-000000000007", // Greenway Plaza Management Corp
  e8: "b0000000-0000-0000-0000-000000000008", // Thornton Family Trust
};

// ─── SCHEMA ──────────────────────────────────────────────────────

const SCHEMA_SQL = `
-- PROPERTYGRAPH Schema
-- Run this first in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text,
  city text,
  state text,
  zip text,
  lat float,
  lng float,
  estimated_value numeric
);

CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text,
  registered_state text
);

CREATE TABLE IF NOT EXISTS ownership_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  entity_id uuid REFERENCES entities(id),
  ownership_pct float
);

CREATE TABLE IF NOT EXISTS entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_entity_id uuid REFERENCES entities(id),
  child_entity_id uuid REFERENCES entities(id),
  relationship_type text
);

CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES entities(id),
  signal_type text,
  description text,
  confidence float
);
`;

// ─── PROPERTIES ──────────────────────────────────────────────────

const properties = [
  { id: PROPERTY_IDS.p1, address: "1400 Post Oak Blvd", city: "Houston", state: "TX", zip: "77056", lat: 29.7372, lng: -95.4611, estimated_value: 42500000 },
  { id: PROPERTY_IDS.p2, address: "1415 Post Oak Blvd", city: "Houston", state: "TX", zip: "77056", lat: 29.7375, lng: -95.4608, estimated_value: 38000000 },
  { id: PROPERTY_IDS.p3, address: "1500 Post Oak Blvd", city: "Houston", state: "TX", zip: "77056", lat: 29.7380, lng: -95.4605, estimated_value: 27500000 },
  { id: PROPERTY_IDS.p4, address: "1550 Post Oak Blvd", city: "Houston", state: "TX", zip: "77056", lat: 29.7385, lng: -95.4600, estimated_value: 31000000 },
  { id: PROPERTY_IDS.p5, address: "5085 Westheimer Rd", city: "Houston", state: "TX", zip: "77056", lat: 29.7390, lng: -95.4620, estimated_value: 18500000 },
  { id: PROPERTY_IDS.p6, address: "5100 Westheimer Rd", city: "Houston", state: "TX", zip: "77056", lat: 29.7388, lng: -95.4625, estimated_value: 15200000 },
  { id: PROPERTY_IDS.p7, address: "2800 Post Oak Blvd", city: "Houston", state: "TX", zip: "77056", lat: 29.7355, lng: -95.4615, estimated_value: 50000000 },
  { id: PROPERTY_IDS.p8, address: "3700 Buffalo Speedway", city: "Houston", state: "TX", zip: "77098", lat: 29.7280, lng: -95.4280, estimated_value: 8200000 },
  { id: PROPERTY_IDS.p9, address: "4200 Montrose Blvd", city: "Houston", state: "TX", zip: "77006", lat: 29.7310, lng: -95.3920, estimated_value: 5400000 },
  { id: PROPERTY_IDS.p10, address: "1001 Fannin St", city: "Houston", state: "TX", zip: "77002", lat: 29.7525, lng: -95.3592, estimated_value: 22000000 },
  { id: PROPERTY_IDS.p11, address: "910 Louisiana St", city: "Houston", state: "TX", zip: "77002", lat: 29.7560, lng: -95.3625, estimated_value: 35000000 },
  { id: PROPERTY_IDS.p12, address: "3900 Essex Ln", city: "Houston", state: "TX", zip: "77027", lat: 29.7340, lng: -95.4480, estimated_value: 4800000 },
  { id: PROPERTY_IDS.p13, address: "2425 West Loop S", city: "Houston", state: "TX", zip: "77027", lat: 29.7420, lng: -95.4570, estimated_value: 12500000 },
  { id: PROPERTY_IDS.p14, address: "6560 Fannin St", city: "Houston", state: "TX", zip: "77030", lat: 29.7145, lng: -95.3970, estimated_value: 9800000 },
  { id: PROPERTY_IDS.p15, address: "777 Post Oak Blvd", city: "Houston", state: "TX", zip: "77056", lat: 29.7365, lng: -95.4590, estimated_value: 19500000 },
];

// ─── ENTITIES ────────────────────────────────────────────────────

const entities = [
  { id: ENTITY_IDS.e1, name: "PostOak Capital Holdings LLC", type: "LLC", registered_state: "TX" },
  { id: ENTITY_IDS.e2, name: "Westheimer Land Trust", type: "Trust", registered_state: "TX" },
  { id: ENTITY_IDS.e3, name: "Gulf Realty Partners LLC", type: "LLC", registered_state: "DE" },
  { id: ENTITY_IDS.e4, name: "Bayou Holdings Group Inc", type: "Corporation", registered_state: "TX" },
  { id: ENTITY_IDS.e5, name: "610 Loop Ventures LLC", type: "LLC", registered_state: "TX" },
  { id: ENTITY_IDS.e6, name: "Marcus J. Thornton", type: "Individual", registered_state: "TX" },
  { id: ENTITY_IDS.e7, name: "Greenway Plaza Management Corp", type: "Corporation", registered_state: "TX" },
  { id: ENTITY_IDS.e8, name: "Thornton Family Trust", type: "Trust", registered_state: "TX" },
];

// ─── OWNERSHIP LINKS ────────────────────────────────────────────
// PostOak Capital Holdings → 6 properties (the main "assembler")
// Westheimer Land Trust → 2 properties
// Gulf Realty Partners → 3 properties
// Bayou Holdings → 2 properties
// 610 Loop Ventures → 1 property
// Greenway Plaza Management → 1 property

const ownershipLinks = [
  // PostOak Capital Holdings LLC owns 6 properties (the assembler)
  { property_id: PROPERTY_IDS.p1, entity_id: ENTITY_IDS.e1, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p2, entity_id: ENTITY_IDS.e1, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p3, entity_id: ENTITY_IDS.e1, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p4, entity_id: ENTITY_IDS.e1, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p7, entity_id: ENTITY_IDS.e1, ownership_pct: 85 },
  { property_id: PROPERTY_IDS.p15, entity_id: ENTITY_IDS.e1, ownership_pct: 100 },

  // Westheimer Land Trust owns 2 properties
  { property_id: PROPERTY_IDS.p5, entity_id: ENTITY_IDS.e2, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p6, entity_id: ENTITY_IDS.e2, ownership_pct: 100 },

  // Gulf Realty Partners LLC owns 3 properties
  { property_id: PROPERTY_IDS.p8, entity_id: ENTITY_IDS.e3, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p9, entity_id: ENTITY_IDS.e3, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p12, entity_id: ENTITY_IDS.e3, ownership_pct: 70 },

  // Bayou Holdings Group Inc owns 2 properties
  { property_id: PROPERTY_IDS.p10, entity_id: ENTITY_IDS.e4, ownership_pct: 100 },
  { property_id: PROPERTY_IDS.p11, entity_id: ENTITY_IDS.e4, ownership_pct: 100 },

  // 610 Loop Ventures LLC
  { property_id: PROPERTY_IDS.p13, entity_id: ENTITY_IDS.e5, ownership_pct: 100 },

  // Greenway Plaza Management Corp
  { property_id: PROPERTY_IDS.p14, entity_id: ENTITY_IDS.e7, ownership_pct: 100 },

  // Co-ownership: Gulf Realty also partial owner of p7
  { property_id: PROPERTY_IDS.p7, entity_id: ENTITY_IDS.e3, ownership_pct: 15 },

  // Co-ownership: 610 Loop also partial owner of p12
  { property_id: PROPERTY_IDS.p12, entity_id: ENTITY_IDS.e5, ownership_pct: 30 },
];

// ─── ENTITY RELATIONSHIPS ───────────────────────────────────────
// Marcus Thornton → Thornton Family Trust (beneficiary)
// Thornton Family Trust → PostOak Capital Holdings LLC (member_of)
// Thornton Family Trust → Westheimer Land Trust (manages)
// Bayou Holdings Group → PostOak Capital Holdings LLC (parent)
// Marcus Thornton → Gulf Realty Partners LLC (manages)
// Marcus Thornton → 610 Loop Ventures LLC (manages)
// Marcus Thornton → Greenway Plaza Management Corp (manages)
// Bayou Holdings → 610 Loop Ventures LLC (parent)

const entityRelationships = [
  { parent_entity_id: ENTITY_IDS.e6, child_entity_id: ENTITY_IDS.e8, relationship_type: "beneficiary" },
  { parent_entity_id: ENTITY_IDS.e8, child_entity_id: ENTITY_IDS.e1, relationship_type: "member_of" },
  { parent_entity_id: ENTITY_IDS.e8, child_entity_id: ENTITY_IDS.e2, relationship_type: "manages" },
  { parent_entity_id: ENTITY_IDS.e4, child_entity_id: ENTITY_IDS.e1, relationship_type: "parent" },
  { parent_entity_id: ENTITY_IDS.e6, child_entity_id: ENTITY_IDS.e3, relationship_type: "manages" },
  { parent_entity_id: ENTITY_IDS.e6, child_entity_id: ENTITY_IDS.e5, relationship_type: "manages" },
  { parent_entity_id: ENTITY_IDS.e6, child_entity_id: ENTITY_IDS.e7, relationship_type: "manages" },
  { parent_entity_id: ENTITY_IDS.e4, child_entity_id: ENTITY_IDS.e5, relationship_type: "parent" },
];

// ─── SIGNALS ─────────────────────────────────────────────────────

const signals = [
  {
    entity_id: ENTITY_IDS.e1,
    signal_type: "acquisition_pattern",
    description: "Multi-property acquisition pattern — 6 properties acquired in 18 months along Post Oak Blvd corridor",
    confidence: 0.92,
  },
  {
    entity_id: ENTITY_IDS.e1,
    signal_type: "clustered_ownership",
    description: "Clustered ownership — 4 adjacent parcels in ZIP 77056, potential assemblage play",
    confidence: 0.78,
  },
  {
    entity_id: ENTITY_IDS.e6,
    signal_type: "roll_up_candidate",
    description: "Shared manager across 7 entities — likely roll-up candidate. Marcus J. Thornton appears as manager/beneficiary across PostOak Capital, Gulf Realty, 610 Loop Ventures, Greenway Plaza Mgmt, Westheimer Land Trust, and Thornton Family Trust",
    confidence: 0.89,
  },
];

// ─── SQL OUTPUT ──────────────────────────────────────────────────

function escapeSQL(val: string): string {
  return val.replace(/'/g, "''");
}

function generateSQL(): string {
  const lines: string[] = [];

  lines.push("-- ═══════════════════════════════════════════════════════");
  lines.push("-- PROPERTYGRAPH — Seed Data for Harris County TX CRE");
  lines.push("-- Generated by scripts/ingest/seed.ts");
  lines.push("-- ═══════════════════════════════════════════════════════");
  lines.push("");
  lines.push(SCHEMA_SQL);
  lines.push("");

  // Clear existing data
  lines.push("-- Clear existing data");
  lines.push("DELETE FROM signals;");
  lines.push("DELETE FROM entity_relationships;");
  lines.push("DELETE FROM ownership_links;");
  lines.push("DELETE FROM entities;");
  lines.push("DELETE FROM properties;");
  lines.push("");

  // Properties
  lines.push("-- ─── Properties ───────────────────────────────────────");
  for (const p of properties) {
    lines.push(
      `INSERT INTO properties (id, address, city, state, zip, lat, lng, estimated_value) VALUES ('${p.id}', '${escapeSQL(p.address)}', '${escapeSQL(p.city)}', '${p.state}', '${p.zip}', ${p.lat}, ${p.lng}, ${p.estimated_value});`
    );
  }
  lines.push("");

  // Entities
  lines.push("-- ─── Entities ─────────────────────────────────────────");
  for (const e of entities) {
    lines.push(
      `INSERT INTO entities (id, name, type, registered_state) VALUES ('${e.id}', '${escapeSQL(e.name)}', '${escapeSQL(e.type)}', '${e.registered_state}');`
    );
  }
  lines.push("");

  // Ownership links
  lines.push("-- ─── Ownership Links ─────────────────────────────────");
  for (const o of ownershipLinks) {
    lines.push(
      `INSERT INTO ownership_links (property_id, entity_id, ownership_pct) VALUES ('${o.property_id}', '${o.entity_id}', ${o.ownership_pct});`
    );
  }
  lines.push("");

  // Entity relationships
  lines.push("-- ─── Entity Relationships ─────────────────────────────");
  for (const r of entityRelationships) {
    lines.push(
      `INSERT INTO entity_relationships (parent_entity_id, child_entity_id, relationship_type) VALUES ('${r.parent_entity_id}', '${r.child_entity_id}', '${escapeSQL(r.relationship_type)}');`
    );
  }
  lines.push("");

  // Signals
  lines.push("-- ─── Signals ─────────────────────────────────────────");
  for (const s of signals) {
    lines.push(
      `INSERT INTO signals (entity_id, signal_type, description, confidence) VALUES ('${s.entity_id}', '${escapeSQL(s.signal_type)}', '${escapeSQL(s.description)}', ${s.confidence});`
    );
  }
  lines.push("");

  lines.push("-- ═══════════════════════════════════════════════════════");
  lines.push("-- Seed complete. Run: SELECT count(*) FROM properties;");
  lines.push("-- ═══════════════════════════════════════════════════════");

  return lines.join("\n");
}

console.log(generateSQL());
