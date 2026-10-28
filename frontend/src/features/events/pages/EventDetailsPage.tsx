import { getRouteApi, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { PageContainer } from "@/components/layout/PageContainer"
import { StatusMessage } from "@/components/shared/StatusMessage"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvent } from "../api"
import { BookingCard } from "../components/details/BookingCard"
import { EventAbout } from "../components/details/EventAbout"
import { EventFacts } from "../components/details/EventFacts"
import { EventHero } from "../components/details/EventHero"
import { MobileBookingBar } from "../components/details/MobileBookingBar"
import { OrganizerCard } from "../components/details/OrganizerCard"

const route = getRouteApi("/_app/events/$eventId")

function DetailsSkeleton() {
  return (
    <div aria-busy className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}

export function EventDetailsPage() {
  const { t } = useTranslation()
  const { eventId } = route.useParams()
  const { data: event, isPending, isError, refetch } = useEvent(eventId)

  if (isPending) {
    return (
      <PageContainer>
        <DetailsSkeleton />
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer size="narrow">
        <StatusMessage
          title={t("events.details.notFound")}
          description={t("events.details.notFoundDescription")}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                {t("common.retry")}
              </Button>
              <Link to="/events" className={buttonVariants({ size: "sm" })}>
                {t("events.details.backToEvents")}
              </Link>
            </div>
          }
        />
      </PageContainer>
    )
  }

  return (
    <>
      <PageContainer className="max-lg:p-0 max-lg:pb-28 lg:pb-12">
        <div className="mb-6 hidden lg:block">
          <Breadcrumbs
            items={[
              { label: t("events.details.home"), to: "/" },
              { label: t("nav.events"), to: "/events" },
              { label: event.title },
            ]}
          />
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <div className="lg:space-y-5 lg:rounded-xl lg:bg-card lg:p-3 lg:ring-1 lg:ring-foreground/10">
              <EventHero event={event} />
              <div className="space-y-5 px-4 pt-4 lg:px-6 lg:pb-6">
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{event.title}</h1>
                <div className="border-t pt-5">
                  <EventFacts event={event} />
                </div>
              </div>
            </div>

            <div className="space-y-4 max-lg:px-4">
              <EventAbout description={event.description} />
              <OrganizerCard organizer={event.organizer} />
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <BookingCard event={event} />
          </aside>
        </div>
      </PageContainer>

      <MobileBookingBar event={event} />
    </>
  )
}
