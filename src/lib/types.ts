export type Field = {
  id: string
  name: string
  asset: string | null
  notes: string | null
}

export type Well = {
  id: string
  field_id: string
  name: string
  status: string
}

export type FiscalYear = {
  id: string
  label: string
  start_date: string
  end_date: string
}

export type PlanVersion = {
  id: string
  fiscal_year_id: string
  name: string
  status: 'draft' | 'submitted' | 'approved' | 'locked'
  created_at: string
}

export type PlanMonthlyValue = {
  id: string
  version_id: string
  well_id: string
  month_index: number // 1-12
  oil_rate: number
  gas_rate: number
  water_rate: number
  is_override: boolean
  updated_at: string
}

export type Metric = 'oil_rate' | 'gas_rate' | 'water_rate'

// A well's 12 months, flattened for the grid — one row per well
export type PlanGridRow = {
  well_id: string
  well_name: string
  field_id: string
  field_name: string
  months: Record<number, PlanMonthlyValue | undefined> // 1..12
}

// ---- Base production profile (5-year monthly, well-level) ----

export type WellKind = 'gas' | 'oil'

export type ProfileWell = {
  id: string
  name: string
  well_type: WellKind
  cgr: number | null // bbl/MMscf — gas wells: condensate = gas_rate * cgr / 1000
  gor: number | null // scf/bbl — oil wells: gas_rate = oil_rate * gor / 1000
}

export type ProfileMonthlyValue = {
  id: string
  well_id: string
  month_date: string // ISO date, first of month
  oil_rate: number | null
  gas_rate: number | null
  lpg_rate: number | null
  condensate_rate: number | null
}

export type ProfileWellRow = {
  well: ProfileWell
  months: Record<string, ProfileMonthlyValue> // keyed by ISO month_date
}
