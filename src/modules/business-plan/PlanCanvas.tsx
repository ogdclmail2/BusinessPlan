import { useMemo } from 'react'
import type { Activity } from '../../lib/types'
import { YEARS, parseMonth } from './planConfig'
import ActivityCard from './ActivityCard'

// A card belongs to a (field, year) cell; within a cell they stack vertically,
// ordered by month. Horizontal position within the year column encodes month.
export default function PlanCanvas({
  activities,
  fields,
  onCardClick,
  onDropCard
}: {
  activities: Activity[]
  fields: string[]
  onCardClick: (a: Activity) => void
  onDropCard: (activityId: string, year: number) => void
}) {
  const byFieldYear = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const a of activities) {
      const { year } = parseMonth(a.onprod_date)
      const key = `${a.field_name}::${year}`
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((x, y) => parseMonth(x.onprod_date).month - parseMonth(y.onprod_date).month)
    }
    return map
  }, [activities])

  return (
    <div className="rounded-2xl ring-1 ring-ink-200 bg-white overflow-hidden">
      {/* Year band header */}
      <div className="grid" style={{ gridTemplateColumns: `160px repeat(${YEARS.length}, 1fr)` }}>
        <div className="bg-ink-50 border-b border-ink-200" />
        {YEARS.map((y, i) => (
          <div
            key={y}
            className={`bg-ink-50 border-b border-ink-200 py-3 text-center ${
              i > 0 ? 'border-l border-ink-200' : ''
            }`}
          >
            <span className="text-lg font-bold text-ink-800 tabular">{y}</span>
          </div>
        ))}
      </div>

      {/* Field swimlanes */}
      <div>
        {fields.map((field, rowIdx) => (
          <div
            key={field}
            className="grid"
            style={{ gridTemplateColumns: `160px repeat(${YEARS.length}, 1fr)` }}
          >
            {/* Field label */}
            <div
              className={`flex items-center px-4 py-3 ${
                rowIdx % 2 === 1 ? 'bg-ink-50/40' : 'bg-white'
              } ${rowIdx > 0 ? 'border-t border-ink-100' : ''}`}
            >
              <span className="text-[15px] font-bold text-ink-800 leading-tight">{field}</span>
            </div>

            {/* Year cells */}
            {YEARS.map((year, i) => {
              const cards = byFieldYear.get(`${field}::${year}`) ?? []
              return (
                <YearCell
                  key={year}
                  cards={cards}
                  striped={rowIdx % 2 === 1}
                  bordered={i > 0}
                  topBorder={rowIdx > 0}
                  onDrop={(id) => onDropCard(id, year)}
                  onCardClick={onCardClick}
                />
              )
            })}
          </div>
        ))}
        {fields.length === 0 && (
          <div className="py-16 text-center text-ink-400 text-sm">
            No fields yet — add an activity to get started.
          </div>
        )}
      </div>
    </div>
  )
}

function YearCell({
  cards,
  striped,
  bordered,
  topBorder,
  onDrop,
  onCardClick
}: {
  cards: Activity[]
  striped: boolean
  bordered: boolean
  topBorder: boolean
  onDrop: (activityId: string) => void
  onCardClick: (a: Activity) => void
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDrop(id)
      }}
      className={`px-2.5 py-2.5 space-y-2 min-h-[84px] ${striped ? 'bg-ink-50/40' : 'bg-white'} ${
        bordered ? 'border-l border-ink-200' : ''
      } ${topBorder ? 'border-t border-ink-100' : ''}`}
    >
      {cards.map((a) => (
        <ActivityCard
          key={a.id}
          activity={a}
          onClick={() => onCardClick(a)}
          onDragStart={(e) => e.dataTransfer.setData('text/plain', a.id)}
        />
      ))}
    </div>
  )
}
