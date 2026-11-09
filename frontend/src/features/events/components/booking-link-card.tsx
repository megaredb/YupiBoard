import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { BookingEventSummary, BookingStatus } from "@/shared/api/generated/model";
import { formatCardDate } from "@/shared/lib/format/format-date";
import { BookingStatusBadge } from "@/features/events/components/booking-status-badge";
import { EventCard } from "@/features/events/components/event-card";
import { getEventPrice } from "@/features/events/lib/get-event-price";

const EVENT_LINK_CLASS =
  "group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

interface BookingLinkCardProps {
  event: BookingEventSummary;
  status: BookingStatus;
}

/**
 * One booking of the signed-in user. `BookingEventSummary` has no seat counts or organizer, so
 * the card shows the booking status in their place.
 */
export function BookingLinkCard({ event, status }: BookingLinkCardProps) {
  const { t } = useTranslation();
  const price = getEventPrice(event);

  return (
    <Link to="/events/$eventId" params={{ eventId: event.id }} className={EVENT_LINK_CLASS}>
      <EventCard
        className="transition-shadow group-hover:shadow-md"
        title={event.title}
        imageUrl={event.photo_url ?? null}
        meta={{
          date: formatCardDate(event.start_datetime),
          location: event.location_name || event.address,
        }}
        price={{ isFree: price.isFree, label: price.isFree ? t("events.free") : price.formatted }}
        labels={{ promoted: null, status: <BookingStatusBadge status={status} /> }}
        participants={null}
        organizer={null}
      />
    </Link>
  );
}
