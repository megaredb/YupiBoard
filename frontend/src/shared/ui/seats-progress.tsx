import { cn } from "@/shared/lib/cn"

interface SeatsProgressProps {
  taken: number
  total: number
  label: string
  className?: string
}

/** Segmented bar, one segment per seat; a hidden native `<progress>` carries the semantics. */
export function SeatsProgress({ taken, total, label, className }: SeatsProgressProps) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      <progress className="sr-only" aria-label={label} value={taken} max={total} />
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "h-1.5 flex-1 rounded-full",
            index < taken ? "bg-primary" : "bg-foreground/10",
          )}
        />
      ))}
    </div>
  )
}
