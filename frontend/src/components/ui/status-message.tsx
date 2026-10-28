import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface StatusMessageProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Centered empty / error / not-found box. */
export function StatusMessage({ title, description, action, className }: StatusMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      <p className="text-base font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

