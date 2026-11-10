import type { BookingRead } from "@/shared/api/generated/model";
import type { ListState } from "@/shared/lib/list-state";
import { BookingLinkCard } from "@/features/events/components/booking-link-card";
import { EventCardGrid } from "@/features/events/components/event-card-grid";

interface BookingListProps {
  state: ListState<BookingRead>;
  empty: { title: string; description: string };
  isRefreshing: boolean;
}

export function BookingList({ state, empty, isRefreshing }: BookingListProps) {
  // `event` is optional in `BookingRead`, although `GET /bookings/me` always joins it.
  const renderCard = (booking: BookingRead) =>
    booking.event && (
      <BookingLinkCard key={booking.id} event={booking.event} status={booking.status} />
    );

  return (
    <EventCardGrid
      state={state}
      empty={empty}
      isRefreshing={isRefreshing}
      renderCard={renderCard}
    />
  );
}
