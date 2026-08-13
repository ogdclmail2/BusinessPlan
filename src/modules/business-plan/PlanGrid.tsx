import { useMemo, useState } from 'react'
import type { PlanGridRow, Metric } from '../../lib/types'
import { upsertCell } from './api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const METRIC_LABEL: Record<Metric, string> = {
  oil_rate: 'Oil (bbl/mo)',
  gas_rate: 'Gas (mcf/mo)',
  water_rate: 'Water (bbl/mo)'
}

type Props = {
  rows: PlanGridRow[]
  versionId: string
  readOnly: boolean
  onCellSaved: () => void
}

export default function PlanGrid({ rows, versionId, readOnly, onCellSaved }: Props) {
  const [metric, setMetric] = useState<Metric>('oil_rate')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<string>('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, PlanGridRow[]>()
    for (const row of rows) {
      const list = map.get(row.field_name) ?? []
      list.push(row)
      map.set(row.field_name, list)
    }
    return Array.from(map.entries())
  }, [rows])

  function cellKey(wellId: string, month: number) {
    return `${wellId}:${month}`
  }

  function startEdit(row: PlanGridRow, month: number) {
    if (readOnly) return
    const current = row.months[month]?.[metric] ?? 0
    setEditingKey(cellKey(row.well_id, month))
    setDraft(String(current))
  }

  async function commitEdit(row: PlanGridRow, month: number) {
    const key = cellKey(row.well_id, month)
    setEditingKey(null)
    const parsed = Number(draft)
    if (Number.isNaN(parsed)) return
    const current = row.months[month]?.[metric] ?? 0
    if (parsed === current) return

    setSavingKey(key)
    try {
      await upsertCell(versionId, row.well_id, month, metric, parsed)
      onCellSaved()
    } finally {
      setSavingKey(null)
    }
  }

  function annualTotal(row: PlanGridRow) {
    return MONTHS.reduce((sum, _m, i) => sum + (row.months[i + 1]?.[metric] ?? 0), 0)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              metric === m
                ? 'bg-signal text-white border-signal'
                : 'bg-white text-ink-600 border-ink-200 hover:border-signal'
            }`}
          >
            {METRIC_LABEL[m]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-ink-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-flag-light border border-flag" />
          Manually overridden cell
        </div>
      </div>

      <div className="overflow-auto border border-ink-200 rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50">
              <th className="text-left px-3 py-2 font-medium text-ink-600 sticky left-0 bg-ink-50 min-w-[180px]">
                Well
              </th>
              {MONTHS.map((m) => (
                <th key={m} className="text-right px-2 py-2 font-medium text-ink-600 min-w-[84px]">
                  {m}
                </th>
              ))}
              <th className="text-right px-3 py-2 font-medium text-ink-600 min-w-[100px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([fieldName, wellRows]) => (
              <FieldGroup
                key={fieldName}
                fieldName={fieldName}
                wellRows={wellRows}
                metric={metric}
                editingKey={editingKey}
                savingKey={savingKey}
                draft={draft}
                setDraft={setDraft}
                startEdit={startEdit}
                commitEdit={commitEdit}
                annualTotal={annualTotal}
                cellKey={cellKey}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center text-ink-400 py-10">
                  No wells in this fiscal year / version yet. Add data via the entry form or bulk
                  upload tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FieldGroup({
  fieldName,
  wellRows,
  metric,
  editingKey,
  savingKey,
  draft,
  setDraft,
  startEdit,
  commitEdit,
  annualTotal,
  cellKey
}: {
  fieldName: string
  wellRows: PlanGridRow[]
  metric: Metric
  editingKey: string | null
  savingKey: string | null
  draft: string
  setDraft: (v: string) => void
  startEdit: (row: PlanGridRow, month: number) => void
  commitEdit: (row: PlanGridRow, month: number) => void
  annualTotal: (row: PlanGridRow) => number
  cellKey: (wellId: string, month: number) => string
}) {
  return (
    <>
      <tr>
        <td colSpan={14} className="px-3 py-1.5 bg-ink-100 text-xs font-semibold text-ink-600 uppercase tracking-wide">
          {fieldName}
        </td>
      </tr>
      {wellRows.map((row) => (
        <tr key={row.well_id} className="border-b border-ink-100 last:border-0">
          <td className="px-3 py-1.5 text-ink-800 sticky left-0 bg-white">{row.well_name}</td>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const key = cellKey(row.well_id, month)
            const cell = row.months[month]
            const isEditing = editingKey === key
            const isSaving = savingKey === key
            const value = cell?.[metric] ?? 0

            return (
              <td
                key={month}
                onClick={() => startEdit(row, month)}
                className={`px-2 py-1.5 text-right tabular cursor-text ${
                  cell?.is_override ? 'bg-flag-light' : ''
                } ${isSaving ? 'opacity-50' : ''}`}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    className="w-full text-right bg-white border border-signal rounded px-1 tabular"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commitEdit(row, month)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setDraft(String(value))
                    }}
                  />
                ) : (
                  value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                )}
              </td>
            )
          })}
          <td className="px-3 py-1.5 text-right tabular font-medium text-ink-700">
            {annualTotal(row).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </td>
        </tr>
      ))}
    </>
  )
}
