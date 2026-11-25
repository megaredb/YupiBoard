import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@/shared/components/breadcrumbs";
import { PageContainer } from "@/shared/layout/page-container";
import { cn } from "@/shared/lib/cn";
import { DisqualificationModal } from "@/features/events/components/event-details/disqualification-modal";
import { EventAbout } from "@/features/events/components/event-details/event-about";
import { EventActionButtons } from "@/features/events/components/event-details/event-action-buttons";
import { EventDetailsAside } from "@/features/events/components/event-details/event-details-aside";
import { EventParticipantsSection } from "@/features/events/components/event-details/event-participants-section";
import { EventRejectionNotice } from "@/features/events/components/event-details/event-rejection-notice";
import { EventSummary } from "@/features/events/components/event-details/event-summary";
import { MobileBookingBar } from "@/features/events/components/event-details/mobile-booking-bar";
import { MobileOrganizerRow } from "@/features/events/components/event-details/mobile-organizer-row";
import { OrganizerCard } from "@/features/events/components/event-details/organizer-card";
import { MobileTopBar } from "@/features/events/components/mobile-top-bar";
import { useBookingAction } from "@/features/events/hooks/use-booking-action";
import { useCancelEvent } from "@/features/events/hooks/use-cancel-event";
import { useCompleteEvent } from "@/features/events/hooks/use-complete-event";
import { useEventDetails } from "@/features/events/hooks/use-event-details";
import { useEventOrganizer } from "@/features/events/hooks/use-event-organizer";
import { useEventStream } from "@/features/events/hooks/use-event-stream";
import { useFavoriteToggle } from "@/features/events/hooks/use-favorite-toggle";
import { useGoBack } from "@/features/events/hooks/use-go-back";
import { useRefreshOnStart } from "@/features/events/hooks/use-refresh-on-start";
import { useShareEvent } from "@/features/events/hooks/use-share-event";
import { getParticipantsViewer } from "@/features/events/lib/get-booking-state";
import { useIsModerating } from "@/features/moderation";

const route = getRouteApi("/events/$eventId");

function EventBreadcrumbs({ title, isModerating }: { title: string; isModerating: boolean }) {
  const { t } = useTranslation();
  const parent = isModerating
    ? { label: t("shell.nav.moderation"), to: "/moderation" as const }
    : { label: t("shell.nav.events"), to: "/events" as const };

  return (
    <Breadcrumbs
      className="mb-6 hidden desktop:block"
      label={t("common.breadcrumbs")}
      items={[parent, { label: title }]}
    />
  );
}

export function EventDetailsPage() {
  const { eventId } = route.useParams();
  const event = useEventDetails(eventId);
  useEventStream(eventId);
  useRefreshOnStart(event);
  const booking = useBookingAction(event);
  const cancelEvent = useCancelEvent(event);
  const completeEvent = useCompleteEvent(event);
  const organizer = useEventOrganizer(event);
  const { isFavorite, toggleFavorite } = useFavoriteToggle(event);
  const shareEvent = useShareEvent(event);
  const goBack = useGoBack();
  const isHost = booking.state === "hosting";
  const isDisqualified = booking.state === "rejected";
  const isModerating = useIsModerating(event);
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
      <PageContainer
        className={cn(
          "max-desktop:p-0 max-desktop:pb-6 desktop:pb-12",
          isDisqualified && "pointer-events-none blur-md select-none",
        )}
      >
        <EventBreadcrumbs title={event.title} isModerating={isModerating} />
        <div className="desktop:grid desktop:grid-with-aside desktop:items-start desktop:gap-8">
          <div className="space-y-6">
            <EventSummary event={event} heroActions={renderActions("overlay")} />
            <div className="space-y-6 max-desktop:px-4">
              {isHost && <EventRejectionNotice event={event} />}
              <EventAbout description={event.description} />
              {participantsViewer && (
                <EventParticipantsSection event={event} viewer={participantsViewer} />
              )}
              {!isHost && <OrganizerCard organizer={organizer} />}
              {!isHost && <MobileOrganizerRow organizer={organizer} />}
            </div>
          </div>
          <EventDetailsAside
            event={event}
            isHost={isHost}
            isModerating={isModerating}
            booking={booking}
            cancelEvent={cancelEvent}
            completeEvent={completeEvent}
          />
        </div>
      </PageContainer>
      {!isDisqualified && !isModerating && (
        <MobileBookingBar
          event={event}
          action={booking}
          cancelEvent={cancelEvent}
          completeEvent={completeEvent}
        />
      )}
      {isDisqualified && <DisqualificationModal reason={event.user_booking_rejection_reason} />}
    </>
  );
}
