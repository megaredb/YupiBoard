import { useId, useState } from "react"
import { Label } from "@/components/ui/label"

export interface RangeSliderProps {
  label: string
  /** Text shown next to the label for the current value, e.g. "Within 15 km". */
  formatValue: (value: number) => string
  /** Text under the track ends, e.g. "1 km". */
  formatBound?: (value: number) => string
  min: number
  max: number
  step?: number
  value: number
  /** Called when the user releases the thumb (or key), not on every tick. */
  onCommit: (value: number) => void
}

export function RangeSlider({
  label,
  formatValue,
  formatBound = String,
  min,
  max,
  step = 1,
  value,
  onCommit,
}: RangeSliderProps) {
  const id = useId()

  // Local value while dragging; re-synced whenever the committed value changes from outside.
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)
  if (syncedValue !== value) {
    setSyncedValue(value)
    setDraft(value)
  }

  const commit = (next: number) => {
    if (next !== value) onCommit(next)
  }
  const progress = ((draft - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <span className="text-xs font-medium text-primary">{formatValue(draft)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        // The filled part of the track is drawn from this CSS variable (see `.range-slider` in index.css).
        ref={(node) => node?.style.setProperty("--slider-progress", `${progress}%`)}
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerUp={(event) => commit(Number(event.currentTarget.value))}
        onKeyUp={(event) => commit(Number(event.currentTarget.value))}
        onBlur={(event) => commit(Number(event.currentTarget.value))}
        className="range-slider h-6 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatBound(min)}</span>
        <span>{formatBound(max)}</span>
      </div>
    </div>
  )
}

