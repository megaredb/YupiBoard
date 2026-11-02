import { cva } from "class-variance-authority"
import { cn } from "@/shared/lib/cn"
import type { PaginationPage } from "@/shared/lib/pagination/build-pagination-pages"

interface PaginationLabels {
  navigation: string
  previous: string
  next: string
}

interface PaginationProps {
  pages: PaginationPage[]
  currentPage: number
  totalPages: number
  summary?: string
  labels: PaginationLabels
  onPageChange: (page: number) => void
  className?: string
}

// Decorative gap marker (aria-hidden), not language text.
const ELLIPSIS = "…"

const controlVariants = cva(
  "touch-hitbox relative inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium text-foreground disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      state: {
        idle: "",
        current: "bg-primary/15 text-primary",
        ellipsis: "text-muted-foreground",
      },
    },
    defaultVariants: { state: "idle" },
  },
)

export function Pagination({
  pages,
  currentPage,
  totalPages,
  summary,
  labels,
  onPageChange,
  className,
}: PaginationProps) {
  const handlePrevious = () => onPageChange(currentPage - 1)
  const handleNext = () => onPageChange(currentPage + 1)

  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      {summary && <p className="text-xs text-muted-foreground">{summary}</p>}

      <nav aria-label={labels.navigation} className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={handlePrevious}
          className={cn(controlVariants(), "px-3")}
        >
          {labels.previous}
        </button>

        {pages.map((page) =>
          typeof page === "number" ? (
            <button
              key={page}
              type="button"
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
              className={controlVariants({ state: page === currentPage ? "current" : "idle" })}
            >
              {page}
            </button>
          ) : (
            <span key={page} aria-hidden className={controlVariants({ state: "ellipsis" })}>
              {ELLIPSIS}
            </span>
          ),
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={handleNext}
          className={cn(controlVariants(), "px-3")}
        >
          {labels.next}
        </button>
      </nav>
    </div>
  )
}
