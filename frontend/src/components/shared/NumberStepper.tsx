import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NumberStepperProps {
  id?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  decreaseLabel: string
  increaseLabel: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

export function NumberStepper({
  id,
  value,
  onChange,
  min,
  max,
  decreaseLabel,
  increaseLabel,
  ...aria
}: NumberStepperProps) {
  return (
    <div id={id} role="group" {...aria} className="flex h-9 w-40 items-center justify-between rounded-lg border border-input bg-card px-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <output aria-live="polite" className="text-sm font-medium tabular-nums">
        {value}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  )
}
