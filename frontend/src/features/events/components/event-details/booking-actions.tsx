import { BookingButton } from "@/features/events/components/event-details/booking-button";
import { BookingStatusNote } from "@/features/events/components/event-details/booking-status-note";
import { CancelBookingButton } from "@/features/events/components/event-details/cancel-booking-button";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";

/** The player's part of the booking card: apply, or see the request and give it up. */
export function BookingActions({ action }: { action: BookingAction }) {
  return (
    <div className="space-y-3">
      {action.canCancel ? (
        <>
          <BookingStatusNote state={action.state} />
          <CancelBookingButton action={action} className="w-full" />
        </>
      ) : (
        <BookingButton action={action} className="w-full" />
      )}
    </div>
  );
}
