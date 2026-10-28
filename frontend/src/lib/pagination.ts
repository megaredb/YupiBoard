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

/** Keep a compact three-page window so the controls remain usable on mobile. */
export function buildPaginationPages(current: number, totalPages: number): PaginationPage[] {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const firstPage = Math.max(1, Math.min(current - 1, totalPages - 2))
  return [firstPage, firstPage + 1, firstPage + 2]
}
