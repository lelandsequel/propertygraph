-- PropertyGraph schema expansion for Texas statewide ingest
-- Adds CAD-specific columns to properties table

ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS acct_number text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS cad_source text,
  ADD COLUMN IF NOT EXISTS legal_description text,
  ADD COLUMN IF NOT EXISTS property_use text,
  ADD COLUMN IF NOT EXISTS appraisal_year int,
  ADD COLUMN IF NOT EXISTS land_value numeric,
  ADD COLUMN IF NOT EXISTS improvement_value numeric,
  ADD COLUMN IF NOT EXISTS total_appraised_value numeric,
  ADD COLUMN IF NOT EXISTS market_value numeric,
  ADD COLUMN IF NOT EXISTS lot_sqft numeric,
  ADD COLUMN IF NOT EXISTS building_sqft numeric,
  ADD COLUMN IF NOT EXISTS year_built int,
  ADD COLUMN IF NOT EXISTS deed_date text,
  ADD COLUMN IF NOT EXISTS deed_volume text,
  ADD COLUMN IF NOT EXISTS deed_page text,
  ADD COLUMN IF NOT EXISTS raw_data jsonb;

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county);
CREATE INDEX IF NOT EXISTS idx_properties_acct ON properties(acct_number);
CREATE INDEX IF NOT EXISTS idx_properties_use ON properties(property_use);
CREATE INDEX IF NOT EXISTS idx_properties_value ON properties(total_appraised_value);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);

-- Expand entities table for Texas entities
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS tx_charter_number text,
  ADD COLUMN IF NOT EXISTS sos_filing_date text,
  ADD COLUMN IF NOT EXISTS registered_agent text,
  ADD COLUMN IF NOT EXISTS principal_office text;

-- Create ingest progress tracking table
CREATE TABLE IF NOT EXISTS ingest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  county text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  records_ingested int DEFAULT 0,
  status text DEFAULT 'running',
  error_msg text
);
