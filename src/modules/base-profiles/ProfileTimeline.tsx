import { Flame, Droplet, Droplets, CircleGauge } from 'lucide-react'
import type { ProfileWellRow } from '../../lib/types'

const numberFmt = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : Math.round(n).toLocaleString()

function monthLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const year = d.getUTCFullYear()
  return { month, year }
}

function Stat({
  icon: Icon,
  value,
  tone
}: {
  icon: typeof Flame
  value: number | null | undefined
  tone: 'orange' | 'blue' | 'grey'
}) {
  const color =
    tone === 'orange' ? 'text-accent-orange' : tone === 'blue' ? 'text-accent-blue' : 'text-ink-400'
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Icon size={14} className={color} strokeWidth={2} />
      <span className="tabular text-[15px] font-medium text-ink-800">{numberFmt(value)}</span>
    </div>
  )
}

export default function ProfileTimeline({
  rows,
  monthAxis
}: {
  rows: ProfileWellRow[]
  monthAxis: string[]
}) {
  return (
    <div className="border border-ink-200 rounded-2xl overflow-hidden bg-white">
      <div className="overflow-auto max-h-[75vh]">
        <table className="border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                className="sticky top-0 left-0 z-30 bg-white w-[210px] min-w-[210px] border-b border-ink-200"
                aria-hidden
              />
              {monthAxis.map((iso, i) => {
                const { month, year } = monthLabel(iso)
                const isYearStart = i % 12 === 0
                return (
                  <th
                    key={iso}
                    className={`sticky top-0 z-20 bg-white border-b border-ink-200 px-2 py-2 w-[132px] min-w-[132px] ${
                      isYearStart ? 'border-l-2 border-l-ink-200' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold text-ink-700">{month}</div>
                    <div className="text-[11px] text-ink-400">{year}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const isGas = row.well.well_type === 'gas'
              const NameIcon = isGas ? Flame : Droplet
              const nameIconColor = isGas ? 'text-accent-orange' : 'text-accent-blue'
              const ratio = isGas
                ? row.well.cgr !== null
                  ? `CGR ${row.well.cgr}`
                  : null
                : row.well.gor !== null
                  ? `GOR ${row.well.gor}`
                  : null

              return (
                <tr key={row.well.id} className={rIdx % 2 === 1 ? 'bg-ink-50/50' : 'bg-white'}>
                  <td
                    className={`sticky left-0 z-10 px-4 py-3 border-b border-ink-100 ${
                      rIdx % 2 === 1 ? 'bg-ink-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <NameIcon size={16} className={nameIconColor} strokeWidth={2.2} />
                      <span className="text-[15px] font-semibold text-ink-900">{row.well.name}</span>
                    </div>
                    {ratio && <div className="text-[11px] text-ink-400 pl-6 mt-0.5">{ratio}</div>}
                  </td>

                  {monthAxis.map((iso, i) => {
                    const v = row.months[iso]
                    const isYearStart = i % 12 === 0
                    return (
                      <td
                        key={iso}
                        className={`px-2 py-2.5 border-b border-ink-100 ${
                          isYearStart ? 'border-l-2 border-l-ink-200' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          {isGas ? (
                            <>
                              <Stat icon={Flame} value={v?.gas_rate} tone="orange" />
                              <Stat icon={CircleGauge} value={v?.lpg_rate} tone="grey" />
                              <Stat icon={Droplets} value={v?.condensate_rate} tone="blue" />
                            </>
                          ) : (
                            <>
                              <Stat icon={Droplet} value={v?.oil_rate} tone="blue" />
                              <Stat icon={CircleGauge} value={v?.lpg_rate} tone="grey" />
                              <Stat icon={Flame} value={v?.gas_rate} tone="orange" />
                            </>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
