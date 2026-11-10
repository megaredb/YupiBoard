import { useTranslation } from "react-i18next";
import type { BookingRead, BookingStatus } from "@/shared/api/generated/model";
import { buildPaginationPages } from "@/shared/lib/pagination/build-pagination-pages";
import { getPageRange } from "@/shared/lib/pagination/get-page-range";
import { Pagination } from "@/shared/ui/pagination";
import { BookingStatusBadge } from "@/features/events/components/booking-status-badge";
import { BookingDecisionButtons } from "@/features/events/components/event-details/booking-decision-buttons";
import { ParticipantListState } from "@/features/events/components/event-details/participant-list-state";
import { ParticipantRow } from "@/features/events/components/event-details/participant-row";
import { useBookingDecision } from "@/features/events/hooks/use-booking-decision";
import { useBookingsPage } from "@/features/events/hooks/use-bookings-page";
import { useEventBookings } from "@/features/events/hooks/use-event-bookings";
import { EVENT_BOOKINGS_PAGE_SIZE } from "@/features/events/schemas/event-details-search.schema";
import { getFullName } from "@/features/users";

interface HostBookingListProps {
  eventId: string;
  status: BookingStatus;
  emptyText: string;
}

export function HostBookingList({ eventId, status, emptyText }: HostBookingListProps) {
  const { t } = useTranslation();
  const { page, goToPage } = useBookingsPage();
  const bookings = useEventBookings(eventId, status === "Pending" ? page : 1, status);
  const decision = useBookingDecision(eventId);

  const renderBooking = (booking: BookingRead) => {
    const participant = booking.user ?? { id: booking.user_id };
    const playerName = getFullName(participant) ?? t("events.participants.unnamed");
    const canDecide = booking.status === "Pending" || booking.status === "Confirmed";
    const aside = canDecide ? (
      <BookingDecisionButtons
        playerName={playerName}
        showAccept={booking.status === "Pending"}
        isPending={decision.pendingBookingId === booking.id}
        isDisabled={decision.pendingBookingId !== null}
        onDecide={(isApproved) => decision.decide(booking.id, isApproved)}
      />
    ) : (
      <BookingStatusBadge status={booking.status} />
    );
    return <ParticipantRow key={booking.id} participant={participant} aside={aside} />;
  };

  return (
    <div className="space-y-4">
      <ParticipantListState
        state={bookings.list}
        emptyText={emptyText}
        renderItem={renderBooking}
      />
      {status === "Pending" && bookings.total !== null && bookings.totalPages > 1 && (
        <Pagination
          pages={buildPaginationPages(page, bookings.totalPages)}
          currentPage={page}
          totalPages={bookings.totalPages}
          summary={t("events.participants.pagination", {
            ...getPageRange(page, EVENT_BOOKINGS_PAGE_SIZE, bookings.total),
            total: bookings.total,
          })}
          labels={{
            navigation: t("common.pagination.label"),
            previous: t("common.pagination.previous"),
            next: t("common.pagination.next"),
          }}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}
