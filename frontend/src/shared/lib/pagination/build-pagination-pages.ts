export type PaginationPage = number | "ellipsis-start" | "ellipsis-end";

const MAX_PAGES_WITHOUT_ELLIPSIS = 7;

/** `[1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 12]` for `<Pagination>`. */
export function buildPaginationPages(current: number, total: number): PaginationPage[] {
  if (total <= MAX_PAGES_WITHOUT_ELLIPSIS) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: PaginationPage[] = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  if (windowStart > 2) pages.push("ellipsis-start");
  for (let page = windowStart; page <= windowEnd; page++) pages.push(page);
  if (windowEnd < total - 1) pages.push("ellipsis-end");

  pages.push(total);
  return pages;
}
