import { Pencil, Clock } from 'lucide-react'
import type { Activity } from '../../lib/types'
import { ACTIVITY_CONFIG } from './planConfig'

export default function ActivityCard({
  activity,
  onClick,
  onDragStart
}: {
  activity: Activity
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
}) {
  const cfg = ACTIVITY_CONFIG[activity.activity_type]
  const Icon = cfg.icon
  const dropped = activity.status === 'dropped'

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`group relative w-full text-left rounded-xl px-3 py-2.5 ring-1 transition-all
        ${dropped ? 'bg-rose-50 ring-rose-200 opacity-70' : `${cfg.tint} ${cfg.ring}`}
        hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={20}
          strokeWidth={2.2}
          className={dropped ? 'text-rose-400' : cfg.color}
        />
        <span
          className={`text-[15px] font-semibold leading-tight truncate ${
            dropped ? 'text-rose-700 line-through' : 'text-ink-900'
          }`}
        >
          {activity.well_name ?? cfg.short}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-2 pl-7">
        {activity.well_category && !dropped && (
          <span
            className={`w-2 h-2 rounded-full ${
              activity.well_category === 'gas' ? 'bg-accent-orange' : 'bg-accent-blue'
            }`}
          />
        )}
        <span className="text-xs text-ink-500 truncate">
          {dropped ? 'Dropped' : cfg.short}
        </span>

        <span className="ml-auto flex items-center gap-1.5">
          {activity.is_edited && !dropped && (
            <Pencil size={13} className="text-ink-400" strokeWidth={2} />
          )}
        </span>
      </div>
    </button>
  )
}

// small helper icon used elsewhere if needed
export { Clock }
