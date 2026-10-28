import type { UseQueryResult } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Pagination } from "@/components/shared/Pagination"
import { StatusMessage } from "@/components/shared/StatusMessage"
import { Button } from "@/components/ui/button"
import { buildPaginationPages, getPageRange, getTotalPages, type Paginated } from "@/lib/pagination"
import { cn } from "@/lib/utils"
import type { EventSummary } from "../types"
import { EventCardSkeleton } from "./EventCardSkeleton"
import { EventGrid } from "./EventGrid"
import { EventSummaryCard } from "./EventSummaryCard"

interface EventListSectionProps {
  query: Pick<
    UseQueryResult<Paginated<EventSummary>>,
    "data" | "isPending" | "isError" | "isPlaceholderData" | "refetch"
  >
  onPageChange: (page: number) => void
  showOrganizer?: boolean
  /** Heading above the grid, e.g. "68 events found". */
  countLabel: (total: number) => string
  emptyTitle: string
  emptyDescription?: string
}

/**
 * The whole "paged list of event cards" block with loading, error and empty states.
 * Used by the catalog, "My events" and "My bookings".
 */
export function EventListSection({
  query,
  onPageChange,
  showOrganizer = false,
  countLabel,
  emptyTitle,
  emptyDescription,
}: EventListSectionProps) {
  const { t } = useTranslation()
  const { data } = query

  if (query.isError) {
    return (
      <StatusMessage
        title={t("common.loadFailed")}
        action={
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    )
  }

  if (query.isPending || !data) {
    return (
      <EventGrid aria-busy>
        {Array.from({ length: 6 }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </EventGrid>
    )
  }

  if (data.items.length === 0) {
    return <StatusMessage title={emptyTitle} description={emptyDescription} />
  }

  const totalPages = getTotalPages(data.total, data.pageSize)
  const { from, to } = getPageRange(data.page, data.pageSize, data.total)

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold">{countLabel(data.total)}</p>

      <EventGrid className={cn("transition-opacity", query.isPlaceholderData && "opacity-60")}>
        {data.items.map((event) => (
          <EventSummaryCard key={event.id} event={event} showOrganizer={showOrganizer} />
        ))}
      </EventGrid>

      {totalPages > 1 && (
        <Pagination
          pages={buildPaginationPages(data.page, totalPages)}
          currentPage={data.page}
          summary={t("events.pagination.summary", { from, to, total: data.total })}
          isPreviousDisabled={data.page <= 1}
          isNextDisabled={data.page >= totalPages}
          onPageChange={onPageChange}
          onPrevious={() => onPageChange(data.page - 1)}
          onNext={() => onPageChange(data.page + 1)}
        />
      )}
    </div>
  )
}
