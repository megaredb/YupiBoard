import type { BookingStatus, EventRead } from "@/shared/api/generated/model";
import { hasEventStarted } from "@/features/events/lib/has-event-started";

export type BookingState =
  | "open"
  | "hosting"
  | "closed"
  | "approved"
  /** Confirmed, the event has started, and the organizer hasn't marked attendance yet. */
  | "awaitingAttendance"
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

/**
 * Nobody can accept these after the start; the backend then cancels them on its next scheduled
 * run, so until then they already read as closed.
 */
const OPEN_REQUEST_STATES: ReadonlySet<BookingState> = new Set(["pending", "waitlist"]);

/** The state the player's own booking puts them in, or null without one. */
function getStateFromBooking(
  bookingStatus: BookingStatus | null,
  hasStarted: boolean,
): BookingState | null {
  const fromBooking = bookingStatus ? BOOKING_STATES[bookingStatus] : undefined;
  if (!fromBooking) return null;
  if (!hasStarted) return fromBooking;
  if (fromBooking === "approved") return "awaitingAttendance";
  return OPEN_REQUEST_STATES.has(fromBooking) ? "closed" : fromBooking;
}

export function getBookingState({ event, userId, bookingStatus }: BookingStateInput): BookingState {
  if (userId && userId === event.organizer_id) return "hosting";
  const hasStarted = hasEventStarted(event);
  const fromBooking = getStateFromBooking(bookingStatus, hasStarted);
  if (fromBooking) return fromBooking;
  if (event.status !== "Published" || hasStarted) return "closed";
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

/** A full table still takes applications: the backend puts them on the waitlist. */
export function canApplyBooking(state: BookingState): boolean {
  return state === "open" || state === "full";
}

export function getParticipantsViewer(state: BookingState): "host" | "participant" | null {
  if (state === "hosting") return "host";
  if (state === "approved" || state === "awaitingAttendance" || state === "attended") {
    return "participant";
  }
  return null;
}
