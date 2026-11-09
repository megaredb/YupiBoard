import type { BookingState } from "@/features/events/lib/get-booking-state";

/** Call-to-action or status text of each booking state (ORG-6: components translate state). */
export const BOOKING_STATE_LABEL_KEYS = {
  open: "events.booking.apply",
  hosting: "events.booking.hosting",
  closed: "events.booking.closed",
  approved: "events.booking.approved",
  waitlist: "events.booking.waitlist",
  pending: "events.booking.pending",
  rejected: "events.booking.rejected",
  full: "events.booking.full",
} as const satisfies Record<BookingState, string>;
