-- Base production profile layer — well-level, monthly, 5 years forward from
-- 1 Jul 2026. This is independent of the business-plan schema (fiscal_years /
-- plan_versions / plan_monthly_values) — it's the raw base case those will
-- eventually read from, once DCA exists to generate it for real.

create extension if not exists "pgcrypto";

-- Reuses the `wells` table if the business-plan schema already created one
-- (adds the columns this module needs); creates it fresh otherwise.
create table if not exists wells (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table wells add column if not exists well_type text;
alter table wells add column if not exists cgr numeric(10, 4); -- bbl/MMscf, gas wells only
alter table wells add column if not exists gor numeric(10, 4); -- scf/bbl, oil wells only

alter table wells drop constraint if exists wells_well_type_check;
alter table wells add constraint wells_well_type_check
  check (well_type is null or well_type in ('gas', 'oil'));

create table if not exists well_monthly_profile (
  id uuid primary key default gen_random_uuid(),
  well_id uuid not null references wells(id) on delete cascade,
  month_date date not null, -- always the 1st of the month
  oil_rate numeric(12, 2),        -- bbl/d — primary for oil wells, null for gas wells
  gas_rate numeric(12, 2),        -- Mscf/d — primary for gas wells, derived (via GOR) for oil wells
  lpg_rate numeric(12, 2),        -- bbl/d — both well types
  condensate_rate numeric(12, 2), -- bbl/d — derived (via CGR) for gas wells, null for oil wells
  unique (well_id, month_date)
);

create index if not exists idx_profile_well on well_monthly_profile (well_id);
create index if not exists idx_profile_month on well_monthly_profile (month_date);

-- Dev-phase RLS: open behind the anon key, same as the rest of the app right
-- now. Tighten before this is reachable outside the team.
alter table wells enable row level security;
alter table well_monthly_profile enable row level security;

drop policy if exists "dev_open_wells" on wells;
create policy "dev_open_wells" on wells for all using (true) with check (true);

drop policy if exists "dev_open_well_monthly_profile" on well_monthly_profile;
create policy "dev_open_well_monthly_profile" on well_monthly_profile for all using (true) with check (true);
