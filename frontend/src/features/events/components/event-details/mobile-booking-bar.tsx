import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { BookingButton } from "@/features/events/components/event-details/booking-button";
import { CancelBookingButton } from "@/features/events/components/event-details/cancel-booking-button";
import { CancelEventButton } from "@/features/events/components/event-details/cancel-event-button";
import { CompleteEventButton } from "@/features/events/components/event-details/complete-event-button";
import { PlayersLink } from "@/features/events/components/event-details/players-link";
import { PriceLabel } from "@/features/events/components/event-details/price-label";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import type { CancelEventAction } from "@/features/events/hooks/use-cancel-event";
import type { CompleteEventAction } from "@/features/events/hooks/use-complete-event";
import { BOOKING_STATE_LABEL_KEYS } from "@/features/events/lib/booking-state-label-keys";
import { getAttendancePhase } from "@/features/events/lib/get-attendance-phase";
import { getEventPrice } from "@/features/events/lib/get-event-price";
import { RateOrganizer } from "@/features/reviews";

interface MobileBookingBarProps {
  event: EventRead;
  action: BookingAction;
  cancelEvent: CancelEventAction;
  completeEvent: CompleteEventAction;
}

const ACTION_CLASS =
  "h-auto min-h-11 min-w-0 flex-1 px-2.5 py-1.5 text-center text-sm leading-tight whitespace-normal";

function MobileCallToAction({ event, action, cancelEvent, completeEvent }: MobileBookingBarProps) {
  if (action.state === "hosting") {
    return (
      <div className="flex flex-1 items-stretch gap-2">
        <PlayersLink eventId={event.id} isCompact className={ACTION_CLASS} />
        {cancelEvent.canCancel && (
          <CancelEventButton
            action={cancelEvent}
            confirmedCount={event.current_confirmed}
            isCompact
            className={ACTION_CLASS}
          />
        )}
        {completeEvent.canComplete && (
          <CompleteEventButton action={completeEvent} isCompact className={ACTION_CLASS} />
        )}
      </div>
    );
  }
  if (action.state === "attended" || action.state === "awaitingAttendance") {
    return (
      <RateOrganizer
        eventId={event.id}
        hasAttended={action.state === "attended"}
        isWindowOpen={getAttendancePhase(event) === "open"}
        showCaption={false}
        className="min-w-0 flex-1"
      />
    );
  }
  if (action.canCancel) return <CancelBookingButton action={action} className={ACTION_CLASS} />;
  return <BookingButton action={action} className={ACTION_CLASS} />;
}

export function MobileBookingBar({
  event,
  action,
  cancelEvent,
  completeEvent,
}: MobileBookingBarProps) {
  const { t } = useTranslation();
  const seatsLabel =
    event.available_seats > 0 ? t("events.booking.seatsAvailableShort") : t("events.booking.full");
  const showsStateLabel =
    action.canCancel ||
    action.state === "closed" ||
    action.state === "pending" ||
    action.state === "waitlist" ||
    action.state === "rejected" ||
    action.state === "attended" ||
    action.state === "awaitingAttendance";

  return (
    <div
      data-slot="action-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md desktop:hidden"
    >
      <div className="px-4 pt-3 pb-safe">
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="min-w-0">
            <PriceLabel price={getEventPrice(event)} className="text-xl" />
            <p className="truncate text-xs text-muted-foreground">
              {showsStateLabel ? t(BOOKING_STATE_LABEL_KEYS[action.state]) : seatsLabel}
            </p>
          </div>
          <MobileCallToAction
            event={event}
            action={action}
            cancelEvent={cancelEvent}
            completeEvent={completeEvent}
          />
        </div>
      </div>
    </div>
  );
}
