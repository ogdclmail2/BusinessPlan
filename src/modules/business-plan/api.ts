import { supabase } from '../../lib/supabaseClient'
import type {
  Field,
  Well,
  FiscalYear,
  PlanVersion,
  PlanMonthlyValue,
  PlanGridRow,
  Metric
} from '../../lib/types'

export async function fetchFiscalYears(): Promise<FiscalYear[]> {
  const { data, error } = await supabase
    .from('fiscal_years')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchVersions(fiscalYearId: string): Promise<PlanVersion[]> {
  const { data, error } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('fiscal_year_id', fiscalYearId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createVersion(
  fiscalYearId: string,
  name: string,
  cloneFromVersionId?: string
): Promise<PlanVersion> {
  const { data: version, error } = await supabase
    .from('plan_versions')
    .insert({ fiscal_year_id: fiscalYearId, name, status: 'draft' })
    .select()
    .single()
  if (error) throw error

  if (cloneFromVersionId) {
    const { data: sourceValues, error: fetchErr } = await supabase
      .from('plan_monthly_values')
      .select('well_id, month_index, oil_rate, gas_rate, water_rate, is_override')
      .eq('version_id', cloneFromVersionId)
    if (fetchErr) throw fetchErr

    if (sourceValues && sourceValues.length > 0) {
      const rows = sourceValues.map((v) => ({ ...v, version_id: version.id }))
      const { error: insertErr } = await supabase.from('plan_monthly_values').insert(rows)
      if (insertErr) throw insertErr
    }
  }

  return version
}

export async function fetchFieldsAndWells(): Promise<{ fields: Field[]; wells: Well[] }> {
  const [{ data: fields, error: fErr }, { data: wells, error: wErr }] = await Promise.all([
    supabase.from('fields').select('*').order('name'),
    supabase.from('wells').select('*').order('name')
  ])
  if (fErr) throw fErr
  if (wErr) throw wErr
  return { fields: fields ?? [], wells: wells ?? [] }
}

export async function fetchGridData(versionId: string): Promise<PlanGridRow[]> {
  const { fields, wells } = await fetchFieldsAndWells()
  const { data: values, error } = await supabase
    .from('plan_monthly_values')
    .select('*')
    .eq('version_id', versionId)
  if (error) throw error

  const fieldById = new Map(fields.map((f) => [f.id, f]))
  const valuesByWell = new Map<string, PlanMonthlyValue[]>()
  for (const v of values ?? []) {
    const list = valuesByWell.get(v.well_id) ?? []
    list.push(v)
    valuesByWell.set(v.well_id, list)
  }

  const rows: PlanGridRow[] = wells.map((w) => {
    const field = fieldById.get(w.field_id)
    const months: PlanGridRow['months'] = {}
    for (const v of valuesByWell.get(w.id) ?? []) {
      months[v.month_index] = v
    }
    return {
      well_id: w.id,
      well_name: w.name,
      field_id: w.field_id,
      field_name: field?.name ?? 'Unassigned',
      months
    }
  })

  // group by field, then well name, for a stable readable order
  rows.sort((a, b) => a.field_name.localeCompare(b.field_name) || a.well_name.localeCompare(b.well_name))
  return rows
}

export async function upsertCell(
  versionId: string,
  wellId: string,
  monthIndex: number,
  metric: Metric,
  value: number,
  markOverride = true
): Promise<void> {
  const { data: existing, error: fetchErr } = await supabase
    .from('plan_monthly_values')
    .select('id')
    .eq('version_id', versionId)
    .eq('well_id', wellId)
    .eq('month_index', monthIndex)
    .maybeSingle()
  if (fetchErr) throw fetchErr

  if (existing) {
    const { error } = await supabase
      .from('plan_monthly_values')
      .update({ [metric]: value, is_override: markOverride, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('plan_monthly_values').insert({
      version_id: versionId,
      well_id: wellId,
      month_index: monthIndex,
      [metric]: value,
      is_override: markOverride
    })
    if (error) throw error
  }
}

// Used by the single-well entry form — saves all 12 months for one well in one call
export async function upsertWellMonths(
  versionId: string,
  wellId: string,
  monthly: { month_index: number; oil_rate: number; gas_rate: number; water_rate: number }[]
): Promise<void> {
  const rows = monthly.map((m) => ({
    version_id: versionId,
    well_id: wellId,
    month_index: m.month_index,
    oil_rate: m.oil_rate,
    gas_rate: m.gas_rate,
    water_rate: m.water_rate,
    is_override: true
  }))
  const { error } = await supabase
    .from('plan_monthly_values')
    .upsert(rows, { onConflict: 'version_id,well_id,month_index' })
  if (error) throw error
}

export async function createField(name: string): Promise<Field> {
  const { data, error } = await supabase.from('fields').insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function createWell(fieldId: string, name: string): Promise<Well> {
  const { data, error } = await supabase
    .from('wells')
    .insert({ field_id: fieldId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---- Bulk upload (from a parsed Excel/CSV template) ----

export type BulkRow = {
  field_name: string
  well_name: string
  month_index: number
  oil_rate?: number
  gas_rate?: number
  water_rate?: number
}

export async function bulkUpsert(
  versionId: string,
  rows: BulkRow[]
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = []
  const { fields, wells } = await fetchFieldsAndWells()

  const fieldByName = new Map(fields.map((f) => [f.name.trim().toLowerCase(), f]))
  const wellByKey = new Map(wells.map((w) => [`${w.field_id}::${w.name.trim().toLowerCase()}`, w]))

  let inserted = 0

  for (const [idx, row] of rows.entries()) {
    const line = idx + 2 // +2 to account for header row + 1-index
    if (!row.field_name || !row.well_name || !row.month_index) {
      errors.push(`Row ${line}: missing field_name, well_name, or month_index — skipped.`)
      continue
    }
    if (row.month_index < 1 || row.month_index > 12) {
      errors.push(`Row ${line}: month_index must be 1-12 — skipped.`)
      continue
    }

    let field: Field | undefined = fieldByName.get(row.field_name.trim().toLowerCase())
    if (!field) {
      const { data, error } = await supabase
        .from('fields')
        .insert({ name: row.field_name.trim() })
        .select()
        .single()
      if (error || !data) {
        errors.push(`Row ${line}: could not create field "${row.field_name}" — ${error?.message}`)
        continue
      }
      field = data as Field
      fieldByName.set(field.name.trim().toLowerCase(), field)
    }
    if (!field) continue

    const wellKey = `${field.id}::${row.well_name.trim().toLowerCase()}`
    let well: Well | undefined = wellByKey.get(wellKey)
    if (!well) {
      const { data, error } = await supabase
        .from('wells')
        .insert({ field_id: field.id, name: row.well_name.trim() })
        .select()
        .single()
      if (error || !data) {
        errors.push(`Row ${line}: could not create well "${row.well_name}" — ${error?.message}`)
        continue
      }
      well = data as Well
      wellByKey.set(wellKey, well)
    }
    if (!well) continue

    try {
      const { error } = await supabase.from('plan_monthly_values').upsert(
        {
          version_id: versionId,
          well_id: well.id,
          month_index: row.month_index,
          oil_rate: row.oil_rate ?? 0,
          gas_rate: row.gas_rate ?? 0,
          water_rate: row.water_rate ?? 0,
          is_override: true
        },
        { onConflict: 'version_id,well_id,month_index' }
      )
      if (error) throw error
      inserted += 1
    } catch (e) {
      errors.push(`Row ${line}: ${(e as Error).message}`)
    }
  }

  return { inserted, errors }
}
