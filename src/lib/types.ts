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

export type Metric = 'oil_rate' | 'gas_rate' | 'water_rate'

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

// ---- Business Plan canvas — activity cards ----

export type ActivityType = 'new_well' | 'workover_revival' | 'workover_enhancement' | 'pna'
export type WellCategory = 'oil' | 'gas'
export type ActivityStatus = 'active' | 'dropped'

export type Activity = {
  id: string
  activity_type: ActivityType
  well_category: WellCategory | null
  field_name: string
  well_name: string | null
  block: string | null
  region: string | null
  onprod_date: string // ISO, first of month
  start_rate: number | null
  decline_rate: number | null
  status: ActivityStatus
  drop_reason: string | null
  is_edited: boolean
  created_at: string
  updated_at: string
}

export type ActivityLogKind = 'created' | 'edited' | 'moved' | 'dropped'

export type ActivityLogEntry = {
  id: string
  activity_id: string
  kind: ActivityLogKind
  reason: string | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  created_at: string
}
