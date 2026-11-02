import { getRouteApi } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { PageContainer } from "@/shared/layout/page-container"
import { useFavoriteToggle } from "@/features/saved-events"
import { BookingPanel } from "@/features/events/components/booking-panel"
import { EventAbout } from "@/features/events/components/event-about"
import { EventActionButtons } from "@/features/events/components/event-action-buttons"
import { EventMobileTopBar } from "@/features/events/components/event-mobile-top-bar"
import { EventSummary } from "@/features/events/components/event-summary"
import { MobileBookingBar } from "@/features/events/components/mobile-booking-bar"
import { OrganizerCard } from "@/features/events/components/organizer-card"
import { OrganizerRow } from "@/features/events/components/organizer-row"
import { useBookingAction } from "@/features/events/hooks/use-booking-action"
import { useEventDetails } from "@/features/events/hooks/use-event-details"
import { useEventOrganizer } from "@/features/events/hooks/use-event-organizer"
import { useGoBack } from "@/features/events/hooks/use-go-back"
import { useShareEvent } from "@/features/events/hooks/use-share-event"

const route = getRouteApi("/events/$eventId")

export function EventDetailsPage() {
  const { t } = useTranslation()
  const { eventId } = route.useParams()
  const event = useEventDetails(eventId)
  const booking = useBookingAction(event)
  const organizer = useEventOrganizer(event)
  const { isFavorite, toggleFavorite } = useFavoriteToggle(event.id)
  const shareEvent = useShareEvent(event)
  const goBack = useGoBack()

  const renderActions = (placement: "overlay" | "bar") => (
    <EventActionButtons
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      onShare={shareEvent}
      placement={placement}
    />
  )

  return (
    <>
      <EventMobileTopBar onBack={goBack} actions={renderActions("bar")} />
      <PageContainer className="max-lg:p-0 max-lg:pb-32 lg:pb-12">
        <Breadcrumbs
          className="mb-6 hidden lg:block"
          label={t("common.breadcrumbs")}
          items={[{ label: t("shell.nav.events"), to: "/events" }, { label: event.title }]}
        />
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <EventSummary event={event} heroActions={renderActions("overlay")} />
            <div className="space-y-6 max-lg:px-4">
              <EventAbout description={event.description} />
              <OrganizerCard organizer={organizer} />
              <OrganizerRow organizer={organizer} />
            </div>
          </div>
          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <BookingPanel event={event} action={booking} />
          </aside>
        </div>
      </PageContainer>
      <MobileBookingBar event={event} action={booking} />
    </>
  )
}
