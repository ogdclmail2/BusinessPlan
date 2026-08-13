import { supabase } from '../../lib/supabaseClient'
import type { Activity, ActivityLogEntry, ActivityLogKind } from '../../lib/types'

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('plan_activities')
    .select('*')
    .order('onprod_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as Activity[]
}

export async function fetchLog(activityId: string): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('activity_id', activityId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ActivityLogEntry[]
}

type NewActivity = Omit<Activity, 'id' | 'is_edited' | 'status' | 'drop_reason' | 'created_at' | 'updated_at'>

export async function createActivity(input: NewActivity): Promise<Activity> {
  const { data, error } = await supabase
    .from('plan_activities')
    .insert({ ...input, status: 'active', is_edited: false })
    .select()
    .single()
  if (error) throw error

  await writeLog(data.id, 'created', null, null, data)
  return data as Activity
}

export async function updateActivity(
  before: Activity,
  changes: Partial<Activity>,
  reason?: string
): Promise<Activity> {
  const { data, error } = await supabase
    .from('plan_activities')
    .update({ ...changes, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', before.id)
    .select()
    .single()
  if (error) throw error

  const kind: ActivityLogKind =
    changes.onprod_date && changes.onprod_date !== before.onprod_date ? 'moved' : 'edited'
  await writeLog(before.id, kind, reason ?? null, before, data)
  return data as Activity
}

export async function dropActivity(before: Activity, reason: string): Promise<Activity> {
  const { data, error } = await supabase
    .from('plan_activities')
    .update({ status: 'dropped', drop_reason: reason, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', before.id)
    .select()
    .single()
  if (error) throw error

  await writeLog(before.id, 'dropped', reason, before, data)
  return data as Activity
}

async function writeLog(
  activityId: string,
  kind: ActivityLogKind,
  reason: string | null,
  before: unknown,
  after: unknown
): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({
    activity_id: activityId,
    kind,
    reason,
    before_data: before,
    after_data: after
  })
  if (error) throw error
}
