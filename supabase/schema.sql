-- Business Plan module — core schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------- Reference data ----------

create table if not exists fields (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  asset text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists wells (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references fields(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (field_id, name)
);

create index if not exists idx_wells_field on wells (field_id);

-- ---------- Fiscal years & plan versions ----------

create table if not exists fiscal_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,      -- e.g. 'FY2027'
  start_date date not null,
  end_date date not null
);

create table if not exists plan_versions (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references fiscal_years(id) on delete cascade,
  name text not null,              -- 'Budget', 'Revised Forecast', 'Scenario A'
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'locked')),
  created_at timestamptz not null default now(),
  unique (fiscal_year_id, name)
);

create index if not exists idx_versions_fy on plan_versions (fiscal_year_id);

-- ---------- Monthly plan values ----------
-- One row per well, per month (1-12 within the fiscal year), per version.
-- is_override marks a cell that was hand-entered / hand-edited rather than
-- coming straight from the DCA module (which doesn't exist yet — for now
-- every value is entered directly, so most rows will have is_override = true).

create table if not exists plan_monthly_values (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references plan_versions(id) on delete cascade,
  well_id uuid not null references wells(id) on delete cascade,
  month_index smallint not null check (month_index between 1 and 12),
  oil_rate numeric(12, 2) not null default 0,
  gas_rate numeric(12, 2) not null default 0,
  water_rate numeric(12, 2) not null default 0,
  is_override boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (version_id, well_id, month_index)
);

create index if not exists idx_values_version on plan_monthly_values (version_id);
create index if not exists idx_values_well on plan_monthly_values (well_id);

-- ---------- Row Level Security ----------
-- Dev-phase policy: wide open behind the anon key, since there's no auth
-- layer yet and this is only reachable by trusted internal users on a
-- shared link. TIGHTEN THIS before wider deployment (add Supabase Auth +
-- policies scoped to authenticated users, at minimum).

alter table fields enable row level security;
alter table wells enable row level security;
alter table fiscal_years enable row level security;
alter table plan_versions enable row level security;
alter table plan_monthly_values enable row level security;

create policy "dev_open_fields" on fields for all using (true) with check (true);
create policy "dev_open_wells" on wells for all using (true) with check (true);
create policy "dev_open_fiscal_years" on fiscal_years for all using (true) with check (true);
create policy "dev_open_plan_versions" on plan_versions for all using (true) with check (true);
create policy "dev_open_plan_monthly_values" on plan_monthly_values for all using (true) with check (true);

-- Supabase now requires explicit grants for PostgREST access on new projects
-- (rolling out through late 2026). If the API returns permission errors,
-- run:
-- grant usage on schema public to anon, authenticated;
-- grant all on all tables in schema public to anon, authenticated;
