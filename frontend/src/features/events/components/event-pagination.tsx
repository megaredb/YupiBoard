import { useTranslation } from "react-i18next"
import { buildPaginationPages } from "@/shared/lib/pagination/build-pagination-pages"
import { getPageRange } from "@/shared/lib/pagination/get-page-range"
import { Pagination } from "@/shared/ui/pagination"
import { EVENTS_PAGE_SIZE } from "@/features/events/schemas/catalog-search.schema"

interface EventPaginationProps {
  page: number
  total: number | null
  totalPages: number
  onPageChange: (page: number) => void
}

export function EventPagination({ page, total, totalPages, onPageChange }: EventPaginationProps) {
  const { t } = useTranslation()
  if (total === null || totalPages <= 1) return null

  return (
    <Pagination
      pages={buildPaginationPages(page, totalPages)}
      currentPage={page}
      totalPages={totalPages}
      summary={t("events.pagination.summary", {
        ...getPageRange(page, EVENTS_PAGE_SIZE, total),
        total,
      })}
      labels={{
        navigation: t("common.pagination.label"),
        previous: t("common.pagination.previous"),
        next: t("common.pagination.next"),
      }}
      onPageChange={onPageChange}
    />
  )
}
