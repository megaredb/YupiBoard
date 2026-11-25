import type { EventRead } from "@/shared/api/generated/model";
import { BookingActions } from "@/features/events/components/event-details/booking-actions";
import { BookingPanel } from "@/features/events/components/event-details/booking-panel";
import { CancelEventButton } from "@/features/events/components/event-details/cancel-event-button";
import { CompleteEventButton } from "@/features/events/components/event-details/complete-event-button";
import { PlayersLink } from "@/features/events/components/event-details/players-link";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import type { CancelEventAction } from "@/features/events/hooks/use-cancel-event";
import type { CompleteEventAction } from "@/features/events/hooks/use-complete-event";
import { ModerationPanel } from "@/features/moderation";

interface EventDetailsAsideProps {
  event: EventRead;
  isHost: boolean;
  isModerating: boolean;
  booking: BookingAction;
  cancelEvent: CancelEventAction;
  completeEvent: CompleteEventAction;
}

export function EventDetailsAside({
  event,
  isHost,
  isModerating,
  booking,
  cancelEvent,
  completeEvent,
}: EventDetailsAsideProps) {
  if (isModerating) {
    // Unlike the booking panel, the decision has to be reachable on a phone as well.
    return (
      <aside className="max-desktop:px-4 desktop:sticky desktop:top-20">
        <ModerationPanel event={event} />
      </aside>
    );
  }

  return (
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
            {completeEvent.canComplete && (
              <CompleteEventButton action={completeEvent} className="w-full" />
            )}
          </div>
        ) : (
          <BookingActions event={event} action={booking} />
        )}
      </BookingPanel>
    </aside>
  );
}
