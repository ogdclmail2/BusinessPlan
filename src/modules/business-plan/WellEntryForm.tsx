import { useEffect, useMemo, useState } from 'react'
import type { Field, Well } from '../../lib/types'
import { fetchFieldsAndWells, createField, createWell, upsertWellMonths } from './api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type MonthRow = { oil: string; gas: string; water: string }

const emptyMonths = (): MonthRow[] => Array.from({ length: 12 }, () => ({ oil: '', gas: '', water: '' }))

export default function WellEntryForm({
  versionId,
  onSaved
}: {
  versionId: string
  onSaved: () => void
}) {
  const [fields, setFields] = useState<Field[]>([])
  const [wells, setWells] = useState<Well[]>([])
  const [fieldId, setFieldId] = useState<string>('')
  const [wellId, setWellId] = useState<string>('')
  const [newFieldName, setNewFieldName] = useState('')
  const [newWellName, setNewWellName] = useState('')
  const [months, setMonths] = useState<MonthRow[]>(emptyMonths())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchFieldsAndWells().then(({ fields, wells }) => {
      setFields(fields)
      setWells(wells)
    })
  }, [])

  const wellsForField = useMemo(() => wells.filter((w) => w.field_id === fieldId), [wells, fieldId])

  async function handleAddField() {
    if (!newFieldName.trim()) return
    const field = await createField(newFieldName.trim())
    setFields((prev) => [...prev, field])
    setFieldId(field.id)
    setNewFieldName('')
  }

  async function handleAddWell() {
    if (!newWellName.trim() || !fieldId) return
    const well = await createWell(fieldId, newWellName.trim())
    setWells((prev) => [...prev, well])
    setWellId(well.id)
    setNewWellName('')
  }

  function updateMonth(i: number, key: keyof MonthRow, value: string) {
    setMonths((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)))
  }

  async function handleSubmit() {
    if (!wellId) {
      setMessage('Pick a field and well first.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const payload = months.map((m, i) => ({
        month_index: i + 1,
        oil_rate: Number(m.oil) || 0,
        gas_rate: Number(m.gas) || 0,
        water_rate: Number(m.water) || 0
      }))
      await upsertWellMonths(versionId, wellId, payload)
      setMessage('Saved.')
      setMonths(emptyMonths())
      onSaved()
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-4 space-y-4 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-ink-500">Field</label>
          <select
            className="mt-1 w-full border border-ink-200 rounded-md px-2 py-1.5 text-sm"
            value={fieldId}
            onChange={(e) => {
              setFieldId(e.target.value)
              setWellId('')
            }}
          >
            <option value="">Select a field…</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <div className="mt-1 flex gap-1">
            <input
              className="flex-1 border border-ink-200 rounded-md px-2 py-1 text-xs"
              placeholder="New field name"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
            />
            <button
              onClick={handleAddField}
              className="text-xs px-2 py-1 rounded-md border border-ink-200 hover:border-signal"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-500">Well</label>
          <select
            className="mt-1 w-full border border-ink-200 rounded-md px-2 py-1.5 text-sm disabled:bg-ink-50"
            value={wellId}
            onChange={(e) => setWellId(e.target.value)}
            disabled={!fieldId}
          >
            <option value="">Select a well…</option>
            {wellsForField.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <div className="mt-1 flex gap-1">
            <input
              className="flex-1 border border-ink-200 rounded-md px-2 py-1 text-xs disabled:bg-ink-50"
              placeholder="New well name"
              value={newWellName}
              onChange={(e) => setNewWellName(e.target.value)}
              disabled={!fieldId}
            />
            <button
              onClick={handleAddWell}
              disabled={!fieldId}
              className="text-xs px-2 py-1 rounded-md border border-ink-200 hover:border-signal disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-500">
            <th className="py-1">Month</th>
            <th className="py-1 text-right">Oil (bbl)</th>
            <th className="py-1 text-right">Gas (mcf)</th>
            <th className="py-1 text-right">Water (bbl)</th>
          </tr>
        </thead>
        <tbody>
          {MONTHS.map((label, i) => (
            <tr key={label} className="border-t border-ink-100">
              <td className="py-1 text-ink-600">{label}</td>
              {(['oil', 'gas', 'water'] as const).map((key) => (
                <td key={key} className="py-1">
                  <input
                    type="number"
                    className="w-full text-right border border-ink-200 rounded px-1.5 py-1 tabular"
                    value={months[i][key]}
                    onChange={(e) => updateMonth(i, key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 text-sm rounded-md bg-signal text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save well profile'}
        </button>
        {message && <span className="text-sm text-ink-500">{message}</span>}
      </div>
    </div>
  )
}
