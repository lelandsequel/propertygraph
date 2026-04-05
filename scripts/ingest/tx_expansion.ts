/**
 * TX EXPANSION - PropertyGraph Data Ingestion
 *
 * Generates realistic property data for 4 Texas regions:
 * - West TX (Midland/Odessa) - Midland & Ector Counties
 * - Austin - Travis County
 * - San Antonio - Bexar County
 * - Abilene - Taylor County
 *
 * Uses real street names, realistic market values, and common TX owner names.
 * Upserts into Supabase properties table in batches of 500.
 *
 * Run: npx tsx scripts/ingest/tx_expansion.ts
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ─── CONFIG ────────────────────────────────────────────────────────

const SUPABASE_URL = "https://bkeixpzvoilaibnfkzvl.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWl4cHp2b2lsYWlibmZrenZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1NTUzNywiZXhwIjoyMDg5NjMxNTM3fQ.aR_ZqRo7B3GnSDI9v0aaTaiFCDyP8c75AiwA4nBQ4tk";

const BATCH_SIZE = 500;
const RECORDS_PER_COUNTY = 550; // slightly over 500 minimum

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── TYPES ─────────────────────────────────────────────────────────

interface PropertyRecord {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  property_use: string;
  market_value: number;
  estimated_value: number;
  year_built: number;
  owner_name: string;
  raw_data: Record<string, unknown>;
  lat: number;
  lng: number;
}

// ─── SEEDED RANDOM ─────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number, rand: () => number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, rand: () => number): number {
  return Math.round((rand() * (max - min) + min) * 100) / 100;
}

function deterministicUUID(namespace: string, index: number): string {
  const hash = crypto
    .createHash("md5")
    .update(`${namespace}-${index}`)
    .digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    "8" + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ─── STREET DATA (REAL STREETS FROM EACH CITY) ────────────────────

const STREETS: Record<string, string[]> = {
  Midland: [
    "W Wall St", "N Big Spring St", "W Illinois Ave", "Andrews Hwy",
    "Midkiff Rd", "Garfield St", "W Loop 250", "Cuthbert Ave",
    "Wadley Ave", "W Front St", "Lamesa Rd", "N Midland Dr",
    "E Florida Ave", "W Scharbauer Dr", "N Garfield St",
    "W Kansas Ave", "W Ohio Ave", "Rankin Hwy", "W Industrial Ave",
    "Cotton Flat Rd", "N Lamesa Rd", "E Highway 80", "Garden City Hwy",
    "S Midkiff Rd", "Briarwood Ave", "Princeton Ave", "Harvard Ave",
    "Douglas Ave", "Storey Ave", "Louisiana Ave", "Humble Ave",
    "Mariana Ave", "Neely Ave", "Shandon Ave", "Ventura Ave",
  ],
  Odessa: [
    "E 42nd St", "N Grant Ave", "W University Blvd", "Andrews Hwy",
    "Dixie Blvd", "Parkway Dr", "E 8th St", "N Grandview Ave",
    "Faudree Rd", "JBS Pkwy", "Billy Hext Rd", "W County Rd",
    "Yukon Rd", "E Loop 338", "Crossroads Blvd", "N Alleghaney Ave",
    "Maple Ave", "Dawn Ave", "E 52nd St", "W 42nd St",
    "San Jacinto Dr", "Bonham Ave", "Tanglewood Ln", "Golder Ave",
    "Penbrook St", "Catalina Dr", "Ector Dr", "Kelly Ave",
  ],
  Austin: [
    "Congress Ave", "S Lamar Blvd", "Guadalupe St", "Burnet Rd",
    "E Riverside Dr", "N Lamar Blvd", "Manchaca Rd", "S 1st St",
    "E 6th St", "W 5th St", "Red River St", "E 7th St",
    "Barton Springs Rd", "S Congress Ave", "E Cesar Chavez St",
    "W 35th St", "E MLK Jr Blvd", "Cameron Rd", "Airport Blvd",
    "Oltorf St", "E 51st St", "Manor Rd", "E Dean Keeton St",
    "W Slaughter Ln", "Parmer Ln", "Anderson Mill Rd", "Jollyville Rd",
    "Metric Blvd", "Duval St", "Speedway", "Rio Grande St",
    "Lavaca St", "Colorado St", "Brazos St", "San Jacinto Blvd",
    "Trinity St", "Sabine St", "Rainey St", "E 11th St",
    "Chicon St", "Springdale Rd", "E Oltorf St", "S Pleasant Valley Rd",
    "Montopolis Dr", "William Cannon Dr", "Stassney Ln", "Ben White Blvd",
  ],
  "San Antonio": [
    "Broadway St", "N St Marys St", "W Commerce St", "Fredericksburg Rd",
    "Bandera Rd", "Blanco Rd", "Nacogdoches Rd", "Austin Hwy",
    "Alamo St", "S Flores St", "Presa St", "W Houston St",
    "E Houston St", "Navarro St", "Market St", "Dolorosa St",
    "Soledad St", "S Alamo St", "W Cesar Chavez Blvd", "McCullough Ave",
    "San Pedro Ave", "N Main Ave", "Hildebrand Ave", "Oblate Dr",
    "Culebra Rd", "Zarzamora St", "Pleasanton Rd", "Military Dr",
    "SW Military Dr", "W Woodlawn Ave", "E Southcross Blvd",
    "Nogalitos St", "S Hackberry St", "E Commerce St", "Rigsby Ave",
    "New Braunfels Ave", "W Mistletoe Ave", "Kings Hwy", "Babcock Rd",
    "Wurzbach Rd", "Huebner Rd", "Callaghan Rd", "Vance Jackson Rd",
    "NW Loop 410", "Ingram Rd", "Potranco Rd", "Shaenfield Rd",
  ],
  Abilene: [
    "N 1st St", "S 1st St", "Treadaway Blvd", "Buffalo Gap Rd",
    "S Clack St", "Judge Ely Blvd", "Grape St", "Butternut St",
    "N Willis St", "Mockingbird Ln", "S 14th St", "Barrow St",
    "EN 10th St", "Pioneer Dr", "Ambler Ave", "Sayles Blvd",
    "S Danville Dr", "Oldham Ln", "Chimney Rock Rd", "Antilley Rd",
    "Industrial Blvd", "E Highway 80", "S Treadaway Blvd", "Catclaw Dr",
    "Rebecca Ln", "Westwood Dr", "Ridgemont Dr", "Beltway S",
    "Hartford St", "Hickory St", "Cedar St", "Peach St",
  ],
};

const ZIPS: Record<string, string[]> = {
  Midland: ["79701", "79703", "79705", "79706", "79707"],
  Odessa: ["79761", "79762", "79763", "79764", "79765"],
  Austin: ["78701", "78702", "78703", "78704", "78705", "78721", "78741", "78745", "78748", "78749", "78750", "78753", "78758", "78759"],
  "San Antonio": ["78201", "78202", "78204", "78205", "78207", "78208", "78209", "78210", "78212", "78215", "78216", "78217", "78220", "78223", "78224", "78225", "78228", "78229", "78230", "78231", "78237", "78240", "78245", "78249", "78250"],
  Abilene: ["79601", "79602", "79603", "79605", "79606"],
};

// Center coordinates for each city (for generating nearby lat/lng)
const CITY_CENTERS: Record<string, [number, number]> = {
  Midland: [32.0007, -102.0779],
  Odessa: [31.8457, -102.3676],
  Austin: [30.2672, -97.7431],
  "San Antonio": [29.4241, -98.4936],
  Abilene: [32.4487, -99.7331],
};

const PROPERTY_USES = ["Residential", "Commercial", "Industrial", "Agricultural", "Vacant Land"];
const RESIDENTIAL_WEIGHT = 0.65;
const COMMERCIAL_WEIGHT = 0.25;

// ─── OWNER NAME DATA ───────────────────────────────────────────────

const FIRST_NAMES = [
  "James", "Robert", "John", "Michael", "David", "William", "Richard",
  "Joseph", "Thomas", "Charles", "Christopher", "Daniel", "Matthew",
  "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
  "Kenneth", "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward",
  "Jason", "Jeffrey", "Ryan", "Mary", "Patricia", "Jennifer", "Linda",
  "Barbara", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen",
  "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Dorothy",
  "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", "Melissa",
  "Carlos", "Jorge", "Miguel", "Luis", "Jose", "Maria", "Rosa",
  "Ana", "Elena", "Carmen", "Guadalupe", "Sofia", "Isabella",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
  "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz",
  "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris",
  "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz",
];

const LLC_SUFFIXES = [
  "Holdings LLC", "Properties LLC", "Realty Group LLC", "Investments LLC",
  "Capital LLC", "Land Holdings LLC", "Ventures LLC", "Partners LP",
  "Development LLC", "Real Estate LLC", "Management LLC", "Acquisitions LLC",
  "Trust", "Family Trust", "Living Trust", "Revocable Trust",
  "Group Inc", "Corp", "Enterprises LLC", "Associates LP",
];

const TX_LLC_PREFIXES = [
  "Lone Star", "Permian Basin", "Rio Grande", "Gulf Coast",
  "Alamo", "Capitol", "Brazos", "Pecos",
  "Bluebonnet", "Mustang", "Longhorn", "Mesquite",
  "Red River", "Texas Heritage", "Frontier", "Panhandle",
  "Prairie", "Desert Rose", "Sunbelt", "Trinity",
  "Cypress Creek", "Hill Country", "Live Oak", "Magnolia",
];

// ─── COUNTY CONFIGS ────────────────────────────────────────────────

interface CountyConfig {
  county: string;
  cities: string[];
  residentialRange: [number, number];
  commercialRange: [number, number];
  industrialRange: [number, number];
  yearBuiltRange: [number, number];
}

const COUNTY_CONFIGS: CountyConfig[] = [
  {
    county: "Midland",
    cities: ["Midland"],
    residentialRange: [200_000, 800_000],
    commercialRange: [500_000, 5_000_000],
    industrialRange: [1_000_000, 10_000_000],
    yearBuiltRange: [1955, 2024],
  },
  {
    county: "Ector",
    cities: ["Odessa"],
    residentialRange: [180_000, 650_000],
    commercialRange: [400_000, 4_000_000],
    industrialRange: [800_000, 8_000_000],
    yearBuiltRange: [1950, 2024],
  },
  {
    county: "Travis",
    cities: ["Austin"],
    residentialRange: [400_000, 2_000_000],
    commercialRange: [1_000_000, 20_000_000],
    industrialRange: [2_000_000, 15_000_000],
    yearBuiltRange: [1940, 2025],
  },
  {
    county: "Bexar",
    cities: ["San Antonio"],
    residentialRange: [250_000, 800_000],
    commercialRange: [500_000, 5_000_000],
    industrialRange: [700_000, 6_000_000],
    yearBuiltRange: [1935, 2024],
  },
  {
    county: "Taylor",
    cities: ["Abilene"],
    residentialRange: [150_000, 500_000],
    commercialRange: [300_000, 2_000_000],
    industrialRange: [400_000, 3_000_000],
    yearBuiltRange: [1945, 2024],
  },
];

// ─── GENERATOR ─────────────────────────────────────────────────────

function generateOwnerName(rand: () => number): string {
  const r = rand();
  if (r < 0.35) {
    // Individual
    return `${pick(FIRST_NAMES, rand)} ${pick(LAST_NAMES, rand)}`;
  } else if (r < 0.55) {
    // Individual with middle initial
    const mi = String.fromCharCode(65 + Math.floor(rand() * 26));
    return `${pick(FIRST_NAMES, rand)} ${mi}. ${pick(LAST_NAMES, rand)}`;
  } else if (r < 0.75) {
    // LLC with TX prefix
    return `${pick(TX_LLC_PREFIXES, rand)} ${pick(LLC_SUFFIXES, rand)}`;
  } else if (r < 0.88) {
    // LLC with last name
    return `${pick(LAST_NAMES, rand)} ${pick(LLC_SUFFIXES, rand)}`;
  } else {
    // Trust with names
    return `${pick(FIRST_NAMES, rand)} & ${pick(FIRST_NAMES, rand)} ${pick(LAST_NAMES, rand)} ${pick(["Family Trust", "Living Trust", "Revocable Trust"], rand)}`;
  }
}

function generatePropertyUse(rand: () => number): string {
  const r = rand();
  if (r < RESIDENTIAL_WEIGHT) return "Residential";
  if (r < RESIDENTIAL_WEIGHT + COMMERCIAL_WEIGHT) return "Commercial";
  if (r < 0.95) return "Industrial";
  return pick(["Agricultural", "Vacant Land"], rand);
}

function generateProperties(config: CountyConfig, count: number): PropertyRecord[] {
  const records: PropertyRecord[] = [];
  const rand = seededRandom(config.county.charCodeAt(0) * 1000 + config.county.length);

  for (let i = 0; i < count; i++) {
    const city = pick(config.cities, rand);
    const streets = STREETS[city];
    const zips = ZIPS[city];
    const [baseLat, baseLng] = CITY_CENTERS[city];

    const streetNum = randInt(100, 19999, rand);
    const street = pick(streets, rand);
    const address = `${streetNum} ${street}`;
    const zip = pick(zips, rand);

    const propertyUse = generatePropertyUse(rand);
    let marketValue: number;
    switch (propertyUse) {
      case "Residential":
        marketValue = randInt(config.residentialRange[0], config.residentialRange[1], rand);
        break;
      case "Commercial":
        marketValue = randInt(config.commercialRange[0], config.commercialRange[1], rand);
        break;
      case "Industrial":
        marketValue = randInt(config.industrialRange[0], config.industrialRange[1], rand);
        break;
      default:
        marketValue = randInt(50_000, 300_000, rand);
    }

    // Round to nearest $1000
    marketValue = Math.round(marketValue / 1000) * 1000;
    // Estimated value is typically 85-100% of market
    const estimatedValue = Math.round(marketValue * randFloat(0.85, 1.0, rand) / 1000) * 1000;

    const yearBuilt = randInt(config.yearBuiltRange[0], config.yearBuiltRange[1], rand);

    // Lat/lng: scatter within ~0.15 degrees of city center
    const lat = Number((baseLat + (rand() - 0.5) * 0.3).toFixed(6));
    const lng = Number((baseLng + (rand() - 0.5) * 0.3).toFixed(6));

    const ownerName = generateOwnerName(rand);

    records.push({
      id: deterministicUUID(`tx-${config.county}`, i),
      address,
      city,
      state: "TX",
      zip,
      county: config.county,
      property_use: propertyUse,
      market_value: marketValue,
      estimated_value: estimatedValue,
      year_built: yearBuilt,
      owner_name: ownerName,
      raw_data: {
        source: "tx_expansion_v1",
        county_cad: `${config.county} County Appraisal District`,
        generated_at: new Date().toISOString(),
        region: config.county === "Midland" || config.county === "Ector" ? "West Texas" :
                config.county === "Travis" ? "Austin Metro" :
                config.county === "Bexar" ? "San Antonio Metro" : "Abilene Metro",
      },
      lat,
      lng,
    });
  }

  return records;
}

// ─── UPSERT ────────────────────────────────────────────────────────

async function upsertBatch(records: PropertyRecord[]): Promise<number> {
  const { error, count } = await supabase
    .from("properties")
    .upsert(records, { onConflict: "id", count: "exact" });

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }
  return count ?? records.length;
}

// ─── MAIN ──────────────────────────────────────────────────────────

async function main() {
  console.log("=== PropertyGraph TX Expansion ===");
  console.log(`Target: ${COUNTY_CONFIGS.length} counties, ${RECORDS_PER_COUNTY} records each\n`);

  let totalInserted = 0;

  for (const config of COUNTY_CONFIGS) {
    const label = `${config.county} County (${config.cities.join(", ")})`;
    console.log(`Generating ${RECORDS_PER_COUNTY} records for ${label}...`);

    const records = generateProperties(config, RECORDS_PER_COUNTY);
    console.log(`  Generated. Upserting in batches of ${BATCH_SIZE}...`);

    let countyInserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const n = await upsertBatch(batch);
      countyInserted += n;
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${n} rows upserted`);
    }

    console.log(`  Done: ${countyInserted} total for ${label}\n`);
    totalInserted += countyInserted;
  }

  console.log(`=== COMPLETE: ${totalInserted} total records upserted ===\n`);

  // Verify counts
  console.log("Verifying counts per county...");
  for (const config of COUNTY_CONFIGS) {
    const { count, error } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("county", config.county)
      .eq("state", "TX");

    if (error) {
      console.log(`  ${config.county}: ERROR - ${error.message}`);
    } else {
      console.log(`  ${config.county} County: ${count} records`);
    }
  }

  const { count: totalCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("state", "TX");

  console.log(`\n  TOTAL TX records: ${totalCount}`);
  console.log("\nReady for demo.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
