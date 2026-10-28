import type { PaginationPage } from "@/components/ui/pagination"

/** 1-based `{ from, to }` for the "Showing 1–6 of 68" label. */
export function getPageRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0 }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return { from, to }
}

/** `[1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 12]` for `<Pagination>`. */
export function buildPaginationPages(current: number, total: number): PaginationPage[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: PaginationPage[] = [1]
  const windowStart = Math.max(2, current - 1)
  const windowEnd = Math.min(total - 1, current + 1)

  if (windowStart > 2) pages.push("ellipsis-start")
  for (let page = windowStart; page <= windowEnd; page++) pages.push(page)
  if (windowEnd < total - 1) pages.push("ellipsis-end")

  pages.push(total)
  return pages
}
