import { Sparkles, RefreshCw, TrendingUp, CircleOff } from 'lucide-react'
import type { ActivityType, Activity } from '../../lib/types'

export const PLAN_START_YEAR = 2027
export const PLAN_YEARS = 5 // 2027..2031

export const YEARS = Array.from({ length: PLAN_YEARS }, (_, i) => PLAN_START_YEAR + i)

export const ACTIVITY_CONFIG: Record<
  ActivityType,
  { label: string; short: string; icon: typeof Sparkles; color: string; tint: string; ring: string }
> = {
  new_well: {
    label: 'New development well',
    short: 'New well',
    icon: Sparkles,
    color: 'text-accent-blue',
    tint: 'bg-blue-50',
    ring: 'ring-blue-200'
  },
  workover_revival: {
    label: 'Workover — production revival',
    short: 'Revival',
    icon: RefreshCw,
    color: 'text-accent-orange',
    tint: 'bg-orange-50',
    ring: 'ring-orange-200'
  },
  workover_enhancement: {
    label: 'Workover — production enhancement',
    short: 'Enhancement',
    icon: TrendingUp,
    color: 'text-emerald-600',
    tint: 'bg-emerald-50',
    ring: 'ring-emerald-200'
  },
  pna: {
    label: 'Plug & abandon',
    short: 'P&A',
    icon: CircleOff,
    color: 'text-ink-400',
    tint: 'bg-ink-100',
    ring: 'ring-ink-200'
  }
}

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function parseMonth(iso: string): { year: number; month: number } {
  const [y, m] = iso.split('-').map(Number)
  return { year: y, month: m } // month 1-12
}

export function monthISO(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

// Horizontal position within a year band, 0..1, from the on-production month.
// Jan -> ~0, Dec -> ~1. Used to place the card left->right inside its band.
export function monthFraction(month: number): number {
  return (month - 1) / 11
}

// Exponential decline. Given an initial (annual-average-equivalent) start rate
// and an annual decline fraction, returns the yearly-average rate for each of
// the 5 plan years. First year is averaged over producing months only.
export function yearlyAverages(
  startRate: number,
  annualDecline: number,
  onprodYear: number,
  onprodMonth: number
): number[] {
  const monthlyDecline = 1 - Math.pow(1 - annualDecline, 1 / 12)
  const out: number[] = []

  for (let yi = 0; yi < PLAN_YEARS; yi++) {
    const year = PLAN_START_YEAR + yi
    if (year < onprodYear) {
      out.push(0)
      continue
    }
    const firstMonth = year === onprodYear ? onprodMonth : 1
    let sum = 0
    let count = 0
    for (let m = firstMonth; m <= 12; m++) {
      // months since on-production
      const monthsElapsed = (year - onprodYear) * 12 + (m - onprodMonth)
      const rate = startRate * Math.pow(1 - monthlyDecline, monthsElapsed)
      sum += rate
      count += 1
    }
    out.push(count > 0 ? sum / count : 0)
  }
  return out
}

// The three product streams' yearly averages for an activity.
// Oil well: oil primary, gas via GOR, LPG a small fraction (placeholder until
// real per-well GOR/CGR/LPG factors are wired from the profiles module).
// Gas well: gas primary, condensate/LPG placeholders.
export function computeProductTiles(activity: Activity): {
  oil: number[]
  gas: number[]
  lpg: number[]
} | null {
  if (activity.activity_type === 'pna') return null
  if (activity.start_rate === null || activity.decline_rate === null) return null

  const { year, month } = parseMonth(activity.onprod_date)
  const base = yearlyAverages(activity.start_rate, activity.decline_rate, year, month)

  if (activity.well_category === 'gas') {
    // start_rate is gas rate; placeholder factors for condensate-ish LPG
    return {
      oil: base.map(() => 0),
      gas: base,
      lpg: base.map((v) => v * 0.04)
    }
  }
  // oil well: start_rate is oil rate; placeholder GOR/LPG factors
  return {
    oil: base,
    gas: base.map((v) => v * 0.5),
    lpg: base.map((v) => v * 0.03)
  }
}
