import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@/shared/components/breadcrumbs";
import { PageContainer } from "@/shared/layout/page-container";
import { BookingActions } from "@/features/events/components/event-details/booking-actions";
import { BookingPanel } from "@/features/events/components/event-details/booking-panel";
import { CancelEventButton } from "@/features/events/components/event-details/cancel-event-button";
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
import { useCancelEvent } from "@/features/events/hooks/use-cancel-event";
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
  const cancelEvent = useCancelEvent(event);
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
      <PageContainer className="max-desktop:p-0 max-desktop:pb-6 desktop:pb-12">
        <Breadcrumbs
          className="mb-6 hidden desktop:block"
          label={t("common.breadcrumbs")}
          items={[{ label: t("shell.nav.events"), to: "/events" }, { label: event.title }]}
        />
        <div className="desktop:grid desktop:grid-with-aside desktop:items-start desktop:gap-8">
          <div className="space-y-6">
            <EventSummary event={event} heroActions={renderActions("overlay")} />
            <div className="space-y-6 max-desktop:px-4">
              <EventAbout description={event.description} />
              {participantsViewer && (
                <EventParticipantsSection event={event} viewer={participantsViewer} />
              )}
              {!isHost && <OrganizerCard organizer={organizer} />}
              {!isHost && <MobileOrganizerRow organizer={organizer} />}
            </div>
          </div>
          <aside className="hidden desktop:sticky desktop:top-20 desktop:block">
            <BookingPanel event={event} isHost={isHost}>
              {isHost ? (
                <div className="space-y-3">
                  <PlayersLink eventId={event.id} className="w-full" />
                  {cancelEvent.canCancel && (
                    <CancelEventButton
                      action={cancelEvent}
                      confirmedCount={event.current_confirmed}
                      className="w-full"
                    />
                  )}
                </div>
              ) : (
                <BookingActions action={booking} />
              )}
            </BookingPanel>
          </aside>
        </div>
      </PageContainer>
      <MobileBookingBar event={event} action={booking} cancelEvent={cancelEvent} />
    </>
  );
}
