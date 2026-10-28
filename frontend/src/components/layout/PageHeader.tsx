import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  /** Right-aligned slot (e.g. a count or a button). */
  aside?: ReactNode
}

export function PageHeader({ title, description, aside }: PageHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  )
}
