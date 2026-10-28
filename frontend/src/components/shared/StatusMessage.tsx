import type { ReactNode } from "react"

interface StatusMessageProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Centered empty / error block for lists and pages. */
export function StatusMessage({ title, description, action }: StatusMessageProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
