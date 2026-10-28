import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface NumberStepperProps {
  id?: string
  value: number
  onChange: (next: number) => void
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
    <div className="flex h-10 items-center justify-between rounded-lg border border-input bg-transparent px-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="size-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Minus className="size-4" />
      </Button>

      <output id={id} {...aria} className="text-sm font-medium tabular-nums">
        {value}
      </output>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="size-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

