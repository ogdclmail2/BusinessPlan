import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Activity } from '../../lib/types'
import { fetchActivities, createActivity, updateActivity } from './api'
import { parseMonth, monthISO } from './planConfig'
import PlanCanvas from './PlanCanvas'
import ActivityDetail from './ActivityDetail'
import MoveConfirm from './MoveConfirm'
import NewActivityDialog, { type NewActivityInput } from './NewActivityDialog'

export default function BusinessPlanPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState<Activity | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [pendingMove, setPendingMove] = useState<{ activity: Activity; toISO: string } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchActivities()
      setActivities(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Fields shown as swimlanes — union of fields present on cards, sorted.
  const fields = useMemo(() => {
    const set = new Set(activities.map((a) => a.field_name))
    return Array.from(set).sort()
  }, [activities])

  function handleDropCard(activityId: string, targetYear: number) {
    const activity = activities.find((a) => a.id === activityId)
    if (!activity) return
    const { year, month } = parseMonth(activity.onprod_date)
    if (year === targetYear) return // same band, no move
    // keep the month, change the year
    setPendingMove({ activity, toISO: monthISO(targetYear, month) })
  }

  async function confirmMove(reason: string) {
    if (!pendingMove) return
    const { activity, toISO } = pendingMove
    await updateActivity(activity, { onprod_date: toISO }, reason || 'moved')
    setPendingMove(null)
    load()
  }

  async function handleCreate(input: NewActivityInput) {
    await createActivity({
      activity_type: input.activity_type,
      well_category: input.well_category,
      field_name: input.field_name,
      well_name: input.well_name || null,
      block: input.block || null,
      region: input.region || null,
      onprod_date: input.onprod_date,
      start_rate: input.start_rate,
      decline_rate: input.decline_rate
    })
    setShowNew(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          Drag a card to another year to reschedule. Click a card to edit or view its history.
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white font-semibold hover:brightness-110"
        >
          <Plus size={18} strokeWidth={2.4} /> New activity
        </button>
      </div>

      {error && (
        <p className="text-center text-sm text-flag">
          Couldn't load activities — {error}. Make sure supabase/activities_schema.sql has been run.
        </p>
      )}

      {loading && !error && <p className="text-center text-sm text-ink-400">Loading…</p>}

      {!loading && !error && (
        <PlanCanvas
          activities={activities}
          fields={fields}
          onCardClick={setSelected}
          onDropCard={handleDropCard}
        />
      )}

      {selected && (
        <ActivityDetail
          activity={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            load()
          }}
        />
      )}

      {pendingMove && (
        <MoveConfirm
          fromISO={pendingMove.activity.onprod_date}
          toISO={pendingMove.toISO}
          onConfirm={confirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}

      {showNew && (
        <NewActivityDialog fields={fields} onCreate={handleCreate} onCancel={() => setShowNew(false)} />
      )}
    </div>
  )
}
