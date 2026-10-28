import type { PaginationPage } from "@/components/shared/Pagination"

/** Shape every paginated list hook resolves with (mocks now, mapped API responses later). */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/** 1-based inclusive range of items shown on a page, e.g. "Showing 7–12 of 68". */
export function getPageRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0 }
  return {
    from: (page - 1) * pageSize + 1,
    to: Math.min(page * pageSize, total),
  }
}

/** Page buttons for <Pagination>: `1 2 3 … 12`, `1 … 4 5 6 … 12`, `1 … 10 11 12`. */
export function buildPaginationPages(current: number, totalPages: number): PaginationPage[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, "ellipsis-end", totalPages]
  if (current >= totalPages - 2) {
    return [1, "ellipsis-start", totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, "ellipsis-start", current - 1, current, current + 1, "ellipsis-end", totalPages]
}
