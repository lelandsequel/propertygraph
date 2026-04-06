create table if not exists properties_clean (
  id uuid primary key default gen_random_uuid(),
  address text,
  city text,
  state text,
  zip text,
  county text,
  parcel_id text,
  land_value numeric,
  improvement_value numeric,
  total_appraised_value numeric,
  market_value numeric,
  lot_sqft numeric,
  building_sqft numeric,
  year_built integer,
  lat numeric,
  lng numeric,
  owner_name text,
  source text,
  created_at timestamp default now()
);
create index if not exists idx_properties_clean_address on properties_clean(address);
create index if not exists idx_properties_clean_county on properties_clean(county);

create table if not exists entity_properties (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities(id),
  property_id uuid references properties_clean(id),
  ownership_percent numeric,
  created_at timestamp default now()
);
