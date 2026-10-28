import { cn } from "@/lib/utils"

interface SeatsProgressProps {
  taken: number
  total: number
  label: string
  className?: string
}

/** Segmented bar: one segment per seat, filled for taken seats. */
export function SeatsProgress({ taken, total, label, className }: SeatsProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={taken}
      className={cn("flex gap-1.5", className)}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn("h-1.5 flex-1 rounded-full", index < taken ? "bg-primary" : "bg-foreground/10")}
        />
      ))}
    </div>
  )
}
