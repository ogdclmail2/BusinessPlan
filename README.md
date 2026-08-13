# O&G Planner — Business Plan module (v0)

Production profile / business planning tool. This is the starting scaffold: just the
**Business Plan** module and a placeholder **Output** page. Ingestion, DCA, and Reserves
come later as their own modules, each in its own folder under `src/modules/`.

Stack: React + Vite + TypeScript, Tailwind, Supabase (Postgres) as the backend.
Everything runs client-side against Supabase — no separate server yet.

## What's here

- One fiscal year → one or more named **plan versions** (Budget, Revised Forecast, etc.)
  that coexist and can be switched between. "New version" can start empty or clone
  another version's numbers as a starting point.
- A 12-month editable grid, grouped by field, one metric (oil/gas/water) at a time.
  Click a cell to edit it. Hand-edited cells are flagged (`is_override`) and shown with
  an amber background — this is the hook DCA-computed values will plug into later
  without losing manually entered numbers.
- A single-well entry form, for typing in one well's year by hand.
- A bulk upload tab that reads a standard `.xlsx`/`.csv` template
  (`field_name, well_name, month_index, oil_rate, gas_rate, water_rate`) — unknown
  fields/wells are created automatically.

10 placeholder fields (3–8 wells each) are included in `supabase/seed.sql` so the grid
isn't empty while you build against it.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/schema.sql`, then `supabase/seed.sql` (and, for the
   Base Profiles page, `supabase/profiles_schema.sql` then `supabase/profiles_seed.sql`).
3. In Project Settings → API, copy the **Project URL** and **anon public key**.

Note: Supabase is rolling out a requirement for explicit Postgres grants on the
auto-generated API (new projects from May 2026, existing projects from Oct 2026). If
you get permission errors on API calls, run the `grant` statements at the bottom of
`schema.sql`.

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Business plan + base profiles"
gh repo create oilgas-planner --private --source=. --push
# or: create an empty repo on github.com, then
#   git remote add origin <your-repo-url>
#   git branch -M main
#   git push -u origin main
```

## 3. Deploy — GitHub Actions builds it, GitHub Pages serves it

No local server, no CLI. This repo already has `.github/workflows/deploy.yml`, which
builds the app and publishes it every time you push to `main`.

1. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository
   secret**. Add two secrets, using the same values as your Supabase Project URL/anon
   key from step 1:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. **Settings → Pages → Source: GitHub Actions.**
3. Push to `main` (or open the **Actions** tab and run the workflow manually). It takes
   1-2 minutes.
4. Once the Actions run is green, your link is under **Settings → Pages** — something
   like `https://<your-username>.github.io/<repo-name>/`.

Every push to `main` after this rebuilds and redeploys automatically. There's a short
delay between pushing and seeing the change live (the Actions build), unlike editing a
file directly in a running local server — that's the trade-off for not needing a local
dev environment at all.

## (Optional) Running it locally instead

Only useful if you want instant feedback while actively editing the UI, and your setup
allows it:

```bash
cp .env.example .env
# paste your Supabase URL + anon key into .env
npm install
npm run dev
```

Opens at `http://localhost:5173` — visible only on your own machine. Not needed for the
GitHub Pages deployment above; skip this entirely if it's not useful to you.

## Project layout

```
src/
  lib/
    supabaseClient.ts   Supabase client, reads from .env
    types.ts            Shared TS types mirroring the DB schema
  modules/
    business-plan/      This module. api.ts (data access), PlanGrid,
                         WellEntryForm, BulkUploadForm, BusinessPlanPage.
    output/              Placeholder for the reporting module — next up.
    # ingestion/, dca/, reserves/ — added as their own folders when we build them
supabase/
  schema.sql             Tables + RLS policies
  seed.sql                10 placeholder fields for local dev
```

Each module owns its own tables and its own `api.ts` — the idea is any module can be
gutted and rebuilt (e.g. swapping in real DCA logic later) without the others needing to
change, as long as the shape of what it hands off stays the same.

## Notes on current design choices (kept deliberately simple)

- **Versions are just rows**, no state machine beyond a `status` column
  (`draft` / `submitted` / `approved` / `locked`). Locking a version makes the grid
  read-only in the UI; nothing enforces it at the database level yet.
- **No DCA recompute wiring yet** — every cell is a manual override for now, because
  there's no DCA module to compute a baseline against. When DCA exists, the plan is:
  `plan_monthly_values` gets a couple of `*_computed` columns alongside the existing
  ones, the grid shows override-if-present-else-computed, and a "reset to DCA" action
  clears an override. Not built now — no point designing it before DCA exists.
- **RLS is wide open** behind the anon key (see `schema.sql`). Fine for a handful of
  trusted internal users during development; tighten before wider rollout.
- **No auth yet.** Whoever has the URL can edit. Add Supabase Auth when this moves past
  local prototyping.

## Known limits of the free tiers (fine for now, just so they're not a surprise)

- Supabase free: 500 MB database, 2 active projects, auto-pauses after 7 days of no
  activity (click resume in the dashboard — no data loss), no automatic backups. Worth
  doing your own occasional `pg_dump` once there's real data in it.
- At current scale (100 fields, 5-year business plan horizon, monthly) you're using low
  tens of MB even with several versions — storage isn't a concern for years.
