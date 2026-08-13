-- Placeholder data for local development / UI testing.
-- 10 fields, 3-8 wells each, one fiscal year (FY2027), one 'Budget' version,
-- randomized monthly rates so the grid isn't empty while you build against it.

do $$
declare
  fy_id uuid;
  ver_id uuid;
  fld_id uuid;
  well_id uuid;
  well_counts int[] := array[5, 3, 8, 4, 6, 3, 7, 5, 4, 6];
  i int;
  j int;
begin
  insert into fiscal_years (label, start_date, end_date)
  values ('FY2027', '2026-07-01', '2027-06-30')
  returning id into fy_id;

  insert into plan_versions (fiscal_year_id, name, status)
  values (fy_id, 'Budget', 'draft')
  returning id into ver_id;

  for i in 1..10 loop
    insert into fields (name, asset)
    values ('Field-' || lpad(i::text, 2, '0'), 'Placeholder Asset')
    returning id into fld_id;

    for j in 1..well_counts[i] loop
      insert into wells (field_id, name)
      values (fld_id, 'Field-' || lpad(i::text, 2, '0') || '-W' || lpad(j::text, 2, '0'))
      returning id into well_id;

      insert into plan_monthly_values (version_id, well_id, month_index, oil_rate, gas_rate, water_rate, is_override)
      select
        ver_id,
        well_id,
        m,
        round((random() * 200 + 50)::numeric, 1),
        round((random() * 500 + 100)::numeric, 1),
        round((random() * 50)::numeric, 1),
        false
      from generate_series(1, 12) as m;
    end loop;
  end loop;
end $$;
