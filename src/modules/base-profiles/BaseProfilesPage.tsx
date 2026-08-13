import { useEffect, useState } from 'react'
import { Flame, Droplet, Droplets, CircleGauge } from 'lucide-react'
import { fetchProfileWellRows, buildMonthAxis } from './api'
import type { ProfileWellRow } from '../../lib/types'
import ProfileTimeline from './ProfileTimeline'

const LEGEND: { icon: typeof Flame; label: string; tone: string }[] = [
  { icon: Flame, label: 'Gas · Mscf/d', tone: 'text-accent-orange' },
  { icon: Droplet, label: 'Oil · bbl/d', tone: 'text-accent-blue' },
  { icon: CircleGauge, label: 'LPG · bbl/d', tone: 'text-ink-400' },
  { icon: Droplets, label: 'Condensate · bbl/d', tone: 'text-accent-blue' }
]

export default function BaseProfilesPage() {
  const [rows, setRows] = useState<ProfileWellRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const monthAxis = buildMonthAxis('2026-07-01', 60)

  useEffect(() => {
    fetchProfileWellRows()
      .then(setRows)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {LEGEND.map(({ icon: Icon, label, tone }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon size={15} className={tone} strokeWidth={2} />
            <span className="text-xs text-ink-500">{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-flag">
          Couldn't load profiles — {error}. Check your Supabase env vars and that the tables exist.
        </p>
      )}

      {!error && !rows && <p className="text-center text-sm text-ink-400">Loading…</p>}

      {rows && rows.length === 0 && (
        <p className="text-center text-sm text-ink-400">
          No wells found yet — run supabase/profiles_seed.sql to add fictional wells.
        </p>
      )}

      {rows && rows.length > 0 && <ProfileTimeline rows={rows} monthAxis={monthAxis} />}
    </div>
  )
}
