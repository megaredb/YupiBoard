import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  aside?: ReactNode
  className?: string
}

export function PageHeader({ title, description, aside, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {aside}
    </div>
  )
}

