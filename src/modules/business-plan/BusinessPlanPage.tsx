import { useEffect, useState, useCallback } from 'react'
import type { FiscalYear, PlanVersion, PlanGridRow } from '../../lib/types'
import { fetchFiscalYears, fetchVersions, createVersion, fetchGridData } from './api'
import PlanGrid from './PlanGrid'
import WellEntryForm from './WellEntryForm'
import BulkUploadForm from './BulkUploadForm'

type Tab = 'grid' | 'entry' | 'upload'

export default function BusinessPlanPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [fyId, setFyId] = useState<string>('')
  const [versions, setVersions] = useState<PlanVersion[]>([])
  const [versionId, setVersionId] = useState<string>('')
  const [rows, setRows] = useState<PlanGridRow[]>([])
  const [tab, setTab] = useState<Tab>('grid')
  const [loading, setLoading] = useState(false)
  const [showNewVersion, setShowNewVersion] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [cloneFrom, setCloneFrom] = useState<string>('')

  useEffect(() => {
    fetchFiscalYears().then((fys) => {
      setFiscalYears(fys)
      if (fys.length > 0) setFyId(fys[0].id)
    })
  }, [])

  useEffect(() => {
    if (!fyId) return
    fetchVersions(fyId).then((vs) => {
      setVersions(vs)
      if (vs.length > 0) setVersionId(vs[0].id)
      else setVersionId('')
    })
  }, [fyId])

  const loadGrid = useCallback(async () => {
    if (!versionId) return
    setLoading(true)
    try {
      const data = await fetchGridData(versionId)
      setRows(data)
    } finally {
      setLoading(false)
    }
  }, [versionId])

  useEffect(() => {
    loadGrid()
  }, [loadGrid])

  async function handleCreateVersion() {
    if (!newVersionName.trim() || !fyId) return
    const version = await createVersion(fyId, newVersionName.trim(), cloneFrom || undefined)
    setVersions((prev) => [...prev, version])
    setVersionId(version.id)
    setNewVersionName('')
    setCloneFrom('')
    setShowNewVersion(false)
  }

  const currentVersion = versions.find((v) => v.id === versionId)
  const readOnly = currentVersion?.status === 'locked'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs font-medium text-ink-500">Fiscal year</label>
          <select
            className="mt-1 block border border-ink-200 rounded-md px-2 py-1.5 text-sm min-w-[140px]"
            value={fyId}
            onChange={(e) => setFyId(e.target.value)}
          >
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-500">Version</label>
          <select
            className="mt-1 block border border-ink-200 rounded-md px-2 py-1.5 text-sm min-w-[160px]"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.status !== 'draft' ? `(${v.status})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowNewVersion((s) => !s)}
          className="text-sm px-3 py-1.5 rounded-md border border-ink-200 hover:border-signal"
        >
          + New version
        </button>

        <div className="ml-auto flex gap-1 border border-ink-200 rounded-md p-0.5 bg-white">
          {(['grid', 'entry', 'upload'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded ${
                tab === t ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {t === 'grid' ? 'Grid' : t === 'entry' ? 'Single-well entry' : 'Bulk upload'}
            </button>
          ))}
        </div>
      </div>

      {showNewVersion && (
        <div className="bg-white border border-ink-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-ink-500">New version name</label>
            <input
              className="mt-1 block border border-ink-200 rounded-md px-2 py-1.5 text-sm"
              placeholder="e.g. Revised Forecast"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500">Clone values from</label>
            <select
              className="mt-1 block border border-ink-200 rounded-md px-2 py-1.5 text-sm"
              value={cloneFrom}
              onChange={(e) => setCloneFrom(e.target.value)}
            >
              <option value="">Start empty</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateVersion}
            className="px-3 py-1.5 text-sm rounded-md bg-signal text-white"
          >
            Create
          </button>
        </div>
      )}

      {!versionId ? (
        <p className="text-ink-400 text-sm">
          No plan version yet for this fiscal year — create one above to get started.
        </p>
      ) : tab === 'grid' ? (
        loading ? (
          <p className="text-ink-400 text-sm">Loading…</p>
        ) : (
          <PlanGrid rows={rows} versionId={versionId} readOnly={readOnly} onCellSaved={loadGrid} />
        )
      ) : tab === 'entry' ? (
        <WellEntryForm versionId={versionId} onSaved={loadGrid} />
      ) : (
        <BulkUploadForm versionId={versionId} onSaved={loadGrid} />
      )}
    </div>
  )
}
