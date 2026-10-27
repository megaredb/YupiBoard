import { cn } from '../../lib/utils'

export type PaginationPage = number | 'ellipsis-start' | 'ellipsis-end'

export interface PaginationProps {
  pages: PaginationPage[]
  currentPage: number
  summary?: string
  isPreviousDisabled?: boolean
  isNextDisabled?: boolean
  onPageChange?: (page: number) => void
  onPrevious?: () => void
  onNext?: () => void
  className?: string
}

const controlClass =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium text-foreground disabled:pointer-events-none disabled:opacity-50'

export function Pagination({
  pages,
  currentPage,
  summary,
  isPreviousDisabled = false,
  isNextDisabled = false,
  onPageChange,
  onPrevious,
  onNext,
  className,
}: PaginationProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      {summary && <p className="text-xs text-muted-foreground">{summary}</p>}

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          disabled={isPreviousDisabled}
          onClick={onPrevious}
          className={cn(controlClass, 'px-3')}
        >
          Previous
        </button>

        {pages.map((page) =>
          typeof page === 'number' ? (
            <button
              key={page}
              type="button"
              aria-current={page === currentPage ? 'page' : undefined}
              onClick={() => onPageChange?.(page)}
              className={cn(
                controlClass,
                page === currentPage && 'bg-primary/15 text-primary',
              )}
            >
              {page}
            </button>
          ) : (
            <span
              key={page}
              aria-hidden
              className={cn(controlClass, 'text-muted-foreground')}
            >
              …
            </span>
          ),
        )}

        <button
          type="button"
          disabled={isNextDisabled}
          onClick={onNext}
          className={cn(controlClass, 'px-3')}
        >
          Next
        </button>
      </nav>
    </div>
  )
}