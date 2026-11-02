import { useId, useState, type ChangeEvent, type SyntheticEvent } from "react"
import { Label } from "@/shared/ui/label"

interface RangeSliderProps {
  label: string
  /** Text shown next to the label for the current value, e.g. "Within 15 km". */
  formatValue: (value: number) => string
  /** Text under the track ends, e.g. "1 km". */
  formatBound: (value: number) => string
  min: number
  max: number
  /** Initial position; remount with a new `key` to reset it from outside. */
  value: number
  /** Called when the user releases the thumb (or key), not on every tick. */
  onCommit: (value: number) => void
}

export function RangeSlider({
  label,
  formatValue,
  formatBound,
  min,
  max,
  value,
  onCommit,
}: RangeSliderProps) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const progress = ((draft - min) / (max - min)) * 100

  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    setDraft(Number(event.target.value))
  const handleCommit = (event: SyntheticEvent<HTMLInputElement>) => {
    const next = Number(event.currentTarget.value)
    if (next !== value) onCommit(next)
  }
  // The filled part of the track is drawn from this variable (see `.range-slider` in the styles).
  const paintProgress = (node: HTMLInputElement | null) =>
    node?.style.setProperty("--slider-progress", `${progress}%`)

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
        value={draft}
        ref={paintProgress}
        onChange={handleChange}
        onPointerUp={handleCommit}
        onKeyUp={handleCommit}
        onBlur={handleCommit}
        className="range-slider h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatBound(min)}</span>
        <span>{formatBound(max)}</span>
      </div>
    </div>
  )
}
