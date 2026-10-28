import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useListEventsApiV1EventsGet } from "@/api/endpoints/events/events"
import { EventList } from "@/components/EventList"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { buttonVariants } from "@/components/ui/button-variants"
import { EVENTS_PAGE_SIZE, useSavedEventIds } from "@/lib/events"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"

export type EventCollectionType = "hosted" | "booked" | "favorites"

interface EventCollectionPageProps {
  collection: EventCollectionType
}

const PAGE_COPY = {
  hosted: {
    title: "events.myEvents.title",
    count: "events.myEvents.found",
    emptyTitle: "events.myEvents.emptyTitle",
    emptyDescription: "events.myEvents.emptyDescription",
  },
  booked: {
    title: "events.myBookings.title",
    count: "events.myBookings.found",
    emptyTitle: "events.myBookings.emptyTitle",
    emptyDescription: "events.myBookings.emptyDescription",
  },
  favorites: {
    title: "events.favorites.title",
    count: "events.favorites.found",
    emptyTitle: "events.favorites.emptyTitle",
    emptyDescription: "events.favorites.emptyDescription",
  },
} as const

export function EventCollectionPage({ collection }: EventCollectionPageProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const user = useAuthStore((state) => state.user)
  const favoriteIds = useSavedEventIds("favorites")
  const bookedIds = useSavedEventIds("bookings")

  // Load all available events to filter by collection criteria
  const query = useListEventsApiV1EventsGet({ limit: 100 })
  const copy = PAGE_COPY[collection]
  const isHostedEvents = collection === "hosted"

  const filteredEvents = useMemo(() => {
    const items = query.data?.items ?? []
    if (collection === "hosted") {
      return items.filter((event) => event.organizer.id === user?.id)
    }
    if (collection === "booked") {
      return items.filter((event) => bookedIds.includes(event.id))
    }
    return items.filter((event) => favoriteIds.includes(event.id))
  }, [query.data?.items, collection, user?.id, bookedIds, favoriteIds])

  const total = filteredEvents.length
  const totalPages = Math.max(1, Math.ceil(total / EVENTS_PAGE_SIZE))
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * EVENTS_PAGE_SIZE
    return filteredEvents.slice(start, start + EVENTS_PAGE_SIZE)
  }, [filteredEvents, page])

  return (
    <PageContainer size="wide">
      <PageHeader
        title={t(copy.title)}
        aside={
          isHostedEvents ? (
            <Link
              to="/events/new"
              className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 lg:hidden")}
            >
              <Plus aria-hidden />
              {t("nav.createEvent")}
            </Link>
          ) : undefined
        }
      />
      <div className="mt-6">
        <EventList
          events={query.isPending ? undefined : paginatedItems}
          isPending={query.isPending}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          showOrganizer={collection === "booked" || collection === "favorites"}
          countLabel={total > 0 ? t(copy.count, { count: total }) : undefined}
          emptyTitle={t(copy.emptyTitle)}
          emptyDescription={t(copy.emptyDescription)}
          pagination={{
            page,
            pageSize: EVENTS_PAGE_SIZE,
            total,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </div>
    </PageContainer>
  )
}
