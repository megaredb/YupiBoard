import type { BookingStatus, EventRead } from "@/shared/api/generated/model";

export type BookingState =
  "open" | "hosting" | "closed" | "approved" | "waitlist" | "pending" | "full";

interface BookingStateInput {
  event: Pick<EventRead, "organizer_id" | "status" | "available_seats">;
  userId: string | null;
  /** Status returned by a booking request made in this session. */
  requestStatus: BookingStatus | null;
  /** The user applied earlier (remembered on this device). */
  hasApplied: boolean;
}

export function getBookingState({
  event,
  userId,
  requestStatus,
  hasApplied,
}: BookingStateInput): BookingState {
  if (userId && userId === event.organizer_id) return "hosting";
  if (event.status !== "Published") return "closed";
  if (requestStatus === "Confirmed") return "approved";
  if (requestStatus === "Waitlist") return "waitlist";
  if (requestStatus || hasApplied) return "pending";
  if (event.available_seats <= 0) return "full";
  return "open";
}
