import type { BookingStatus, EventRead } from "@/shared/api/generated/model";

export type BookingState =
  "open" | "hosting" | "closed" | "approved" | "waitlist" | "pending" | "rejected" | "full";

interface BookingStateInput {
  event: Pick<EventRead, "organizer_id" | "status" | "available_seats">;
  userId: string | null;
  /** Status of the signed-in user's newest booking for this event. */
  bookingStatus: BookingStatus | null;
}

const BOOKING_STATES: Partial<Record<BookingStatus, BookingState>> = {
  Pending: "pending",
  Confirmed: "approved",
  Waitlist: "waitlist",
  Rejected: "rejected",
  RemovedByOrganizer: "rejected",
};

/** States in which the player still holds a request or a seat they may give up. */
const CANCELLABLE_STATES: ReadonlySet<BookingState> = new Set(["pending", "approved", "waitlist"]);

export function getBookingState({ event, userId, bookingStatus }: BookingStateInput): BookingState {
  if (userId && userId === event.organizer_id) return "hosting";
  const fromBooking = bookingStatus && BOOKING_STATES[bookingStatus];
  if (fromBooking) return fromBooking;
  if (event.status !== "Published") return "closed";
  if (event.available_seats <= 0) return "full";
  return "open";
}

export function canCancelBooking(state: BookingState): boolean {
  return CANCELLABLE_STATES.has(state);
}

/** Who sees the participants block: the host manages requests, confirmed players see the table. */
export function getParticipantsViewer(state: BookingState): "host" | "participant" | null {
  if (state === "hosting") return "host";
  if (state === "approved") return "participant";
  return null;
}
