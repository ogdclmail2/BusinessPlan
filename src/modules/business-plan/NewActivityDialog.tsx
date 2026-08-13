import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { ActivityType, WellCategory } from '../../lib/types'
import { ACTIVITY_CONFIG, YEARS, MONTHS_SHORT } from './planConfig'

const TYPE_OPTIONS: ActivityType[] = ['new_well', 'workover_revival', 'workover_enhancement', 'pna']
const inputCls = 'w-full border border-ink-200 rounded-lg px-3 py-2 text-[15px] focus:border-accent-blue'

export type NewActivityInput = {
  activity_type: ActivityType
  well_category: WellCategory | null
  field_name: string
  well_name: string
  block: string
  region: string
  onprod_date: string
  start_rate: number | null
  decline_rate: number | null
}

export default function NewActivityDialog({
  fields,
  onCreate,
  onCancel
}: {
  fields: string[]
  onCreate: (input: NewActivityInput) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<ActivityType>('new_well')
  const [fieldName, setFieldName] = useState(fields[0] ?? '')
  const [wellName, setWellName] = useState('')
  const [block, setBlock] = useState('')
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState<WellCategory | ''>('oil')
  const [year, setYear] = useState(YEARS[0])
  const [month, setMonth] = useState(1)
  const [startRate, setStartRate] = useState('')
  const [decline, setDecline] = useState('')

  const isPna = type === 'pna'

  function submit() {
    if (!fieldName.trim()) return
    onCreate({
      activity_type: type,
      well_category: isPna ? null : (category || null),
      field_name: fieldName.trim(),
      well_name: wellName.trim(),
      block: block.trim(),
      region: region.trim(),
      onprod_date: `${year}-${String(month).padStart(2, '0')}-01`,
      start_rate: isPna || startRate === '' ? null : Number(startRate),
      decline_rate: isPna || decline === '' ? null : Number(decline)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Plus size={22} className="text-accent-blue" strokeWidth={2.4} />
          <span className="text-lg font-bold text-ink-900">New activity</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((t) => {
            const cfg = ACTIVITY_CONFIG[t]
            const active = type === t
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ring-1 text-left transition-all ${
                  active ? `${cfg.tint} ${cfg.ring} ring-2` : 'ring-ink-200 hover:bg-ink-50'
                }`}
              >
                <cfg.icon size={18} className={cfg.color} strokeWidth={2.2} />
                <span className="text-sm font-medium text-ink-800">{cfg.short}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Field</span>
            <input list="field-list" className={`${inputCls} mt-1`} value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
            <datalist id="field-list">
              {fields.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Well</span>
            <input className={`${inputCls} mt-1`} value={wellName} onChange={(e) => setWellName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Block</span>
            <input className={`${inputCls} mt-1`} value={block} onChange={(e) => setBlock(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Region</span>
            <input className={`${inputCls} mt-1`} value={region} onChange={(e) => setRegion(e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">On-production year</span>
            <select className={`${inputCls} mt-1`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Month</span>
            <select className={`${inputCls} mt-1`} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS_SHORT.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!isPna && (
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Category</span>
              <select className={`${inputCls} mt-1`} value={category} onChange={(e) => setCategory(e.target.value as WellCategory | '')}>
                <option value="oil">Oil</option>
                <option value="gas">Gas</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Start rate</span>
              <input type="number" className={`${inputCls} mt-1`} value={startRate} onChange={(e) => setStartRate(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Decline</span>
              <input type="number" step="0.01" className={`${inputCls} mt-1`} value={decline} onChange={(e) => setDecline(e.target.value)} />
            </label>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg ring-1 ring-ink-200 text-ink-600 font-medium hover:bg-ink-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!fieldName.trim()}
            className="px-4 py-2.5 rounded-lg bg-accent-blue text-white font-medium disabled:opacity-40"
          >
            Create card
          </button>
        </div>
      </div>
    </div>
  )
}
