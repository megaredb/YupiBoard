import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { useEventCollection } from "../api"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { EventListSection } from "../components/EventListSection"
import type { EventCollection } from "../mocks/server"

interface EventCollectionPageProps {
  collection: EventCollection
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
  const query = useEventCollection(collection, page)
  const copy = PAGE_COPY[collection]
  const isHostedEvents = collection === "hosted"

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
        <EventListSection
          query={query}
          onPageChange={setPage}
          showOrganizer={collection === "booked" || collection === "favorites"}
          countLabel={(count) => t(copy.count, { count })}
          emptyTitle={t(copy.emptyTitle)}
          emptyDescription={t(copy.emptyDescription)}
        />
      </div>
    </PageContainer>
  )
}
