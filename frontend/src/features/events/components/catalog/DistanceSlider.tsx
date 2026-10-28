import { useState } from "react"
import { useTranslation } from "react-i18next"
import { DISTANCE_RANGE_KM } from "../../constants"

interface DistanceSliderProps {
  value: number
  /** Called when the user releases the thumb (or key), not on every tick. */
  onCommit: (km: number) => void
}

export function DistanceSlider({ value, onCommit }: DistanceSliderProps) {
  const { t } = useTranslation()

  // Local value while dragging; re-synced whenever the committed value changes from outside.
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)
  if (syncedValue !== value) {
    setSyncedValue(value)
    setDraft(value)
  }

  const commit = (km: number) => {
    if (km !== value) onCommit(km)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="distance-slider" className="text-sm font-medium">
          {t("events.filters.distance")}
        </label>
        <span className="text-xs font-medium text-primary">
          {t("events.filters.within", { km: draft })}
        </span>
      </div>
      <input
        id="distance-slider"
        type="range"
        min={DISTANCE_RANGE_KM.min}
        max={DISTANCE_RANGE_KM.max}
        step={1}
        value={draft}
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerUp={(event) => commit(Number(event.currentTarget.value))}
        onKeyUp={(event) => commit(Number(event.currentTarget.value))}
        onBlur={(event) => commit(Number(event.currentTarget.value))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{DISTANCE_RANGE_KM.min} km</span>
        <span>{DISTANCE_RANGE_KM.max} km</span>
      </div>
    </div>
  )
}
