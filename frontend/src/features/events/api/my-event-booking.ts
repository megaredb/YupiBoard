// INTERIM: the backend must expose the signed-in user's booking for one event (e.g. `my_booking`
// on `EventRead`, or `GET /events/{id}/bookings/me`). Until then the newest page of
// `GET /bookings/me` is searched, so a booking older than the newest 100 is not found.
import { getListMyBookingsApiV1BookingsMeGetQueryOptions } from "@/shared/api/generated/endpoints/bookings/bookings";
import type {
  BookingRead,
  ListMyBookingsApiV1BookingsMeGetParams,
} from "@/shared/api/generated/model";

const INTERIM_PARAMS: ListMyBookingsApiV1BookingsMeGetParams = {
  limit: 100,
  sort_by: "date",
  sort_order: "desc",
};

export function myBookingsInterimQueryOptions() {
  return getListMyBookingsApiV1BookingsMeGetQueryOptions(INTERIM_PARAMS);
}

/** The newest booking of the event: the active one if there is one, as only one can be active. */
export function findEventBooking(bookings: BookingRead[], eventId: string): BookingRead | null {
  return bookings.find((booking) => booking.event_id === eventId) ?? null;
}
