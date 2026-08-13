import { supabase } from '../../lib/supabaseClient'
import type { ProfileWell, ProfileMonthlyValue, ProfileWellRow } from '../../lib/types'

export async function fetchProfileWellRows(): Promise<ProfileWellRow[]> {
  const [{ data: wells, error: wErr }, { data: values, error: vErr }] = await Promise.all([
    supabase.from('wells').select('id, name, well_type, cgr, gor').order('name'),
    supabase
      .from('well_monthly_profile')
      .select('id, well_id, month_date, oil_rate, gas_rate, lpg_rate, condensate_rate')
      .order('month_date')
  ])
  if (wErr) throw wErr
  if (vErr) throw vErr

  const valuesByWell = new Map<string, ProfileMonthlyValue[]>()
  for (const v of (values ?? []) as ProfileMonthlyValue[]) {
    const list = valuesByWell.get(v.well_id) ?? []
    list.push(v)
    valuesByWell.set(v.well_id, list)
  }

  return ((wells ?? []) as ProfileWell[])
    .filter((w) => w.well_type === 'gas' || w.well_type === 'oil') // ignore wells not yet typed
    .map((well) => {
      const months: Record<string, ProfileMonthlyValue> = {}
      for (const v of valuesByWell.get(well.id) ?? []) {
        months[v.month_date] = v
      }
      return { well, months }
    })
}

// The shared month axis every well row aligns to — 60 months from 1 Jul 2026.
export function buildMonthAxis(startISO = '2026-07-01', count = 60): string[] {
  const [y, m] = startISO.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1 + i, 1))
    return date.toISOString().slice(0, 10)
  })
}
