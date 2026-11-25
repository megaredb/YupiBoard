import type { EventRead } from "@/shared/api/generated/model";
import { BookingButton } from "@/features/events/components/event-details/booking-button";
import { BookingStatusNote } from "@/features/events/components/event-details/booking-status-note";
import { CancelBookingButton } from "@/features/events/components/event-details/cancel-booking-button";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import { getAttendancePhase } from "@/features/events/lib/get-attendance-phase";
import { RateOrganizer } from "@/features/reviews";

interface BookingActionsProps {
  event: EventRead;
  action: BookingAction;
}

export function BookingActions({ event, action }: BookingActionsProps) {
  if (action.state === "attended" || action.state === "awaitingAttendance") {
    const hasAttended = action.state === "attended";
    return (
      <div className="space-y-3">
        {!hasAttended && <BookingStatusNote state={action.state} />}
        <RateOrganizer
          eventId={event.id}
          hasAttended={hasAttended}
          isWindowOpen={getAttendancePhase(event) === "open"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {action.canCancel ? (
        <>
          <BookingStatusNote state={action.state} />
          <CancelBookingButton action={action} className="w-full" />
        </>
      ) : (
        <>
          {action.state === "rejected" && <BookingStatusNote state={action.state} />}
          <BookingButton action={action} className="w-full" />
        </>
      )}
    </div>
  );
}
