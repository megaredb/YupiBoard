export interface PageRange {
  from: number
  to: number
}

/** 1-based `{ from, to }` for the "Showing 1–6 of 68" label. */
export function getPageRange(page: number, pageSize: number, total: number): PageRange {
  if (total === 0) return { from: 0, to: 0 }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return { from, to }
}
