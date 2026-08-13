import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { MONTHS_SHORT, parseMonth } from './planConfig'

export default function MoveConfirm({
  fromISO,
  toISO,
  onConfirm,
  onCancel
}: {
  fromISO: string
  toISO: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  const from = parseMonth(fromISO)
  const to = parseMonth(toISO)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-bold text-ink-900 text-center">Confirm move</div>

        <div className="flex items-center justify-center gap-3 text-[15px]">
          <span className="px-3 py-1.5 rounded-lg bg-ink-100 font-semibold text-ink-700 tabular">
            {MONTHS_SHORT[from.month - 1]} {from.year}
          </span>
          <ArrowRight size={20} className="text-ink-400" />
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 ring-1 ring-blue-200 font-semibold text-accent-blue tabular">
            {MONTHS_SHORT[to.month - 1]} {to.year}
          </span>
        </div>

        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
            Reason for move
          </span>
          <textarea
            autoFocus
            rows={2}
            className="mt-1 w-full border border-ink-200 rounded-lg px-3 py-2 text-[15px] focus:border-accent-blue"
            placeholder="e.g. deferral, rig availability, security…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        <div className="flex gap-2 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg ring-1 ring-ink-200 text-ink-600 font-medium hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2.5 rounded-lg bg-accent-blue text-white font-medium disabled:opacity-40"
          >
            Confirm move
          </button>
        </div>
      </div>
    </div>
  )
}
