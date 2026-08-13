-- Fictional wells for UI development. 5 gas wells, 5 oil wells, each with a
-- 60-month (5-year) exponential-decline profile starting 1 Jul 2026.
-- Condensate (gas wells) and gas (oil wells) are derived from CGR / GOR.

do $$
declare
  w_id uuid;
  i int;
  m int;
  qi numeric;
  decl numeric;
  cgr_v numeric;
  gor_v numeric;
  lpg_qi numeric;
  lpg_decl numeric;
  gas_r numeric;
  oil_r numeric;
  lpg_r numeric;
  cond_r numeric;
  start_date date := '2026-07-01';
begin
  -- Gas wells
  for i in 1..5 loop
    qi := 3000 + random() * 5000;   -- initial gas rate, Mscf/d
    decl := 0.02 + random() * 0.03; -- monthly decline fraction
    cgr_v := 15 + random() * 45;    -- bbl/MMscf
    lpg_qi := 80 + random() * 220;  -- initial LPG rate, bbl/d
    lpg_decl := 0.015 + random() * 0.02;

    insert into wells (name, well_type, cgr, gor)
    values ('GW-' || lpad(i::text, 2, '0'), 'gas', round(cgr_v, 2), null)
    returning id into w_id;

    for m in 0..59 loop
      gas_r := qi * exp(-decl * m);
      lpg_r := lpg_qi * exp(-lpg_decl * m);
      cond_r := gas_r * cgr_v / 1000;

      insert into well_monthly_profile (well_id, month_date, gas_rate, lpg_rate, condensate_rate)
      values (
        w_id,
        (start_date + (m || ' months')::interval)::date,
        round(gas_r, 1),
        round(lpg_r, 1),
        round(cond_r, 1)
      );
    end loop;
  end loop;

  -- Oil wells
  for i in 1..5 loop
    qi := 400 + random() * 1600;     -- initial oil rate, bbl/d
    decl := 0.02 + random() * 0.035;
    gor_v := 300 + random() * 900;   -- scf/bbl
    lpg_qi := 30 + random() * 120;
    lpg_decl := 0.015 + random() * 0.02;

    insert into wells (name, well_type, cgr, gor)
    values ('OW-' || lpad(i::text, 2, '0'), 'oil', null, round(gor_v, 2))
    returning id into w_id;

    for m in 0..59 loop
      oil_r := qi * exp(-decl * m);
      lpg_r := lpg_qi * exp(-lpg_decl * m);
      gas_r := oil_r * gor_v / 1000;

      insert into well_monthly_profile (well_id, month_date, oil_rate, gas_rate, lpg_rate)
      values (
        w_id,
        (start_date + (m || ' months')::interval)::date,
        round(oil_r, 1),
        round(gas_r, 1),
        round(lpg_r, 1)
      );
    end loop;
  end loop;
end $$;
