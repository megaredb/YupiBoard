import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@/shared/components/breadcrumbs";
import { PageContainer } from "@/shared/layout/page-container";
import { BookingActions } from "@/features/events/components/event-details/booking-actions";
import { BookingPanel } from "@/features/events/components/event-details/booking-panel";
import { EventAbout } from "@/features/events/components/event-details/event-about";
import { EventActionButtons } from "@/features/events/components/event-details/event-action-buttons";
import { EventParticipantsSection } from "@/features/events/components/event-details/event-participants-section";
import { EventSummary } from "@/features/events/components/event-details/event-summary";
import { MobileBookingBar } from "@/features/events/components/event-details/mobile-booking-bar";
import { MobileOrganizerRow } from "@/features/events/components/event-details/mobile-organizer-row";
import { OrganizerCard } from "@/features/events/components/event-details/organizer-card";
import { PlayersLink } from "@/features/events/components/event-details/players-link";
import { MobileTopBar } from "@/features/events/components/mobile-top-bar";
import { useBookingAction } from "@/features/events/hooks/use-booking-action";
import { useEventDetails } from "@/features/events/hooks/use-event-details";
import { useEventOrganizer } from "@/features/events/hooks/use-event-organizer";
import { useFavoriteToggle } from "@/features/events/hooks/use-favorite-toggle";
import { useGoBack } from "@/features/events/hooks/use-go-back";
import { useShareEvent } from "@/features/events/hooks/use-share-event";
import { getParticipantsViewer } from "@/features/events/lib/get-booking-state";

const route = getRouteApi("/events/$eventId");

export function EventDetailsPage() {
  const { t } = useTranslation();
  const { eventId } = route.useParams();
  const event = useEventDetails(eventId);
  const booking = useBookingAction(event);
  const organizer = useEventOrganizer(event);
  const { isFavorite, toggleFavorite } = useFavoriteToggle(event);
  const shareEvent = useShareEvent(event);
  const goBack = useGoBack();
  const isHost = booking.state === "hosting";
  const participantsViewer = getParticipantsViewer(booking.state);

  const renderActions = (placement: "overlay" | "bar") => (
    <EventActionButtons
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      onShare={shareEvent}
      placement={placement}
    />
  );

  return (
    <>
      <MobileTopBar onBack={goBack} actions={renderActions("bar")} />
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
              {participantsViewer && (
                <EventParticipantsSection event={event} viewer={participantsViewer} />
              )}
              <OrganizerCard organizer={organizer} />
              <MobileOrganizerRow organizer={organizer} />
            </div>
          </div>
          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <BookingPanel event={event} isHost={isHost}>
              {isHost ? (
                <PlayersLink eventId={event.id} className="w-full" />
              ) : (
                <BookingActions action={booking} />
              )}
            </BookingPanel>
          </aside>
        </div>
      </PageContainer>
      <MobileBookingBar event={event} action={booking} />
    </>
  );
}
