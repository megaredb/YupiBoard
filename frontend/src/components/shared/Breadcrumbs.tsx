import { Fragment } from "react"
import { Link, type LinkProps } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

export interface Crumb {
  label: string
  /** Omit for the current page. */
  to?: NonNullable<LinkProps["to"]>
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <ChevronRight aria-hidden className="size-3.5" />}
            <li className="min-w-0">
              {item.to ? (
                <Link to={item.to} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
