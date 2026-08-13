import { useEffect, useState } from 'react'
import { X, Save, Ban, History, Droplet, Flame, CircleGauge } from 'lucide-react'
import type { Activity, ActivityLogEntry, ActivityType, WellCategory } from '../../lib/types'
import { ACTIVITY_CONFIG, YEARS, computeProductTiles } from './planConfig'
import { fetchLog, updateActivity, dropActivity } from './api'

const TYPE_OPTIONS: ActivityType[] = [
  'new_well',
  'workover_revival',
  'workover_enhancement',
  'pna'
]

function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputCls =
  'w-full border border-ink-200 rounded-lg px-3 py-2 text-[15px] text-ink-900 focus:border-accent-blue'

export default function ActivityDetail({
  activity,
  onClose,
  onSaved
}: {
  activity: Activity
  onClose: () => void
  onSaved: (updated: Activity) => void
}) {
  const [draft, setDraft] = useState<Activity>(activity)
  const [log, setLog] = useState<ActivityLogEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const [dropReason, setDropReason] = useState('')

  useEffect(() => {
    setDraft(activity)
    fetchLog(activity.id).then(setLog).catch(() => setLog([]))
  }, [activity])

  const tiles = computeProductTiles(draft)
  const cfg = ACTIVITY_CONFIG[draft.activity_type]

  function set<K extends keyof Activity>(key: K, value: Activity[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const changes: Partial<Activity> = {
        activity_type: draft.activity_type,
        well_category: draft.activity_type === 'pna' ? null : draft.well_category,
        field_name: draft.field_name,
        well_name: draft.well_name,
        block: draft.block,
        region: draft.region,
        onprod_date: draft.onprod_date,
        start_rate: draft.activity_type === 'pna' ? null : draft.start_rate,
        decline_rate: draft.activity_type === 'pna' ? null : draft.decline_rate
      }
      const updated = await updateActivity(activity, changes)
      onSaved(updated)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDrop() {
    if (!dropReason.trim()) return
    setSaving(true)
    try {
      const updated = await dropActivity(activity, dropReason.trim())
      onSaved(updated)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/30" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center gap-3 px-6 py-4 ${cfg.tint} border-b border-ink-200`}>
          <cfg.icon size={24} className={cfg.color} strokeWidth={2.2} />
          <div className="min-w-0">
            <div className="text-lg font-bold text-ink-900 truncate">
              {draft.well_name || cfg.label}
            </div>
            <div className="text-xs text-ink-500">{cfg.label}</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg hover:bg-white/60 text-ink-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {draft.status === 'dropped' && (
          <div className="mx-6 mt-4 rounded-lg bg-rose-50 ring-1 ring-rose-200 px-4 py-3">
            <div className="text-sm font-semibold text-rose-700">Activity dropped</div>
            {draft.drop_reason && <div className="text-sm text-rose-600 mt-0.5">{draft.drop_reason}</div>}
          </div>
        )}

        {/* Editable fields */}
        <div className="px-6 py-5 space-y-4">
          <Field label="Activity type">
            <select
              className={inputCls}
              value={draft.activity_type}
              onChange={(e) => set('activity_type', e.target.value as ActivityType)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_CONFIG[t].label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Field">
              <input className={inputCls} value={draft.field_name} onChange={(e) => set('field_name', e.target.value)} />
            </Field>
            <Field label="Well">
              <input className={inputCls} value={draft.well_name ?? ''} onChange={(e) => set('well_name', e.target.value)} />
            </Field>
            <Field label="Block">
              <input className={inputCls} value={draft.block ?? ''} onChange={(e) => set('block', e.target.value)} />
            </Field>
            <Field label="Region">
              <input className={inputCls} value={draft.region ?? ''} onChange={(e) => set('region', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="On production">
              <input
                type="month"
                className={inputCls}
                value={draft.onprod_date.slice(0, 7)}
                onChange={(e) => set('onprod_date', `${e.target.value}-01`)}
              />
            </Field>
            {draft.activity_type !== 'pna' && (
              <Field label="Well category">
                <select
                  className={inputCls}
                  value={draft.well_category ?? ''}
                  onChange={(e) => set('well_category', (e.target.value || null) as WellCategory | null)}
                >
                  <option value="">—</option>
                  <option value="oil">Oil</option>
                  <option value="gas">Gas</option>
                </select>
              </Field>
            )}
          </div>

          {draft.activity_type !== 'pna' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start rate">
                <input
                  type="number"
                  className={inputCls}
                  value={draft.start_rate ?? ''}
                  onChange={(e) => set('start_rate', e.target.value === '' ? null : Number(e.target.value))}
                />
              </Field>
              <Field label="Annual decline (0–1)">
                <input
                  type="number"
                  step="0.01"
                  className={inputCls}
                  value={draft.decline_rate ?? ''}
                  onChange={(e) => set('decline_rate', e.target.value === '' ? null : Number(e.target.value))}
                />
              </Field>
            </div>
          )}
        </div>

        {/* 15 production tiles */}
        {tiles && (
          <div className="px-6 pb-5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-400 mb-2">
              Yearly average production
            </div>
            <TileGrid tiles={tiles} />
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-ink-200 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || draft.status === 'dropped'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-blue text-white font-medium disabled:opacity-40"
          >
            <Save size={18} /> Save
          </button>
          {draft.status !== 'dropped' && (
            <button
              onClick={() => setShowDrop((s) => !s)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg ring-1 ring-rose-200 text-rose-600 font-medium hover:bg-rose-50"
            >
              <Ban size={18} /> Drop activity
            </button>
          )}
        </div>

        {showDrop && (
          <div className="mx-6 mb-4 rounded-lg ring-1 ring-rose-200 p-4 space-y-2">
            <div className="text-sm font-medium text-ink-700">Reason for dropping</div>
            <textarea
              className={inputCls}
              rows={2}
              placeholder="e.g. deferred to next cycle, budget, security…"
              value={dropReason}
              onChange={(e) => setDropReason(e.target.value)}
            />
            <button
              onClick={handleDrop}
              disabled={!dropReason.trim() || saving}
              className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium disabled:opacity-40"
            >
              Confirm drop
            </button>
          </div>
        )}

        {/* Change log */}
        <div className="px-6 py-5 border-t border-ink-200">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-400 mb-3">
            <History size={14} /> Change history
          </div>
          {log.length === 0 ? (
            <div className="text-sm text-ink-400">No changes yet.</div>
          ) : (
            <ul className="space-y-2">
              {log.map((entry) => (
                <li key={entry.id} className="text-sm flex gap-3">
                  <span className="text-ink-400 tabular whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleDateString()}{' '}
                    {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-ink-700">
                    <span className="font-medium capitalize">{entry.kind}</span>
                    {entry.reason ? ` — ${entry.reason}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function TileGrid({ tiles }: { tiles: { oil: number[]; gas: number[]; lpg: number[] } }) {
  const rows: { label: string; icon: typeof Droplet; color: string; values: number[] }[] = [
    { label: 'Oil', icon: Droplet, color: 'text-accent-blue', values: tiles.oil },
    { label: 'Gas', icon: Flame, color: 'text-accent-orange', values: tiles.gas },
    { label: 'LPG', icon: CircleGauge, color: 'text-ink-400', values: tiles.lpg }
  ]
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-1.5 text-center">
        <div />
        {YEARS.map((y) => (
          <div key={y} className="text-xs font-semibold text-ink-500">
            {y}
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-6 gap-1.5">
          <div className="flex items-center gap-1.5">
            <row.icon size={16} className={row.color} strokeWidth={2.2} />
            <span className="text-sm text-ink-600">{row.label}</span>
          </div>
          {row.values.map((v, i) => (
            <div
              key={i}
              className="rounded-lg bg-ink-50 py-2 text-center tabular text-[15px] font-semibold text-ink-800"
            >
              {Math.round(v).toLocaleString()}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
