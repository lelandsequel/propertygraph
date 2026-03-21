/**
 * BOSTON COMMERCIAL REAL ESTATE SCRAPER
 * 
 * Generates Boston-area property dataset for PropertyGraph
 * Uses real estate patterns from major Boston markets:
 * - Downtown Financial District
 * - Back Bay / Copley
 * - Cambridge / Kendall Square
 * - Seaport District
 * - Logan Airport area
 */

interface BostonProperty {
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
 * Generate Boston-area properties
 */
export function generateBostonDataset(count: number): BostonProperty[] {
  const properties: BostonProperty[] = [];

  const owners = [
    "Boston Properties Inc",
    "Equity Commonwealth REIT",
    "Beacon Capital Partners",
    "Feinberg Capital Group", // Josh's firm?
    "Berkley Partners Real Estate",
    "Seaport Investment Group",
    "Cambridge Innovation District",
    "Downtown Boston Properties",
    "Back Bay Development Corp",
    "Logan Real Estate Holdings",
    "Kendall Square Partners",
    "Charles River Development",
    "Bay State Properties LLC",
    "North Shore Realty Partners",
    "Financial District Holdings",
    "Commonwealth Real Estate",
    "New England Capital Group",
    "Boston Harbor Properties",
    "Innovation Hub Investors",
    "Copley Partners LLC",
  ];

  const streets = [
    "Congress St", // Financial District
    "Broad St",
    "Atlantic Ave",
    "Federal St",
    "Newbury St", // Back Bay
    "Boylston St",
    "Copley Pl",
    "Huntington Ave",
    "Brookline Ave",
    "Massachusetts Ave", // Cambridge
    "Memorial Dr",
    "Charles St",
    "Seaport Blvd", // Seaport
    "Evelyn Moakley Bridge",
    "Farnsworth St",
    "Harborwalk",
    "Hanover St", // North End
    "Salem St",
    "Prince St",
    "Lansdowne St", // Kenmore/Fenway
  ];

  const cities = [
    "Boston", "Cambridge", "Somerville", "Brookline", "Newton",
    "Waltham", "Medford", "Watertown", "Quincy", "Arlington"
  ];

  const zips = [
    "02108", "02109", "02110", "02111", "02113", "02114", "02115", "02116",
    "02118", "02119", "02120", "02121", "02122", "02125", "02126", "02127",
    "02128", "02129", "02130", "02131", "02215", "02134", "02138", "02139",
    "02139", "02140", "02141", "02144", "02145", "02148", "02150", "02151",
  ];

  // Boston coordinates (center: 42.3601°N, 71.0589°W)
  const bostonLat = 42.3601;
  const bostonLng = -71.0589;

  for (let i = 0; i < count; i++) {
    const owner = owners[Math.floor(Math.random() * owners.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const zip = zips[Math.floor(Math.random() * zips.length)];
    const address = 1 + (i % 1000) * 2;

    // Scatter properties around Boston metro area (±0.2 degrees)
    const latOffset = (Math.random() - 0.5) * 0.2;
    const lngOffset = (Math.random() - 0.5) * 0.2;

    properties.push({
      account_number: `BOS-${zip}-${i.toString().padStart(6, "0")}`,
      address: `${address} ${street}`,
      city,
      state: "MA",
      zip,
      latitude: bostonLat + latOffset,
      longitude: bostonLng + lngOffset,
      owner_name: owner,
      owner_address: "Boston, MA",
      estimated_value: Math.floor(Math.random() * 150000000) + 10000000, // Boston higher values
      property_type: ["Commercial", "Office", "Life Sciences", "Retail", "Mixed-Use"][
        Math.floor(Math.random() * 5)
      ],
    });
  }

  return properties;
}

// CLI
if (require.main === module) {
  const count = parseInt(process.argv[2] || "1000");
  const data = generateBostonDataset(count);
  console.log(JSON.stringify({
    generated: data.length,
    sample: data.slice(0, 5),
  }, null, 2));
}
