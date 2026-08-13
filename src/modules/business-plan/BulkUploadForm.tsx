import { useState } from 'react'
import * as XLSX from 'xlsx'
import { bulkUpsert, type BulkRow } from './api'

const TEMPLATE_COLUMNS = ['field_name', 'well_name', 'month_index', 'oil_rate', 'gas_rate', 'water_rate']

export default function BulkUploadForm({
  versionId,
  onSaved
}: {
  versionId: string
  onSaved: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  function downloadTemplate() {
    const example: BulkRow[] = [
      { field_name: 'Field-01', well_name: 'Field-01-W01', month_index: 1, oil_rate: 120, gas_rate: 300, water_rate: 10 },
      { field_name: 'Field-01', well_name: 'Field-01-W01', month_index: 2, oil_rate: 115, gas_rate: 295, water_rate: 11 }
    ]
    const ws = XLSX.utils.json_to_sheet(example, { header: TEMPLATE_COLUMNS })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'business_plan')
    XLSX.writeFile(wb, 'business-plan-upload-template.xlsx')
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setBusy(true)
    setResult(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

      const parsed: BulkRow[] = rows.map((r) => ({
        field_name: String(r.field_name ?? '').trim(),
        well_name: String(r.well_name ?? '').trim(),
        month_index: Number(r.month_index),
        oil_rate: r.oil_rate !== undefined ? Number(r.oil_rate) : undefined,
        gas_rate: r.gas_rate !== undefined ? Number(r.gas_rate) : undefined,
        water_rate: r.water_rate !== undefined ? Number(r.water_rate) : undefined
      }))

      const outcome = await bulkUpsert(versionId, parsed)
      setResult(outcome)
      if (outcome.inserted > 0) onSaved()
    } catch (err) {
      setResult({ inserted: 0, errors: [(err as Error).message] })
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-4 space-y-4 max-w-2xl">
      <div>
        <p className="text-sm text-ink-600">
          Upload a spreadsheet with one row per well per month. Columns:{' '}
          <code className="text-xs bg-ink-100 px-1 py-0.5 rounded">{TEMPLATE_COLUMNS.join(', ')}</code>
        </p>
        <p className="text-xs text-ink-400 mt-1">
          Unknown fields or wells are created automatically. Existing rows for the same well/month are
          overwritten and flagged as manual overrides.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={downloadTemplate}
          className="text-sm px-3 py-1.5 rounded-md border border-ink-200 hover:border-signal"
        >
          Download template (.xlsx)
        </button>
        <label className="text-sm px-3 py-1.5 rounded-md bg-signal text-white cursor-pointer">
          {busy ? 'Uploading…' : 'Choose file…'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
            disabled={busy}
          />
        </label>
        {fileName && <span className="text-xs text-ink-400">{fileName}</span>}
      </div>

      {result && (
        <div className="text-sm space-y-1">
          <p className="text-ink-700">
            {result.inserted} row{result.inserted === 1 ? '' : 's'} saved.
          </p>
          {result.errors.length > 0 && (
            <ul className="text-xs text-flag list-disc pl-4 space-y-0.5 max-h-40 overflow-auto">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
