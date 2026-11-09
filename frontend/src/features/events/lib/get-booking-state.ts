import type { BookingStatus, EventRead } from "@/shared/api/generated/model";

export type BookingState =
  "open" | "hosting" | "closed" | "approved" | "waitlist" | "pending" | "full";

interface BookingStateInput {
  event: Pick<EventRead, "organizer_id" | "status" | "available_seats">;
  userId: string | null;
  /**
   * Status returned by a booking request made on this page. `EventRead` does not carry the
   * signed-in user's own booking, so an earlier request is unknown here (backend contract gap).
   */
  requestStatus: BookingStatus | null;
}

export function getBookingState({ event, userId, requestStatus }: BookingStateInput): BookingState {
  if (userId && userId === event.organizer_id) return "hosting";
  if (event.status !== "Published") return "closed";
  if (requestStatus === "Confirmed") return "approved";
  if (requestStatus === "Waitlist") return "waitlist";
  if (requestStatus) return "pending";
  if (event.available_seats <= 0) return "full";
  return "open";
}
