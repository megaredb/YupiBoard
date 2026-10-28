import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { EventListItem, EventRead } from "@/api/model"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/ui/event-card"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusMessage } from "@/components/ui/status-message"
import { formatCardDate, formatKm, formatPrice, getInitials, parseAmount } from "@/lib/format"
import { buildPaginationPages, getPageRange } from "@/lib/pagination"
import { cn } from "@/lib/utils"

/** Both the catalog item and the full event can be shown as a card. */
export type EventCardSource = EventListItem | EventRead

export interface EventListPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
}

export interface EventListProps {
  events: EventCardSource[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
  /** Dim the grid while the next page is loading. */
  isFetching?: boolean
  showOrganizer?: boolean
  /** Heading above the grid, e.g. "68 events found". */
  countLabel?: string
  countClassName?: string
  emptyTitle: string
  emptyDescription?: string
  pagination?: EventListPagination
}

function EventCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <div className="space-y-3 p-3">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  )
}

/** Backend event -> presentational `<EventCard>` (from `ui/`), wrapped in a link to the event page. */
function EventLinkCard({ event, showOrganizer }: { event: EventCardSource; showOrganizer: boolean }) {
  const { t } = useTranslation()
  const price = parseAmount(event.entry_cost)
  const isFree = price === 0
  const distanceKm = "distance_km" in event ? event.distance_km : null
  const isFinished = "status" in event && (event.status === "Completed" || event.status === "Cancelled")
  const { organizer } = event

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <EventCard
        className="transition-shadow group-hover:shadow-md"
        title={event.title}
        imageUrl={"photo_url" in event ? event.photo_url : null}
        date={formatCardDate(event.start_datetime)}
        distance={
          distanceKm == null
            ? "address" in event
              ? event.address
              : t("events.card.noDistance")
            : t("events.card.distance", { km: formatKm(distanceKm) })
        }
        price={isFree ? t("events.free") : formatPrice(price)}
        isFree={isFree}
        status={isFinished ? "finished" : event.is_promoted ? "promoted" : null}
        participants={{ current: event.current_confirmed, max: event.max_players }}
        // Design shows the purple badge on free events, amber on paid ones.
        variant={isFree ? "purple" : "default"}
        organizer={
          showOrganizer
            ? {
                name: organizer.name,
                initials: getInitials(organizer.name),
                rating: organizer.rating_as_organizer
                  ? parseAmount(organizer.rating_as_organizer).toFixed(1)
                  : null,
              }
            : null
        }
      />
    </Link>
  )
}

/** Paged grid of event cards with loading, error and empty states (catalog, my events, bookings, favorites). */
export function EventList({
  events,
  isPending,
  isError,
  onRetry,
  isFetching = false,
  showOrganizer = false,
  countLabel,
  countClassName,
  emptyTitle,
  emptyDescription,
  pagination,
}: EventListProps) {
  const { t } = useTranslation()

  if (isError) {
    return (
      <StatusMessage
        title={t("common.loadFailed")}
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        }
      />
    )
  }

  if (isPending || !events) {
    return (
      <div aria-busy className="grid w-full grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return <StatusMessage title={emptyTitle} description={emptyDescription} />
  }

  const range = pagination ? getPageRange(pagination.page, pagination.pageSize, pagination.total) : null

  return (
    <div className="space-y-6">
      {countLabel && <p className={cn("text-sm font-semibold", countClassName)}>{countLabel}</p>}

      <div className={cn("grid w-full grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 transition-opacity", isFetching && "opacity-60")}>
        {events.map((event) => (
          <EventLinkCard key={event.id} event={event} showOrganizer={showOrganizer} />
        ))}
      </div>

      {pagination && range && pagination.totalPages > 1 && (
        <Pagination
          pages={buildPaginationPages(pagination.page, pagination.totalPages)}
          currentPage={pagination.page}
          summary={t("events.pagination.summary", { ...range, total: pagination.total })}
          isPreviousDisabled={pagination.page <= 1}
          isNextDisabled={pagination.page >= pagination.totalPages}
          onPageChange={pagination.onPageChange}
          onPrevious={() => pagination.onPageChange(pagination.page - 1)}
          onNext={() => pagination.onPageChange(pagination.page + 1)}
        />
      )}
    </div>
  )
}

