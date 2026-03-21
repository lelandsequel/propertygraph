#!/bin/bash

# PROPERTYGRAPH FULL INGEST PIPELINE
# Usage: bash scripts/run_ingest.sh [property_count]

set -e

COUNT=${1:-1000}

echo "═══════════════════════════════════════════════════════"
echo "  PROPERTYGRAPH INGEST PIPELINE"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Target: $COUNT properties"
echo "Pipeline:"
echo "  1. Harris County scraper (mock)"
echo "  2. COSMIC entity resolution"
echo "  3. Signal generation"
echo "  4. Supabase upload"
echo ""

# Run ingest
npx tsx scripts/ingest/ingest.ts "$COUNT"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  NEXT STEPS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Start dev server: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Search: 'Post Oak' or 'Marcus Thornton'"
echo "4. Click entity → View Graph for network visualization"
echo ""
