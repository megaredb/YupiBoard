import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  /** Omit for the current (last) crumb. */
  to?: "/" | "/events"
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-xs text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0" />}
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("truncate", isLast && "font-medium text-foreground")}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

