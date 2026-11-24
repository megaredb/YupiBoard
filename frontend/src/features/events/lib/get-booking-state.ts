import type { BookingStatus, EventRead } from "@/shared/api/generated/model";
import { hasEventStarted } from "@/features/events/lib/has-event-started";

export type BookingState =
  | "open"
  | "hosting"
  | "closed"
  | "approved"
  | "attended"
  | "waitlist"
  | "pending"
  | "rejected"
  | "full";

interface BookingStateInput {
  event: Pick<EventRead, "organizer_id" | "status" | "available_seats" | "start_datetime">;
  userId: string | null;
  /** Status of the signed-in user's newest booking for this event. */
  bookingStatus: BookingStatus | null;
}

const BOOKING_STATES: Partial<Record<BookingStatus, BookingState>> = {
  Pending: "pending",
  Confirmed: "approved",
  Attended: "attended",
  Waitlist: "waitlist",
  Rejected: "rejected",
  RemovedByOrganizer: "rejected",
};

const CANCELLABLE_STATES: ReadonlySet<BookingState> = new Set(["pending", "approved", "waitlist"]);

export function getBookingState({ event, userId, bookingStatus }: BookingStateInput): BookingState {
  if (userId && userId === event.organizer_id) return "hosting";
  const fromBooking = bookingStatus && BOOKING_STATES[bookingStatus];
  if (fromBooking) return fromBooking;
  if (event.status !== "Published" || hasEventStarted(event)) return "closed";
  if (event.available_seats <= 0) return "full";
  return "open";
}

/** The backend refuses cancelling once the event has started. */
export function canCancelBooking(
  state: BookingState,
  event: Pick<EventRead, "start_datetime">,
): boolean {
  return CANCELLABLE_STATES.has(state) && !hasEventStarted(event);
}

export function canApplyBooking(state: BookingState): boolean {
  return state === "open";
}

export function getParticipantsViewer(state: BookingState): "host" | "participant" | null {
  if (state === "hosting") return "host";
  if (state === "approved" || state === "attended") return "participant";
  return null;
}
