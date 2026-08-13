-- Business Plan canvas — activity cards.
-- Each row is one card on the canvas: a planned activity that adds (or, for
-- P&A, ends) production, placed on a field swimlane at its on-production month.
-- Cards are never deleted — dropped activities are marked, not removed.

create extension if not exists "pgcrypto";

create table if not exists plan_activities (
  id uuid primary key default gen_random_uuid(),

  activity_type text not null
    check (activity_type in ('new_well', 'workover_revival', 'workover_enhancement', 'pna')),
  well_category text
    check (well_category is null or well_category in ('oil', 'gas')),

  -- descriptive / location
  field_name text not null,
  well_name text,
  block text,
  region text,

  -- placement on the canvas: the month the activity comes on production
  onprod_date date not null, -- always the 1st of the month

  -- production assumptions (null for P&A)
  start_rate numeric(12, 2),   -- initial rate at onprod month
  decline_rate numeric(6, 4),  -- annual exponential decline fraction, e.g. 0.15

  -- lifecycle
  status text not null default 'active'
    check (status in ('active', 'dropped')),
  drop_reason text,

  is_edited boolean not null default false, -- true once edited after first save

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_activities_field on plan_activities (field_name);
create index if not exists idx_activities_onprod on plan_activities (onprod_date);

-- Append-only change log shown inside each card: every edit and every move,
-- with a before/after snapshot and an optional typed reason.
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references plan_activities(id) on delete cascade,
  kind text not null check (kind in ('created', 'edited', 'moved', 'dropped')),
  reason text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_log_activity on activity_log (activity_id);

-- Dev-phase RLS: open behind the anon key, consistent with the rest of the app.
alter table plan_activities enable row level security;
alter table activity_log enable row level security;

drop policy if exists "dev_open_plan_activities" on plan_activities;
create policy "dev_open_plan_activities" on plan_activities for all using (true) with check (true);

drop policy if exists "dev_open_activity_log" on activity_log;
create policy "dev_open_activity_log" on activity_log for all using (true) with check (true);

-- A few sample cards so the canvas isn't empty on first load.
insert into plan_activities
  (activity_type, well_category, field_name, well_name, block, region, onprod_date, start_rate, decline_rate)
values
  ('new_well', 'oil', 'Field-01', 'Field-01-W07', 'Block-A', 'North', '2027-02-01', 1200, 0.18),
  ('workover_enhancement', 'gas', 'Field-01', 'Field-01-W03', 'Block-A', 'North', '2027-06-01', 4200, 0.12),
  ('new_well', 'gas', 'Field-02', 'Field-02-W04', 'Block-B', 'North', '2028-03-01', 6800, 0.22),
  ('workover_revival', 'oil', 'Field-03', 'Field-03-W02', 'Block-C', 'South', '2027-09-01', 650, 0.20),
  ('new_well', 'oil', 'Field-03', 'Field-03-W09', 'Block-C', 'South', '2029-01-01', 900, 0.16),
  ('pna', null, 'Field-02', 'Field-02-W01', 'Block-B', 'North', '2030-05-01', null, null);
